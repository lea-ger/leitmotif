<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Peer, { type DataConnection } from 'peerjs'
import { PEER_OPTIONS } from '../utils/peerConfig'

const route = useRoute()
const router = useRouter()
const roomId = ref<string>((route.params.roomId as string) || '')
const status = ref<string>('Idle')
const isConnected = ref(false)
const isPermitted = ref(false)
const peer = ref<Peer | null>(null)
let conn: DataConnection | null = null

// latest sensor values
const ax = ref(0), ay = ref(0), az = ref(0)
const alpha = ref(0), beta = ref(0), gamma = ref(0)
let sendTimer: number | null = null

async function requestPermissions() {
  // iOS 13+ requires user gesture
  try {
    const DM: any = (window as any).DeviceMotionEvent
    if (DM && typeof DM.requestPermission === 'function') {
      const res = await DM.requestPermission()
      if (res !== 'granted') {
        status.value = 'Motion permission denied'
        return false
      }
    }
    const DO: any = (window as any).DeviceOrientationEvent
    if (DO && typeof DO.requestPermission === 'function') {
      try { await DO.requestPermission() } catch {}
    }
  } catch (e) {
    // ignore
  }
  isPermitted.value = true
  return true
}

function startSensors() {
  if (!isPermitted.value) return
  const onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity || e.acceleration
    if (a) {
      ax.value = a.x || 0
      ay.value = a.y || 0
      az.value = a.z || 0
    }
  }
  const onOrient = (e: DeviceOrientationEvent) => {
    alpha.value = (e.alpha ?? 0) as number
    beta.value = (e.beta ?? 0) as number
    gamma.value = (e.gamma ?? 0) as number
  }
  window.addEventListener('devicemotion', onMotion)
  window.addEventListener('deviceorientation', onOrient)

  // store to remove
  ;(startSensors as any)._onMotion = onMotion
  ;(startSensors as any)._onOrient = onOrient

  if (sendTimer) window.clearInterval(sendTimer)
  sendTimer = window.setInterval(() => {
    if (conn && conn.open) {
      conn.send({ ax: ax.value, ay: ay.value, az: az.value, alpha: alpha.value, beta: beta.value, gamma: gamma.value })
    }
  }, 20)
}

function stopSensors() {
  const onMotion = (startSensors as any)._onMotion
  const onOrient = (startSensors as any)._onOrient
  if (onMotion) window.removeEventListener('devicemotion', onMotion)
  if (onOrient) window.removeEventListener('deviceorientation', onOrient)
  if (sendTimer) { window.clearInterval(sendTimer); sendTimer = null }
}

function connect() {
  if (!roomId.value) { status.value = 'Enter a Host ID'; return }
  status.value = 'Connecting...'
  const p = new Peer(PEER_OPTIONS)
  peer.value = p

  p.on('open', () => {
    const c = p.connect(roomId.value)
    conn = c
    c.on('open', () => {
      isConnected.value = true
      status.value = 'Connected. Streaming sensors.'
      c.send({ type: 'hello' })
    })
    c.on('error', (e) => {
      status.value = 'Connection error: ' + String(e)
    })
    c.on('close', () => {
      isConnected.value = false
      status.value = 'Disconnected'
    })
  })

  p.on('error', (err) => {
    status.value = 'Peer error: ' + String(err)
  })
}

function disconnect() {
  conn?.close(); conn = null
  peer.value?.disconnect(); peer.value?.destroy(); peer.value = null
  isConnected.value = false
}

async function start() {
  const ok = await requestPermissions()
  if (!ok) return
  startSensors()
  connect()
}

watch(() => route.params.roomId, (rid) => {
  if (typeof rid === 'string') roomId.value = rid
})

onMounted(() => {
  // auto-start if roomId in URL; still need a user gesture for iOS, so only request on button
})

onBeforeUnmount(() => {
  stopSensors()
  disconnect()
})
</script>

<template>
  <main class="p-6 max-w-xl mx-auto flex flex-col gap-4">
    <h1 class="text-3xl font-bold">Client</h1>
    <p class="opacity-70">{{ status }}</p>

    <div class="flex items-center gap-2">
      <input class="input input-bordered flex-1" v-model="roomId" placeholder="Host ID" />
      <button class="btn" @click="router.push(`/client/${encodeURIComponent(roomId)}`)" :disabled="!roomId">Set</button>
    </div>

    <div class="flex gap-3">
      <button class="btn btn-primary" @click="start" :disabled="!roomId || isConnected">{{ isConnected ? 'Streaming' : 'Start' }}</button>
      <button class="btn" @click="disconnect" :disabled="!isConnected">Stop</button>
    </div>

    <section class="grid grid-cols-2 gap-2 text-sm">
      <div class="p-2 bg-base-100 rounded">ax: {{ ax.toFixed(2) }}</div>
      <div class="p-2 bg-base-100 rounded">ay: {{ ay.toFixed(2) }}</div>
      <div class="p-2 bg-base-100 rounded">az: {{ az.toFixed(2) }}</div>
      <div class="p-2 bg-base-100 rounded">alpha: {{ alpha.toFixed(1) }}</div>
      <div class="p-2 bg-base-100 rounded">beta: {{ beta.toFixed(1) }}</div>
      <div class="p-2 bg-base-100 rounded">gamma: {{ gamma.toFixed(1) }}</div>
    </section>

    <p class="text-xs opacity-70">Tip: On iOS, you must tap "Start" to grant motion permissions.</p>
  </main>
</template>

<style scoped>

</style>
