/**
 * Canvas serialization utilities for sending OffscreenCanvas frames over WebRTC.
 *
 * Strategy: read raw RGBA ImageData → ArrayBuffer.
 * This is synchronous and allocation-free compared to toBlob(), avoiding async
 * issues inside the 60fps process() loop. The receiver uses ImageData + putImageData
 * to reconstruct. For large canvases you can reduce resolution via the scale param.
 */

/**
 * Convert an OffscreenCanvas to a transferable ArrayBuffer (raw RGBA ImageData).
 * Returns null if the canvas has no content or context is unavailable.
 */
export function offscreenToBuffer(
  canvas: OffscreenCanvas,
  maxDimension = 320
): { buffer: ArrayBuffer; width: number; height: number } | null {
  try {
    const srcW = canvas.width
    const srcH = canvas.height
    if (srcW === 0 || srcH === 0) return null

    // Scale down if necessary to save bandwidth
    const scale = Math.min(1, maxDimension / Math.max(srcW, srcH))
    const w = Math.round(srcW * scale)
    const h = Math.round(srcH * scale)

    // Draw into a temporary OffscreenCanvas at target size
    const tmp = new OffscreenCanvas(w, h)
    const ctx = tmp.getContext('2d')!
    ctx.drawImage(canvas, 0, 0, w, h)

    const imageData = ctx.getImageData(0, 0, w, h)
    return { buffer: imageData.data.buffer.slice(0), width: w, height: h }
  } catch {
    return null
  }
}

/**
 * Reconstruct an ImageBitmap from a received buffer.
 * Used on the client side to render a received canvas frame.
 */
export async function bufferToImageBitmap(
  buffer: ArrayBuffer,
  width: number,
  height: number
): Promise<ImageBitmap | null> {
  try {
    const data = new Uint8ClampedArray(buffer)
    const imageData = new ImageData(data, width, height)
    return await createImageBitmap(imageData)
  } catch {
    return null
  }
}

/**
 * Creates a throttled frame sender.
 * Returns a function that accepts an OffscreenCanvas and a send callback.
 * Calls the send callback at most `fps` times per second; skips frames in between.
 */
export function createThrottledCanvasSender(fps = 15) {
  const intervalMs = 1000 / fps
  let lastSentAt = 0

  return function maybeSend(
    canvas: OffscreenCanvas,
    send: (payload: { buffer: ArrayBuffer; width: number; height: number }) => void,
    maxDimension = 320
  ): void {
    const now = performance.now()
    if (now - lastSentAt < intervalMs) return
    const result = offscreenToBuffer(canvas, maxDimension)
    if (!result) return
    lastSentAt = now
    send(result)
  }
}
