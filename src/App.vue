<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen w-screen bg-base-100">
    <header class="navbar p-4 flex items-center justify-between border-b">
      <RouterLink to="/" class="font-bold">Leitmotif</RouterLink>
      <nav class="flex gap-3">
        <RouterLink to="/host">Host</RouterLink>
        <RouterLink to="/client">Client</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>

<style scoped>
</style>
