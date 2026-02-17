<script setup lang="ts">
import { ref } from 'vue'

const roomId = ref('')
</script>

<template>
  <main class="min-h-screen w-screen flex flex-col items-center justify-center gap-8 p-6">
    <h1 class="text-6xl font-bold">Leitmotif</h1>
    <h2 class="text-2xl opacity-80">The Decentralized Orchestra</h2>

    <div class="flex gap-4 mt-6">
      <router-link to="/editor" class="btn btn-primary">Start as Host</router-link>
      <div class="flex items-center gap-2">
        <input class="input input-bordered" v-model="roomId" placeholder="Enter Host ID" />
        <router-link
          v-if="roomId"
          :to="`/client/${encodeURIComponent(roomId)}`"
          class="btn"
          custom
        >
          Join as Client
        </router-link>
        <button
          v-else
          class="btn cursor-not-allowed opacity-50"
          disabled
        >
          Join as Client
        </button>
      </div>
    </div>

    <p class="max-w-xl text-center opacity-70 mt-4">
      Host creates a room and shows a QR code. Smartphones scan the code to join and stream their motion sensors.
      The host maps the crowd's motion to sound via Web Audio.
    </p>
  </main>
</template>

<style scoped>
</style>
