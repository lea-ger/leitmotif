import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'
import * as Tone from 'tone'

/**
 * Audio Output Node
 * Connects audio sources to speakers
 */
export class AudioOutputNode extends BaseNode {
  private connectedSources: Set<Tone.ToneAudioNode> = new Set()
  
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
    
    // Disconnect all previous sources
    this.connectedSources.forEach(source => {
      try {
        source.disconnect()
      } catch (e) {
        // Source might already be disconnected
      }
    })
    this.connectedSources.clear()
    
    // Connect new source if available and not muted
    if (audioSource && audioSource instanceof Tone.ToneAudioNode && !muted) {
      try {
        // Check if the audio source has a volume property
        if ('volume' in audioSource && audioSource.volume) {
          (audioSource as any).volume.value = volume
        }
        audioSource.toDestination()
        this.connectedSources.add(audioSource)
      } catch (e) {
        console.error('Failed to connect audio source:', e)
      }
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
  }
}
