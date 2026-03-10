<template>
  <div class="flex flex-col h-full gap-4 p-4">
    <!-- Canvas frame from host (if any) -->
    <div v-if="receivedFrame" class="rounded-lg overflow-hidden border border-base-content/20 bg-black flex-1">
      <canvas ref="canvasEl" class="w-full h-full object-contain" />
    </div>

    <!-- Sensor readout -->
    <section class="grid grid-cols-3 gap-2 text-xs shrink-0">
      <div class="p-2 bg-base-200 rounded text-center">
        <div class="opacity-50 mb-0.5">ax</div>
        <div class="font-mono font-bold">{{ ax.toFixed(1) }}</div>
      </div>
      <div class="p-2 bg-base-200 rounded text-center">
        <div class="opacity-50 mb-0.5">ay</div>
        <div class="font-mono font-bold">{{ ay.toFixed(1) }}</div>
      </div>
      <div class="p-2 bg-base-200 rounded text-center">
        <div class="opacity-50 mb-0.5">az</div>
        <div class="font-mono font-bold">{{ az.toFixed(1) }}</div>
      </div>
      <div class="p-2 bg-base-200 rounded text-center">
        <div class="opacity-50 mb-0.5">α</div>
        <div class="font-mono font-bold">{{ alpha.toFixed(0) }}°</div>
      </div>
      <div class="p-2 bg-base-200 rounded text-center">
        <div class="opacity-50 mb-0.5">β</div>
        <div class="font-mono font-bold">{{ beta.toFixed(0) }}°</div>
      </div>
      <div class="p-2 bg-base-200 rounded text-center">
        <div class="opacity-50 mb-0.5">γ</div>
        <div class="font-mono font-bold">{{ gamma.toFixed(0) }}°</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  receivedFrame: ImageBitmap | null
  ax: number; ay: number; az: number
  alpha: number; beta: number; gamma: number
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)

watch(() => props.receivedFrame, (frame) => {
  if (!frame || !canvasEl.value) return
  const el = canvasEl.value
  el.width  = frame.width
  el.height = frame.height
  el.getContext('2d')?.drawImage(frame, 0, 0)
})
</script>
