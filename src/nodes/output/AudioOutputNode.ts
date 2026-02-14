import {BaseNode} from '../BaseNode'
import {DataType, NodeCategory, type NodeMetadata} from '../types'
import * as Tone from 'tone'

/**
 * Audio Output Node
 * Connects audio sources to speakers
 */
export class AudioOutputNode extends BaseNode {
  private currentSource: Tone.ToneAudioNode | null = null
  private isConnected: boolean = false
  
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
    
    // Handle source changes
    if (audioSource !== this.currentSource) {
      // Disconnect old source if exists
      if (this.currentSource && this.isConnected) {
        try {
          this.currentSource.disconnect()
          this.isConnected = false
        } catch (e) {
          // Already disconnected
        }
      }
      
      this.currentSource = null
      this.isConnected = false
      
      // Connect new source if valid
      if (audioSource && audioSource instanceof Tone.ToneAudioNode && !muted) {
        const context = Tone.getContext()
        if (context.state === 'running') {
          try {
            // Check if node is disposed
            if ((audioSource as any).disposed === true) {
              console.warn('Audio source is disposed, skipping connection')
              return
            }
            
            audioSource.connect(context.destination)
            this.currentSource = audioSource
            this.isConnected = true
          } catch (e) {
            console.error('Failed to connect audio source:', e)
          }
        }
      }
    }
    
    // Handle mute changes
    if (muted && this.isConnected) {
      if (this.currentSource) {
        try {
          this.currentSource.disconnect()
          this.isConnected = false
        } catch (e) {
          // Already disconnected
        }
      }
    } else if (!muted && !this.isConnected && this.currentSource) {
      // Reconnect if unmuted
      const context = Tone.getContext()
      if (context.state === 'running') {
        try {
          if ((this.currentSource as any).disposed !== true) {
            this.currentSource.connect(context.destination)
            this.isConnected = true
          }
        } catch (e) {
          console.error('Failed to reconnect audio source:', e)
        }
      }
    }
    
    // Update volume on current source
    if (this.currentSource && 'volume' in this.currentSource) {
      try {
        const volumeNode = (this.currentSource as any).volume
        if (volumeNode && typeof volumeNode.value !== 'undefined') {
          volumeNode.value = volume
        }
      } catch (e) {
        // Volume update failed
      }
    }
  }

  cleanup(): void {
    if (this.currentSource && this.isConnected) {
      try {
        this.currentSource.disconnect()
      } catch (e) {
        // Ignore
      }
    }
    this.currentSource = null
    this.isConnected = false
  }
}
