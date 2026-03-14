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

const {
  status, statusMessage, isConnected,
  activeLayout, receivedFrame, hapticPulse,
  ax, ay, az, alpha, beta, gamma,
  start, disconnect, send
} = useClientConnection()

watch(() => route.params.roomId, (rid) => {
  if (typeof rid === 'string') roomId.value = rid
})

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
      <input
          class="input input-bordered input-sm flex-1"
          v-model="roomId"
          placeholder="Host ID"
          :disabled="isConnected"
      />
      <button
          class="btn btn-sm"
          @click="router.push(`/client/${encodeURIComponent(roomId)}`)"
          :disabled="!roomId || isConnected"
      >Set
      </button>
      <button
          class="btn btn-sm btn-primary"
          @click="start(roomId)"
          :disabled="!roomId || isConnected"
      >
        <Icon icon="ph:plug"/>
      </button>
      <button
          class="btn btn-sm btn-ghost"
          @click="disconnect"
          :disabled="!isConnected"
      >
        <Icon icon="ph:plug-slash"/>
      </button>
    </footer>
  </div>
</template>

<style scoped>
</style>
