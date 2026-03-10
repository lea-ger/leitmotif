<template>
  <div class="flex flex-col h-full select-none touch-none overflow-hidden bg-base-300">
    <!-- Octave controls -->
    <div class="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-content/10 shrink-0">
      <button class="btn btn-xs btn-ghost" @click="octave = Math.max(1, octave - 1)">− Oct</button>
      <span class="text-sm font-semibold">Octave {{ octave }}</span>
      <button class="btn btn-xs btn-ghost" @click="octave = Math.min(7, octave + 1)">+ Oct</button>
    </div>

    <!-- Piano keys -->
    <div class="relative flex-1 flex" ref="keyboardEl">
      <!-- White keys -->
      <div
        v-for="key in whiteKeys"
        :key="key.note"
        class="relative flex-1 border border-base-content/20 rounded-b-md flex items-end justify-center pb-2 cursor-pointer transition-colors"
        :class="pressedNotes.has(key.note) ? 'bg-primary/30' : 'bg-white'"
        @pointerdown.prevent="noteOn(key)"
        @pointerup.prevent="noteOff(key)"
        @pointerleave="noteOff(key)"
      >
        <span class="text-[9px] text-gray-400 pointer-events-none">{{ key.label }}</span>
      </div>

      <!-- Black keys (absolutely positioned) -->
      <div
        v-for="key in blackKeys"
        :key="key.note"
        class="absolute top-0 rounded-b-md cursor-pointer z-10 flex items-end justify-center pb-1 transition-colors"
        :class="pressedNotes.has(key.note) ? 'bg-primary' : 'bg-base-content'"
        :style="key.style"
        @pointerdown.prevent="noteOn(key)"
        @pointerup.prevent="noteOff(key)"
        @pointerleave="noteOff(key)"
      >
        <span class="text-[8px] text-base-content/30 pointer-events-none">{{ key.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ClientToHostMessage } from '../../stores/types/peer'

const emit = defineEmits<{ send: [msg: ClientToHostMessage] }>()
const octave = ref(4)
const pressedNotes = ref<Set<string>>(new Set())

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const WHITE_PATTERN = ['C','D','E','F','G','A','B']
const BLACK_OFFSETS: Record<string, number> = { 'C#': 1, 'D#': 2, 'F#': 4, 'G#': 5, 'A#': 6 }

function noteToFrequency(note: string, oct: number): number {
  const semitone = NOTE_NAMES.indexOf(note)
  // A4 = 440 Hz, midi note 69 = A4 = octave 4, semitone 9
  const midi = (oct + 1) * 12 + semitone
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const whiteKeys = computed(() =>
  WHITE_PATTERN.map(name => ({
    note: `${name}${octave.value}`,
    name,
    label: name === 'C' ? `${name}${octave.value}` : name,
    frequency: noteToFrequency(name, octave.value)
  }))
)

// Black key positions: 7 white keys → each is (100/7)% wide
// Black keys sit between specific white keys
const blackKeys = computed(() => {
  const keys: { note: string; name: string; label: string; frequency: number; style: Record<string, string> }[] = []
  const w = 100 / 7 // percent width of one white key
  for (const [name, whiteIdx] of Object.entries(BLACK_OFFSETS)) {
    const left = (whiteIdx - 0.35) * w
    keys.push({
      note: `${name}${octave.value}`,
      name,
      label: name,
      frequency: noteToFrequency(name.replace('#',''), octave.value) * Math.pow(2, 1/12),
      style: {
        left: `${left}%`,
        width: `${w * 0.6}%`,
        height: '60%'
      }
    })
  }
  return keys
})

function noteOn(key: { note: string; frequency: number }) {
  pressedNotes.value = new Set([...pressedNotes.value, key.note])
  emit('send', { type: 'keydown', note: key.note, frequency: key.frequency, velocity: 0.8 })
}

function noteOff(key: { note: string }) {
  const s = new Set(pressedNotes.value)
  s.delete(key.note)
  pressedNotes.value = s
  emit('send', { type: 'keyup', note: key.note })
}
</script>
