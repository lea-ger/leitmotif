import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import * as Tone from 'tone'

/**
 * Tone.js Synthesizer Node
 * Converts numeric input to audio output
 */
export class ToneSynthNode extends BaseNode {
  private synth: Tone.Synth | null = null
  private lastTriggerTime: number = 0
  private minTriggerInterval: number = 50 // ms
  
  constructor(id?: string) {
    super('tone-synth', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'tone-synth',
      category: NodeCategory.PROCESSOR,
      displayName: 'Tone Synth',
      description: 'Generates audio from numeric input using Tone.js',
      color: '#10b981',
      icon: '🎵'
    }
  }

  initialize(): void {
    // Inputs
    this.addInput('frequency', DataType.NUMERIC)
    this.addInput('trigger', DataType.NUMERIC) // Trigger note when value changes significantly
    this.addInput('volume', DataType.NUMERIC) // -60 to 0 dB
    
    // Output
    this.addOutput('audio', DataType.AUDIO)
    
    // Parameters
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
    
    this.synth = new Tone.Synth({
      oscillator: { type: oscType },
      envelope: { attack, decay, sustain, release }
    })
    
    // Don't connect to destination yet - will be handled by AudioOutputNode
  }

  process(): void {
    if (!this.synth) return
    
    const frequency = this.getInputValue('frequency')
    const trigger = this.getInputValue('trigger')
    const volume = this.getInputValue('volume')
    
    // Update volume if provided
    if (volume !== undefined) {
      this.synth.volume.value = Math.max(-60, Math.min(0, volume))
    }
    
    // Trigger note if trigger value is high enough and enough time has passed
    const now = Date.now()
    if (frequency !== undefined && trigger !== undefined && trigger > 0.5) {
      if (now - this.lastTriggerTime > this.minTriggerInterval) {
        const freq = Math.max(20, Math.min(20000, frequency))
        this.synth.triggerAttackRelease(freq, '8n')
        this.lastTriggerTime = now
      }
    }
    
    // Output the synth instance (AudioOutputNode will connect it)
    this.setOutputValue('audio', this.synth)
  }

  cleanup(): void {
    if (this.synth) {
      this.synth.dispose()
      this.synth = null
    }
  }
}
