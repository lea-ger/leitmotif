<template>
  <div
    class="relative flex-1 w-full h-full bg-base-300 select-none touch-none overflow-hidden"
    ref="padEl"
    @pointerdown.prevent="onDown"
    @pointermove.prevent="onMove"
    @pointerup.prevent="onUp"
    @pointercancel.prevent="onUp"
  >
    <!-- Grid lines -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-10" xmlns="http://www.w3.org/2000/svg">
      <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" stroke-width="1"/>
      <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" stroke-width="1"/>
      <line x1="25%" y1="0" x2="25%" y2="100%" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4"/>
      <line x1="75%" y1="0" x2="75%" y2="100%" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4"/>
      <line x1="0" y1="25%" x2="100%" y2="25%" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4"/>
      <line x1="0" y1="75%" x2="100%" y2="75%" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4"/>
    </svg>

    <!-- Axis labels -->
    <span class="absolute top-2 left-1/2 -translate-x-1/2 text-xs opacity-30">X</span>
    <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs opacity-30">Y</span>

    <!-- Value readout -->
    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 text-xs font-mono opacity-60">
      <span>x: {{ displayX }}</span>
      <span>y: {{ displayY }}</span>
      <span v-if="force > 0">f: {{ displayForce }}</span>
    </div>

    <!-- Touch indicator dot -->
    <div
      v-if="active"
      class="absolute w-10 h-10 rounded-full border-2 border-primary bg-primary/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform"
      :style="{ left: `${x * 100}%`, top: `${y * 100}%` }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ClientToHostMessage } from '../../stores/types/peer'

const emit = defineEmits<{ send: [msg: ClientToHostMessage] }>()
const padEl = ref<HTMLDivElement | null>(null)

const x = ref(0.5)
const y = ref(0.5)
const force = ref(0)
const active = ref(false)

const displayX     = computed(() => x.value.toFixed(3))
const displayY     = computed(() => y.value.toFixed(3))
const displayForce = computed(() => force.value.toFixed(2))

function getCoords(e: PointerEvent) {
  const el = padEl.value!
  const rect = el.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height)),
    f: e.pressure ?? 1
  }
}

function onDown(e: PointerEvent) {
  active.value = true
  const c = getCoords(e)
  x.value = c.x; y.value = c.y; force.value = c.f
  emit('send', { type: 'touchpad', x: c.x, y: c.y, force: c.f, active: true })
}

function onMove(e: PointerEvent) {
  if (!active.value) return
  const c = getCoords(e)
  x.value = c.x; y.value = c.y; force.value = c.f
  emit('send', { type: 'touchpad', x: c.x, y: c.y, force: c.f, active: true })
}

function onUp(_e: PointerEvent) {
  active.value = false
  force.value = 0
  emit('send', { type: 'touchpad', x: x.value, y: y.value, force: 0, active: false })
}
</script>
