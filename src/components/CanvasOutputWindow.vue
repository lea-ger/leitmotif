<template>
  <!--
    Peek panel anchored to the bottom-left.
    Collapsed: only the header peeks above the bottom edge (translateY = body height).
    Expanded: slides up to show header + canvas.
  -->
  <div
    class="fixed bottom-0 left-12 w-[480px] z-30 rounded-t-lg overflow-hidden
           border border-b-0 border-base-content/15 shadow-[0_-4px_24px_oklch(var(--bc)/0.1)]
           transition-transform duration-[250ms] ease-in-out"
    :class="isExpanded ? 'translate-y-0' : 'translate-y-[300px]'"
  >
    <!-- Header (always visible) -->
    <div
      class="h-10 bg-base-300 hover:bg-base-200 flex items-center gap-2 px-3
             cursor-pointer select-none border-b border-base-content/10 transition-colors"
      @click="isExpanded = !isExpanded"
    >
      <Icon icon="ph:monitor-play" class="text-primary" />
      <span class="text-sm font-semibold flex-1">Canvas Output</span>
      <span v-if="canvasStore.outputCanvas" class="text-xs text-base-content/50 mr-1">
        {{ canvasStore.outputCanvas.width }}×{{ canvasStore.outputCanvas.height }}
      </span>
      <button class="btn btn-xs btn-ghost btn-circle" title="Pop out" @click.stop="popOut">
        <Icon icon="ph:arrow-square-out" />
      </button>
      <Icon :icon="isExpanded ? 'ph:caret-down' : 'ph:caret-up'" class="text-base-content/50" />
    </div>

    <!-- Canvas body -->
    <div class="h-[300px] bg-black flex items-center justify-center overflow-hidden">
      <canvas ref="canvasEl" class="max-w-full max-h-full w-auto h-auto block" />
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
