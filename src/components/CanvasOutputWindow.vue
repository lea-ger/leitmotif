<template>
  <!--
    Peek panel anchored to the bottom-left.
    Collapsed: only the header (HEADER_H px) peeks above the bottom edge.
    Expanded: slides up to show header + canvas.
  -->
  <div class="canvas-panel" :class="{ 'is-expanded': isExpanded }">
    <!-- Header (always visible) -->
    <div class="panel-header" @click="isExpanded = !isExpanded">
      <Icon icon="ph:monitor-play" class="text-primary" />
      <span class="text-sm font-semibold flex-1">Canvas Output</span>
      <span v-if="canvasStore.outputCanvas" class="text-xs text-base-content/50 mr-2">
        {{ canvasStore.outputCanvas.width }}×{{ canvasStore.outputCanvas.height }}
      </span>
      <button class="btn btn-xs btn-ghost btn-circle" title="Pop out" @click.stop="popOut">
        <Icon icon="ph:arrow-square-out" />
      </button>
      <Icon
        :icon="isExpanded ? 'ph:caret-down' : 'ph:caret-up'"
        class="text-base-content/50"
      />
    </div>

    <!-- Canvas body -->
    <div class="panel-body">
      <canvas ref="canvasEl" class="panel-canvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useCanvasStore } from '../stores/canvasStore'

const canvasStore = useCanvasStore()
const canvasEl    = ref<HTMLCanvasElement | null>(null)
const isExpanded  = ref(false)

let rafId: number | null = null
let popupWindow: Window | null = null

function renderLoop() {
  const src = canvasStore.outputCanvas
  if (src && canvasEl.value) {
    const dst = canvasEl.value
    if (dst.width !== src.width || dst.height !== src.height) {
      dst.width  = src.width
      dst.height = src.height
    }
    const ctx = dst.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, dst.width, dst.height)
      ctx.drawImage(src, 0, 0)
    }
    if (popupWindow && !popupWindow.closed) {
      src.convertToBlob().then(blob => {
        if (blob && popupWindow && !popupWindow.closed)
          popupWindow.postMessage({ type: 'frame', blob }, '*')
      })
    }
  }
  rafId = requestAnimationFrame(renderLoop)
}

onMounted(() => { rafId = requestAnimationFrame(renderLoop) })
onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  popupWindow?.close()
})

function popOut() {
  if (popupWindow && !popupWindow.closed) { popupWindow.focus(); return }
  const w = canvasStore.outputCanvas?.width  || 800
  const h = canvasStore.outputCanvas?.height || 600
  popupWindow = window.open('', '_blank', `width=${w},height=${h + 40},menubar=no,toolbar=no,location=no`)
  if (!popupWindow) { console.warn('Popup blocked'); return }
  popupWindow.document.write(`
    <!DOCTYPE html><html>
    <head><title>Canvas Output</title>
    <style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;}
    canvas{max-width:100vw;max-height:100vh;object-fit:contain;}</style>
    </head><body><canvas id="c"></canvas>
    <script>
      const c=document.getElementById('c'),ctx=c.getContext('2d');
      window.addEventListener('message',async e=>{
        if(e.data?.type!=='frame')return;
        const bmp=await createImageBitmap(e.data.blob);
        c.width=bmp.width;c.height=bmp.height;ctx.drawImage(bmp,0,0);bmp.close();
      });
    <\/script></body></html>`)
  popupWindow.document.close()
}
</script>

<style scoped>
/* Body height constant — must match the translateY value below */
.canvas-panel {
  position: fixed;
  bottom: 0;
  left: 48px;
  width: 480px;
  z-index: 30;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  border: 1px solid oklch(var(--bc) / 0.15);
  border-bottom: none;
  box-shadow: 0 -4px 24px oklch(var(--bc) / 0.1);

  /* Collapsed: shift down by body height so only the 40px header peeks */
  transform: translateY(300px);
  transition: transform 0.25s ease;
}

.canvas-panel.is-expanded {
  transform: translateY(0);
}

.panel-header {
  height: 40px;
  background: oklch(var(--b3));
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid oklch(var(--bc) / 0.1);
}

.panel-header:hover {
  background: oklch(var(--b2));
}

.panel-body {
  height: 300px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Scale canvas to fit the panel body without distortion */
.panel-canvas {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
}
</style>

