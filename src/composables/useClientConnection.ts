import { ref, readonly } from 'vue'
import Peer, { type DataConnection, type MediaConnection } from 'peerjs'
import { PEER_OPTIONS } from '../utils/peerConfig'
import type { ClientToHostMessage, HostToClientMessage, LayoutName } from '../stores/types/peer'
import { bufferToImageBitmap } from '../utils/canvasSerial'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Composable managing a client's PeerJS connection to the host.
 * Handles incoming HostToClientMessages and exposes reactive state.
 */
export function useClientConnection() {
  const status = ref<ConnectionStatus>('idle')
  const statusMessage = ref('Idle')
  const isConnected = ref(false)
  const activeLayout = ref<LayoutName>('empty')

  // Last received canvas frame (as ImageBitmap, ready to draw)
  const receivedFrame = ref<ImageBitmap | null>(null)
  // Haptic pulse indicator (increments on each haptic, for UI animation)
  const hapticPulse = ref(0)
  // Web Audio context (lazy-init on first audio trigger)
  let audioCtx: AudioContext | null = null

  let peer: Peer | null = null
  let conn: DataConnection | null = null
  let mediaCall: MediaConnection | null = null
  let remoteAudioEl: HTMLAudioElement | null = null
  let sendTimer: number | null = null
  let heartbeatTimer: number | null = null

  // Sensor values (still sent every 20ms)
  const ax = ref(0), ay = ref(0), az = ref(0)
  const alpha = ref(0), beta = ref(0), gamma = ref(0)

  // -------------------------------------------------------------------------
  // Outgoing: sensor data
  // -------------------------------------------------------------------------

  function startSensors() {
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity || e.acceleration
      if (a) { ax.value = a.x || 0; ay.value = a.y || 0; az.value = a.z || 0 }
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      alpha.value = (e.alpha ?? 0) as number
      beta.value  = (e.beta  ?? 0) as number
      gamma.value = (e.gamma ?? 0) as number
    }
    window.addEventListener('devicemotion', onMotion)
    window.addEventListener('deviceorientation', onOrient)
    ;(startSensors as any)._onMotion = onMotion
    ;(startSensors as any)._onOrient = onOrient

    if (sendTimer) window.clearInterval(sendTimer)
    sendTimer = window.setInterval(() => {
      send({ type: 'sensors', ax: ax.value, ay: ay.value, az: az.value,
             alpha: alpha.value, beta: beta.value, gamma: gamma.value })
    }, 20)
  }

  function stopSensors() {
    const onMotion = (startSensors as any)._onMotion
    const onOrient = (startSensors as any)._onOrient
    if (onMotion) window.removeEventListener('devicemotion', onMotion)
    if (onOrient) window.removeEventListener('deviceorientation', onOrient)
    if (sendTimer) { window.clearInterval(sendTimer); sendTimer = null }
  }

  // -------------------------------------------------------------------------
  // Send helper (layout events go through here too)
  // -------------------------------------------------------------------------

  function send(msg: ClientToHostMessage) {
    if (conn?.open) conn.send(msg)
  }

  // -------------------------------------------------------------------------
  // Incoming: host → client message dispatch
  // -------------------------------------------------------------------------

  async function handleHostMessage(msg: HostToClientMessage) {
    switch (msg.type) {
      case 'canvas': {
        const bmp = await bufferToImageBitmap(msg.buffer, msg.width, msg.height)
        if (bmp) receivedFrame.value = bmp
        break
      }
      case 'haptic': {
        hapticPulse.value++

        if ('vibrate' in navigator) navigator.vibrate(msg.pattern)
        break
      }
      case 'audioTrigger': {
        playAudioTrigger(msg.frequency, msg.duration, msg.volume, msg.waveform)
        break
      }
      case 'layout': {
        activeLayout.value = msg.layout
        localStorage.setItem('leitmotif-client-layout', msg.layout)
        break
      }
    }
  }

  function playAudioTrigger(
    frequency: number, duration: number, volume: number, waveform: OscillatorType
  ) {
    try {
      if (!audioCtx) audioCtx = new AudioContext()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = waveform
      osc.frequency.value = frequency
      gain.gain.value = Math.max(0, Math.min(1, volume))
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + duration)
    } catch (e) {
      console.warn('[client] Audio trigger failed:', e)
    }
  }

  // -------------------------------------------------------------------------
  // Connection lifecycle
  // -------------------------------------------------------------------------

  async function requestPermissions(): Promise<boolean> {
    try {
      const DM: any = (window as any).DeviceMotionEvent
      if (DM && typeof DM.requestPermission === 'function') {
        const res = await DM.requestPermission()
        if (res !== 'granted') { statusMessage.value = 'Motion permission denied'; return false }
      }
      const DO: any = (window as any).DeviceOrientationEvent
      if (DO && typeof DO.requestPermission === 'function') {
        try { await DO.requestPermission() } catch {}
      }
    } catch {}
    return true
  }

  function connect(roomId: string) {
    if (!roomId) { statusMessage.value = 'No room ID'; return }
    status.value = 'connecting'
    statusMessage.value = 'Connecting…'

    const p = new Peer(PEER_OPTIONS)
    peer = p

    p.on('call', (call: MediaConnection) => {
      try {
        call.answer()
      } catch (e) {
        console.warn('[client] Failed to answer media call:', e)
        return
      }

      mediaCall = call

      call.on('stream', (stream: MediaStream) => {
        if (!remoteAudioEl) {
          remoteAudioEl = document.createElement('audio')
          remoteAudioEl.autoplay = true
          remoteAudioEl.setAttribute('playsinline', 'true')
          remoteAudioEl.style.display = 'none'
          document.body.appendChild(remoteAudioEl)
        }
        remoteAudioEl.srcObject = stream
        remoteAudioEl.play().catch(err => {
          console.warn('[client] Remote audio autoplay blocked:', err)
        })
      })

      call.on('close', () => {
        mediaCall = null
        if (remoteAudioEl) {
          remoteAudioEl.srcObject = null
        }
      })

      call.on('error', (err) => {
        console.warn('[client] Media call error:', err)
      })
    })

    p.on('open', () => {
      const c = p.connect(roomId)
      conn = c

      c.on('open', () => {
        isConnected.value = true
        status.value = 'connected'
        statusMessage.value = 'Connected'
        c.send({ type: 'hello' } satisfies ClientToHostMessage)
        startSensors()

        // Start heartbeat (2s)
        if (heartbeatTimer) clearInterval(heartbeatTimer)
        heartbeatTimer = window.setInterval(() => {
          if (conn?.open) conn.send({ type: 'heartbeat' } satisfies ClientToHostMessage)
        }, 2000)
      })

      c.on('data', (payload: unknown) => {
        handleHostMessage(payload as HostToClientMessage)
      })

      c.on('close', () => {
        isConnected.value = false
        status.value = 'disconnected'
        statusMessage.value = 'Disconnected'
        stopSensors()
        if (heartbeatTimer) clearInterval(heartbeatTimer)
      })

      c.on('error', (e) => {
        status.value = 'error'
        statusMessage.value = 'Connection error: ' + String(e)
      })
    })

    p.on('error', (err) => {
      status.value = 'error'
      statusMessage.value = 'Peer error: ' + String(err)
    })
  }

  function disconnect() {
    stopSensors()
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    if (mediaCall) {
      try { mediaCall.close() } catch {}
      mediaCall = null
    }
    if (remoteAudioEl) {
      remoteAudioEl.srcObject = null
      remoteAudioEl.remove()
      remoteAudioEl = null
    }
    conn?.close(); conn = null
    peer?.disconnect(); peer?.destroy(); peer = null
    isConnected.value = false
    status.value = 'disconnected'
    statusMessage.value = 'Disconnected'
  }

  async function start(roomId: string) {
    const ok = await requestPermissions()
    if (!ok) return
    connect(roomId)
  }

  // Restore saved layout on init
  const savedLayout = localStorage.getItem('leitmotif-client-layout') as LayoutName | null
  if (savedLayout) activeLayout.value = savedLayout

  return {
    status: readonly(status),
    statusMessage: readonly(statusMessage),
    isConnected: readonly(isConnected),
    activeLayout,
    receivedFrame: readonly(receivedFrame),
    hapticPulse: readonly(hapticPulse),
    ax: readonly(ax), ay: readonly(ay), az: readonly(az),
    alpha: readonly(alpha), beta: readonly(beta), gamma: readonly(gamma),
    start,
    disconnect,
    send
  }
}
