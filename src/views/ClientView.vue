<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {Icon} from '@iconify/vue'
import {useClientConnection} from '../composables/useClientConnection'
import LayoutEmpty from '../components/client/LayoutEmpty.vue'
import LayoutCanvas from '../components/client/LayoutCanvas.vue'
import LayoutKeyboard from '../components/client/LayoutKeyboard.vue'
import LayoutTouchpad from '../components/client/LayoutTouchpad.vue'
import type {ClientToHostMessage} from '../stores/types/peer'

const route = useRoute()
const router = useRouter()
const roomId = ref<string>((route.params.roomId as string) || '')
const roomCodeInput = ref('')

const {
  status, statusMessage, isConnected,
  activeLayout, receivedFrame, hapticPulse,
  ax, ay, az, alpha, beta, gamma,
  start, disconnect, send
} = useClientConnection()

watch(() => route.params.roomId, (rid) => {
  if (typeof rid === 'string') {
    roomId.value = rid
    roomCodeInput.value = formatRoomCode(rid)
  }
})

function normalizeRoomCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 8)
}

function formatRoomCode(input: string): string {
  const digits = normalizeRoomCode(input)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}-${digits.slice(4)}`
}

function onRoomCodeInput(value: string): void {
  const normalized = normalizeRoomCode(value)
  roomId.value = normalized
  roomCodeInput.value = formatRoomCode(normalized)
}

function connectWithRoomCode(): void {
  if (!roomId.value || isConnected.value) return
  router.push(`/client/${encodeURIComponent(roomId.value)}`)
  start(roomId.value)
}

// initialize formatted field
roomCodeInput.value = formatRoomCode(roomId.value)

const statusColor = computed(() => ({
  idle: 'badge-ghost',
  connecting: 'badge-warning',
  connected: 'badge-success',
  disconnected: 'badge-error',
  error: 'badge-error'
}[status.value]))

const layoutComponent = computed(() => ({
  empty: LayoutEmpty,
  canvas: LayoutCanvas,
  keyboard: LayoutKeyboard,
  touchpad: LayoutTouchpad
}[activeLayout.value]))

const layoutIcon = computed(() => ({
  empty: 'ph:house',
  canvas: 'ph:paint-brush',
  keyboard: 'ph:piano-keys',
  touchpad: 'ph:hand-tap'
}[activeLayout.value]))

// Haptic flash animation
const hapticFlash = ref(false)
watch(hapticPulse, () => {
  hapticFlash.value = true
  setTimeout(() => {
    hapticFlash.value = false
  }, 300)
})

function forwardSend(msg: ClientToHostMessage) {
  send(msg)
}

// Also forward new input capability data to host via sensor-style update
// (keyboard, draw, touchpad events are sent directly by layout components)
</script>

<template>
  <div class="flex flex-col h-dvh overflow-hidden bg-base-100">
    <main v-if="!isConnected" class="flex-1 grid place-items-center p-6">
      <div class="w-full max-w-md rounded-2xl border border-base-content/10 bg-base-200 p-6 shadow-xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
            <Icon icon="ph:link-simple" class="text-xl" />
          </div>
          <div>
            <h1 class="text-lg font-semibold">Join Host</h1>
            <p class="text-xs text-base-content/60">Enter room code (format: XXXX-XXXX)</p>
          </div>
        </div>

        <input
          class="input input-bordered input-lg w-full text-center tracking-[0.35em] font-mono"
          :value="roomCodeInput"
          @input="onRoomCodeInput(($event.target as HTMLInputElement).value)"
          placeholder="0000-0000"
          inputmode="numeric"
          maxlength="9"
        />

        <button
          class="btn btn-primary btn-lg w-full mt-4 gap-2"
          :disabled="roomId.length !== 8"
          @click="connectWithRoomCode"
        >
          <Icon icon="ph:plug" />
          Connect
        </button>
      </div>
    </main>

    <template v-else>
    <!-- Header bar -->
    <header
        class="shrink-0 flex items-center gap-3 px-4 py-3 bg-base-200 border-b border-base-content/10"
        :class="hapticFlash ? 'bg-primary/20' : ''"
    >
      <Icon :icon="layoutIcon" class="text-xl opacity-70"/>
      <span class="font-semibold flex-1 text-sm capitalize">{{ activeLayout }}</span>
      <span :class="['badge badge-sm', statusColor]">{{ statusMessage }}</span>
    </header>

    <!-- Layout area -->
    <div class="flex-1 overflow-hidden relative">
      <component
          :is="layoutComponent"
          class="absolute inset-0"
          :received-frame="receivedFrame"
          :ax="ax" :ay="ay" :az="az"
          :alpha="alpha" :beta="beta" :gamma="gamma"
          @send="forwardSend"
      />
    </div>

    <!-- Footer controls -->
    <footer class="shrink-0 flex items-center gap-2 px-4 py-3 bg-base-200 border-t border-base-content/10">
      <button
          class="btn btn-sm btn-ghost"
          @click="disconnect"
          :disabled="!isConnected"
      >
        <Icon icon="ph:plug-slash"/>
        Disconnect
      </button>
    </footer>
    </template>
  </div>
</template>

<style scoped>
</style>
