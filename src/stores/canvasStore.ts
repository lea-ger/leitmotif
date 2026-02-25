import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'

/**
 * Holds the latest OffscreenCanvas produced by CanvasOutputNode each frame.
 * CanvasOutputWindow reads this to copy pixels to the visible <canvas> element.
 */
export const useCanvasStore = defineStore('canvas', () => {
  const outputCanvas = ref<OffscreenCanvas | null>(null)

  function setOutputCanvas(canvas: OffscreenCanvas) {
    outputCanvas.value = markRaw(canvas)
  }

  return { outputCanvas, setOutputCanvas }
})

