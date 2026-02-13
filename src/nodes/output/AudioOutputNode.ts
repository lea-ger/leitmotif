import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import * as Tone from 'tone'

/**
 * Audio Output Node
 * Connects audio sources to speakers
 */
export class AudioOutputNode extends BaseNode {
  private connectedSources: Set<Tone.ToneAudioNode> = new Set()
  private lastAudioSource: Tone.ToneAudioNode | null = null
  
  constructor(id?: string) {
    super('audio-output', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'audio-output',
      category: NodeCategory.OUTPUT,
      displayName: 'Audio Output',
      description: 'Outputs audio to speakers',
      color: '#10b981',
      icon: '🔊'
    }
  }

  initialize(): void {
    // Input
    this.addInput('audio', DataType.AUDIO)
    
    // Parameters
    this.addParameter({
      id: 'volume',
      name: 'Master Volume',
      type: 'number',
      defaultValue: -12,
      min: -60,
      max: 0,
      step: 1
    })
    
    this.addParameter({
      id: 'muted',
      name: 'Muted',
      type: 'boolean',
      defaultValue: false
    })
  }

  process(): void {
    const audioSource = this.getInputValue('audio')
    const volume = this.getParameter('volume')
    const muted = this.getParameter('muted')
    
    // If muted, disconnect everything
    if (muted) {
      if (this.connectedSources.size > 0) {
        this.connectedSources.forEach(source => {
          try {
            source.disconnect()
          } catch (e) {
            // Source might already be disconnected
          }
        })
        this.connectedSources.clear()
        this.lastAudioSource = null
      }
      return
    }
    
    // Check if audio source has changed
    const isSameSource = audioSource === this.lastAudioSource
    
    // Only reconnect if source changed
    if (!isSameSource) {
      // Disconnect all previous sources
      this.connectedSources.forEach(source => {
        try {
          source.disconnect()
        } catch (e) {
          // Source might already be disconnected
        }
      })
      this.connectedSources.clear()
      this.lastAudioSource = null
      
      // Connect new source if available
      if (audioSource && audioSource instanceof Tone.ToneAudioNode) {
        try {
          // Only connect if audio context is running
          if (Tone.getContext().state === 'running') {
            audioSource.toDestination()
            this.connectedSources.add(audioSource)
            this.lastAudioSource = audioSource
          }
        } catch (e) {
          console.error('Failed to connect audio source:', e)
        }
      }
    }
    
    // Update volume on connected source
    if (this.lastAudioSource && 'volume' in this.lastAudioSource && this.lastAudioSource.volume) {
      (this.lastAudioSource as any).volume.value = volume
    }
  }

  cleanup(): void {
    // Disconnect all sources
    this.connectedSources.forEach(source => {
      try {
        source.disconnect()
      } catch (e) {
        // Ignore
      }
    })
    this.connectedSources.clear()
    this.lastAudioSource = null
  }
}
