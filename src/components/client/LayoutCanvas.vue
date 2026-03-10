<template>
  <div class="flex flex-col h-full select-none touch-none">
    <!-- Canvas frame from host as background -->
    <canvas
      v-if="receivedFrame"
      ref="bgCanvasEl"
      class="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-40"
    />

    <!-- Full-screen draw canvas -->
    <canvas
      ref="drawCanvasEl"
      class="flex-1 w-full bg-base-300 cursor-crosshair relative"
      @pointerdown.prevent="onPointerDown"
      @pointermove.prevent="onPointerMove"
      @pointerup.prevent="onPointerUp"
      @pointercancel.prevent="onPointerUp"
    />

    <!-- Toolbar -->
    <div class="shrink-0 flex items-center gap-3 p-3 bg-base-200 border-t border-base-content/10">
      <label class="text-xs opacity-60">Color</label>
      <input type="color" v-model="strokeColor" class="w-8 h-8 rounded cursor-pointer border-0" />
      <label class="text-xs opacity-60">Size</label>
      <input type="range" v-model.number="strokeSize" min="1" max="40" class="range range-xs flex-1" />
      <span class="text-xs w-6 text-center">{{ strokeSize }}</span>
      <button class="btn btn-xs btn-ghost" @click="clearCanvas">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { ClientToHostMessage } from '../../stores/types/peer'

const props = defineProps<{
  receivedFrame: ImageBitmap | null
}>()
const emit = defineEmits<{ send: [msg: ClientToHostMessage] }>()

const drawCanvasEl = ref<HTMLCanvasElement | null>(null)
const bgCanvasEl = ref<HTMLCanvasElement | null>(null)
const strokeColor = ref('#ffffff')
const strokeSize = ref(4)
let isDrawing = false
let ctx: CanvasRenderingContext2D | null = null

onMounted(() => {
  const el = drawCanvasEl.value!
  ctx = el.getContext('2d')!
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

function resizeCanvas() {
  const el = drawCanvasEl.value!
  el.width  = el.clientWidth
  el.height = el.clientHeight
}

function clearCanvas() {
  if (!ctx || !drawCanvasEl.value) return
  ctx.clearRect(0, 0, drawCanvasEl.value.width, drawCanvasEl.value.height)
}

function getPos(e: PointerEvent) {
  const el = drawCanvasEl.value!
  const rect = el.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onPointerDown(e: PointerEvent) {
  isDrawing = true
  const { x, y } = getPos(e)
  ctx!.beginPath()
  ctx!.moveTo(x, y)
  emit('send', { type: 'draw', x, y, pressure: e.pressure ?? 1, phase: 'start' })
}

function onPointerMove(e: PointerEvent) {
  if (!isDrawing) return
  const { x, y } = getPos(e)
  ctx!.strokeStyle = strokeColor.value
  ctx!.lineWidth = strokeSize.value
  ctx!.lineCap = 'round'
  ctx!.lineJoin = 'round'
  ctx!.lineTo(x, y)
  ctx!.stroke()
  emit('send', { type: 'draw', x, y, pressure: e.pressure ?? 1, phase: 'move' })
}

function onPointerUp(e: PointerEvent) {
  if (!isDrawing) return
  isDrawing = false
  const { x, y } = getPos(e)
  emit('send', { type: 'draw', x, y, pressure: 0, phase: 'end' })
}

// Render received background frame
watch(() => props.receivedFrame, (frame) => {
  if (!frame || !bgCanvasEl.value) return
  const el = bgCanvasEl.value
  el.width  = frame.width
  el.height = frame.height
  el.getContext('2d')?.drawImage(frame, 0, 0)
})
</script>
