import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import * as Tone from 'tone'
import { markRaw } from 'vue'

/**
 * Tone.js Synthesizer Node
 * Converts numeric input to audio output
 */
export class ToneSynthNode extends BaseNode {
  private synth: Tone.Synth | null = null
  private isPlaying: boolean = false
  private lastOscillator: string = ''
  private lastAttack: number = 0
  private lastDecay: number = 0
  private lastSustain: number = 0
  private lastRelease: number = 0
  
  constructor(id?: string) {
    super('tone-synth', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'tone-synth',
      category: NodeCategory.PROCESSOR,
      displayName: 'Tone Synth',
      description: 'Generates continuous audio tone from frequency input',
      color: '#10b981',
      icon: 'ph:waveform'
    }
  }

  initialize(): void {
    // Inputs
    this.addInput('frequency', DataType.NUMERIC)
    this.addInput('gate', DataType.NUMERIC) // Gate on/off (> 0.5 = on)
    
    // Output
    this.addOutput('audio', DataType.AUDIO)
    
    // Parameters
    this.addParameter({
      id: 'mode',
      name: 'Mode',
      type: 'select',
      defaultValue: 'continuous',
      options: [
        { label: 'Continuous', value: 'continuous' },
        { label: 'Triggered', value: 'triggered' }
      ]
    })
    
    this.addParameter({
      id: 'oscillator',
      name: 'Oscillator Type',
      type: 'select',
      defaultValue: 'sine',
      options: [
        { label: 'Sine', value: 'sine' },
        { label: 'Square', value: 'square' },
        { label: 'Sawtooth', value: 'sawtooth' },
        { label: 'Triangle', value: 'triangle' }
      ]
    })
    
    this.addParameter({
      id: 'defaultFrequency',
      name: 'Default Frequency',
      type: 'number',
      defaultValue: 440,
      min: 20,
      max: 20000,
      step: 1
    })
    
    this.addParameter({
      id: 'volume',
      name: 'Volume',
      type: 'number',
      defaultValue: -12,
      min: -60,
      max: 0,
      step: 1
    })
    
    this.addParameter({
      id: 'attack',
      name: 'Attack',
      type: 'number',
      defaultValue: 0.02,
      min: 0.001,
      max: 2,
      step: 0.01
    })
    
    this.addParameter({
      id: 'decay',
      name: 'Decay',
      type: 'number',
      defaultValue: 0.2,
      min: 0.001,
      max: 2,
      step: 0.01
    })
    
    this.addParameter({
      id: 'sustain',
      name: 'Sustain',
      type: 'number',
      defaultValue: 0.3,
      min: 0,
      max: 1,
      step: 0.01
    })
    
    this.addParameter({
      id: 'release',
      name: 'Release',
      type: 'number',
      defaultValue: 0.8,
      min: 0.001,
      max: 5,
      step: 0.01
    })
    
    // Initialize Tone.js synth
    this.setupSynth()
  }

  private setupSynth(): void {
    const oscType = this.getParameter('oscillator')
    const attack = this.getParameter('attack')
    const decay = this.getParameter('decay')
    const sustain = this.getParameter('sustain')
    const release = this.getParameter('release')
    const volume = this.getParameter('volume')
    
    // Clean up old synth if it exists
    if (this.synth) {
      if (this.isPlaying) {
        this.synth.triggerRelease()
        this.isPlaying = false
      }
      this.synth.dispose()
    }
    
    // Mark as raw to prevent Vue reactivity wrapping
    this.synth = markRaw(new Tone.Synth({
      oscillator: { type: oscType },
      envelope: { attack, decay, sustain, release },
      volume: volume
    }))
    
    // Store current parameter values
    this.lastOscillator = oscType
    this.lastAttack = attack
    this.lastDecay = decay
    this.lastSustain = sustain
    this.lastRelease = release
  }
  
  private updateSynthParameters(): void {
    if (!this.synth) return
    
    const oscType = this.getParameter('oscillator')
    const attack = this.getParameter('attack')
    const decay = this.getParameter('decay')
    const sustain = this.getParameter('sustain')
    const release = this.getParameter('release')
    
    // Check if oscillator type changed (requires recreation)
    if (oscType !== this.lastOscillator) {
      this.setupSynth()
      return
    }
    
    // Update envelope parameters dynamically
    if (attack !== this.lastAttack) {
      this.synth.envelope.attack = attack
      this.lastAttack = attack
    }
    if (decay !== this.lastDecay) {
      this.synth.envelope.decay = decay
      this.lastDecay = decay
    }
    if (sustain !== this.lastSustain) {
      this.synth.envelope.sustain = sustain
      this.lastSustain = sustain
    }
    if (release !== this.lastRelease) {
      this.synth.envelope.release = release
      this.lastRelease = release
    }
  }

  process(): void {
    if (!this.synth) return
    
    // Update synth parameters if they changed
    this.updateSynthParameters()
    
    const mode = this.getParameter('mode')
    const frequency = this.getInputValue('frequency') ?? this.getParameter('defaultFrequency')
    const gate = this.getInputValue('gate')
    const volume = this.getParameter('volume')
    
    // Update volume
    this.synth.volume.value = volume
    
    if (mode === 'continuous') {
      // Continuous mode - plays as long as gate is high or no gate input
      const shouldPlay = gate === undefined || gate > 0.5
      
      if (shouldPlay && !this.isPlaying) {
        // Start playing
        const freq = Math.max(20, Math.min(20000, frequency))
        this.synth.triggerAttack(freq)
        this.isPlaying = true
      } else if (!shouldPlay && this.isPlaying) {
        // Stop playing
        this.synth.triggerRelease()
        this.isPlaying = false
      } else if (shouldPlay && this.isPlaying) {
        // Update frequency while playing
        const freq = Math.max(20, Math.min(20000, frequency))
        this.synth.frequency.setValueAtTime(freq, Tone.now())
      }
    } else {
      // Triggered mode - one-shot notes
      if (gate !== undefined && gate > 0.5 && !this.isPlaying) {
        const freq = Math.max(20, Math.min(20000, frequency))
        this.synth.triggerAttackRelease(freq, '4n')
        this.isPlaying = true
        // Reset playing state after a short delay
        setTimeout(() => { this.isPlaying = false }, 100)
      }
    }
    
    // Output the synth instance (marked as raw, won't be proxied)
    this.setOutputValue('audio', this.synth)
  }

  cleanup(): void {
    if (this.synth) {
      if (this.isPlaying) {
        this.synth.triggerRelease()
      }
      this.synth.dispose()
      this.synth = null
    }
    this.isPlaying = false
  }
}
