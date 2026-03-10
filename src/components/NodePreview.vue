<template>
  <div class="w-full border-t border-base-content/10 overflow-hidden rounded-b-md">
    <canvas
      ref="canvasEl"
      class="w-full block"
      :width="WIDTH"
      :height="HEIGHT"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { BaseNode } from '../nodes/BaseNode'
import { DataType } from '../nodes/types'

interface Props {
  node: BaseNode
  nodeColor: string
}

const props = defineProps<Props>()

const WIDTH  = 240
const HEIGHT = 96

const canvasEl = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

// Determine what kind of preview this node supports
const previewType = computed<'canvas' | 'waveform' | null>(() => {
  if (props.node.type === 'tone-synth') return 'waveform'
  const hasCanvas = props.node.getOutputPorts().some(p => p.dataType === DataType.CANVAS)
  if (hasCanvas) return 'canvas'
  return null
})

function draw() {
  const el = canvasEl.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  if (previewType.value === 'waveform') {
    drawWaveform(ctx)
  } else if (previewType.value === 'canvas') {
    drawCanvas(ctx)
  }

  rafId = requestAnimationFrame(draw)
}

function drawWaveform(ctx: CanvasRenderingContext2D) {
  const node = props.node as any
  const samples: Float32Array | null = typeof node.getWaveformValues === 'function'
    ? node.getWaveformValues()
    : null

  // Background
  ctx.fillStyle = 'oklch(0.2 0 0)'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Center line
  ctx.strokeStyle = `color-mix(in srgb, ${props.nodeColor} 20%, transparent)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, HEIGHT / 2)
  ctx.lineTo(WIDTH, HEIGHT / 2)
  ctx.stroke()

  if (!samples || samples.length === 0) return

  // Waveform
  ctx.strokeStyle = props.nodeColor
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i < samples.length; i++) {
    const x = (i / (samples.length - 1)) * WIDTH
    const y = ((1 - (samples[i] ?? 0)) / 2) * HEIGHT
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function drawCanvas(ctx: CanvasRenderingContext2D) {
  // Dark background in case source is transparent or missing
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const port = props.node.getOutputPorts().find(p => p.dataType === DataType.CANVAS)
  const offscreen = port?.value as OffscreenCanvas | null | undefined
  if (!offscreen) return

  try {
    // Letterbox-fit the offscreen canvas into the preview
    const srcW = offscreen.width
    const srcH = offscreen.height
    const scale = Math.min(WIDTH / srcW, HEIGHT / srcH)
    const dw = srcW * scale
    const dh = srcH * scale
    const dx = (WIDTH - dw) / 2
    const dy = (HEIGHT - dh) / 2
    ctx.drawImage(offscreen, dx, dy, dw, dh)
  } catch {
    // OffscreenCanvas may not be readable cross-origin; silently skip
  }
}

onMounted(() => {
  if (previewType.value) {
    rafId = requestAnimationFrame(draw)
  }
})

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>
