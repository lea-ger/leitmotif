<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Join Room</h3>
      
      <!-- Room Key Display -->
      <div class="text-center mb-4">
        <div class="text-sm opacity-70 mb-2">Room Key</div>
        <div class="text-4xl font-mono font-bold tracking-wider">
          {{ formattedRoomKey }}
        </div>
      </div>

      <!-- QR Code -->
      <div v-if="joinUrl" class="flex justify-center mb-4">
        <div class="border-4 border-base-300 rounded-lg p-4 bg-white">
          <QrcodeVue :value="joinUrl" :size="280" level="M" />
        </div>
      </div>

      <!-- Join URL -->
      <div class="mb-4">
        <div class="text-sm opacity-70 mb-2">Share this link:</div>
        <div class="flex gap-2">
          <input 
            type="text" 
            :value="joinUrl" 
            readonly 
            class="input input-bordered flex-1 text-xs"
          />
          <button 
            @click="copyToClipboard" 
            class="btn btn-square"
            :class="copied ? 'btn-success' : 'btn-ghost'"
          >
            {{ copied ? '✓' : '📋' }}
          </button>
        </div>
      </div>

      <!-- Instructions -->
      <div class="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <div class="text-sm">
          <div class="font-semibold">How to join:</div>
          <div>1. Scan QR code or visit the link on your mobile device</div>
          <div>2. Grant permissions for sensors (gyro, accelerometer, etc.)</div>
          <div>3. Start sending data to this session</div>
        </div>
      </div>

      <!-- Close Button -->
      <div class="modal-action">
        <button class="btn" @click="close">Close</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useSessionStore } from '../stores/sessionStore'

const dialogRef = ref<HTMLDialogElement | null>(null)
const copied = ref(false)

const sessionStore = useSessionStore()
const formattedRoomKey = computed(() => sessionStore.formattedRoomKey)
const joinUrl = computed(() => sessionStore.joinUrl)

function open() {
  dialogRef.value?.showModal()
}

function close() {
  dialogRef.value?.close()
  copied.value = false
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(joinUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard', err)
  }
}

defineExpose({ open, close })
</script>

<style scoped>
.modal-box {
  max-width: 500px;
}
</style>
