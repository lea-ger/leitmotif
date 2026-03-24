// Demo workflows for Leitmotif
export const DEMO_WORKFLOWS = [
  {
    id: 'simple-synth',
    name: 'Simple Synthesizer',
    description: 'A basic audio setup with a synthesizer and audio output.',
    data: {
      nodes: [
        {
          id: 'synth-1',
          type: 'tone-synth',
          position: { x: 100, y: 150 },
          enabled: true,
          parameters: {
            frequency: 440,
            oscillator: 'sine',
            envelope_attack: 0.1,
            envelope_decay: 0.2,
            envelope_sustain: 0.5,
            envelope_release: 1,
            volume: -10
          },
          exposedParameters: []
        },
        {
          id: 'audio-out-1',
          type: 'audio-output',
          position: { x: 400, y: 150 },
          enabled: true,
          parameters: {},
          exposedParameters: []
        },
        {
          id: 'comment-1',
          type: 'comment',
          position: { x: 100, y: 50 },
          enabled: true,
          parameters: {
            text: 'This is a basic sine wave synthesizer connected to audio output.',
            width: 350,
            height: 100
          },
          exposedParameters: []
        }
      ],
      connections: [
        {
          id: 'conn-1',
          sourceNodeId: 'synth-1',
          sourcePortName: 'audio',
          targetNodeId: 'audio-out-1',
          targetPortName: 'audio',
          dataType: 'audio'
        }
      ],
      previewEnabled: []
    }
  },
  {
    id: 'visualizer',
    name: 'Canvas Setup',
    description: 'Generates a canvas and outputs it to the window.',
    data: {
      nodes: [
        {
          id: 'gen-canvas-1',
          type: 'generate-canvas',
          position: { x: 100, y: 150 },
          enabled: true,
          parameters: {
            width: 800,
            height: 600,
            backgroundColor: '#000000'
          },
          exposedParameters: []
        },
        {
          id: 'output-canvas-1',
          type: 'canvas-output',
          position: { x: 450, y: 150 },
          enabled: true,
          parameters: {},
          exposedParameters: []
        },
        {
          id: 'comment-1',
          type: 'comment',
          position: { x: 100, y: 50 },
          enabled: true,
          parameters: {
            text: 'Generates a blank canvas for drawing operations.',
            width: 300,
            height: 100
          },
          exposedParameters: []
        }
      ],
      connections: [
        {
          id: 'conn-1',
          sourceNodeId: 'gen-canvas-1',
          sourcePortName: 'canvas',
          targetNodeId: 'output-canvas-1',
          targetPortName: 'canvas',
          dataType: 'canvas'
        }
      ],
      previewEnabled: []
    }
  }
]
