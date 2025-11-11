<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import * as Tone from 'tone'
import Peer, { type DataConnection } from 'peerjs'

const peer = ref<Peer | null>(null)
const peerId = ref<string>('')
const connections = ref<DataConnection[]>([])
const isAudioStarted = ref(false)
const baseUrl = window.location.origin
const joinUrl = computed(() => peerId.value ? `${baseUrl}/client/${encodeURIComponent(peerId.value)}` : '')
const status = ref<string>('Initializing...')

// Tone.js setup
let synth: Tone.PolySynth | null = null
let meter: Tone.Meter | null = null

function setupTone() {
  if (isAudioStarted.value) return
  isAudioStarted.value = true
  // Ensure audio context is started by user gesture
  Tone.start()
  // Simple polysynth through a compressor + meter to master
  const comp = new Tone.Compressor({ threshold: -24, ratio: 6 })
  meter = new Tone.Meter({ channels: 2 })
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.8 }
  }).connect(comp).toDestination()
  comp.connect(meter)
}

function mapAndPlay(data: any) {
  if (!synth) return
  const { ax = 0, ay = 0, az = 0, alpha = 0, beta = 0, gamma = 0 } = data || {}
  const accelMag = Math.min(30, Math.sqrt(ax*ax + ay*ay + az*az))
  const freq = 100 + accelMag * 20 // 100 Hz to ~700 Hz
  const detune = (gamma || 0) * 10
  const vol = -24 + Math.min(24, accelMag) // -24 dB to 0 dB
  const time = Tone.now()
  // Trigger a short note when motion increases
  const vel = Math.min(1, accelMag / 20)
  // choose a pitch from beta orientation
  const midi = 48 + Math.round(((beta || 0) + 180) / 30) // map -180..180 to steps
  const note = Tone.Frequency(midi, 'midi').toFrequency()
  synth.set({ detune })
  synth.volume.value = vol
  synth.triggerAttackRelease([freq, note], 0.1, time, vel)
}

function initPeer() {
  status.value = 'Connecting to signaling server...'
  const p = new Peer(undefined, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 1,
  })
  peer.value = p

  p.on('open', (id) => {
    peerId.value = id
    status.value = 'Waiting for clients...'
  })

  p.on('connection', (conn) => {
    connections.value.push(conn)
    status.value = `Client connected (${connections.value.length})`

    conn.on('data', (data: any) => {
      if (data && data.type === 'hello') return
      mapAndPlay(data)
    })

    conn.on('close', () => {
      const idx = connections.value.indexOf(conn)
      if (idx >= 0) connections.value.splice(idx, 1)
      status.value = `Client disconnected (${connections.value.length})`
    })
  })

  p.on('disconnected', () => {
    status.value = 'Disconnected. Reconnecting...'
    try { p.reconnect() } catch {}
  })

  p.on('error', (err) => {
    console.error(err)
    status.value = `Error: ${String(err)}`
  })
}

onMounted(() => {
  initPeer()
})

onBeforeUnmount(() => {
  connections.value.forEach(c => c.close())
  peer.value?.disconnect()
  peer.value?.destroy()
})
</script>

<template>
  <main class="p-6 max-w-3xl mx-auto flex flex-col gap-6">
    <h1 class="text-3xl font-bold">Host</h1>
    <p class="opacity-70">{{ status }}</p>

    <div v-if="peerId" class="flex flex-col md:flex-row items-center gap-6">
      <div class="border p-4 rounded">
        <QrcodeVue v-if="joinUrl" :value="joinUrl" :size="220" level="M"/>
      </div>
      <div class="flex-1">
        <p class="mb-2">Share this link or QR with clients:</p>
        <code class="block p-2 bg-base-300 rounded break-all">{{ joinUrl }}</code>
        <p class="mt-2">Room ID: <strong>{{ peerId }}</strong></p>
        <button class="btn mt-4" @click="setupTone" :disabled="isAudioStarted">{{ isAudioStarted ? 'Audio Ready' : 'Start Audio' }}</button>
      </div>
    </div>

    <section class="mt-4">
      <h2 class="font-semibold">Connected clients: {{ connections.length }}</h2>
    </section>
  </main>
</template>

<style scoped>
.btn { @apply px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>
