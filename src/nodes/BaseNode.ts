import { 
  DataType, 
  type Port, 
  PortDirection, 
  type NodeParameter, 
  type NodeMetadata,
  generateId 
} from './types'

/**
 * Abstract base class for all nodes
 */
export abstract class BaseNode {
  readonly id: string
  readonly type: string
  
  name: string
  position: { x: number; y: number }
  
  protected inputs: Map<string, Port> = new Map()
  protected outputs: Map<string, Port> = new Map()
  protected parameters: Map<string, any> = new Map()
  
  enabled: boolean = true
  
  constructor(type: string, id?: string) {
    this.id = id || generateId()
    this.type = type
    this.name = type
    this.position = { x: 0, y: 0 }
  }

  /**
   * Get node metadata (must be implemented by subclasses)
   */
  abstract getMetadata(): NodeMetadata

  /**
   * Initialize node (setup ports, parameters)
   */
  abstract initialize(): void

  /**
   * Process data (execute node logic)
   */
  abstract process(): void

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Override in subclasses if needed
  }

  /**
   * Add input port
   */
  protected addInput(name: string, dataType: DataType): Port {
    const port: Port = {
      id: generateId(),
      nodeId: this.id,
      name,
      dataType,
      direction: PortDirection.INPUT,
      connected: false,
      value: undefined
    }
    this.inputs.set(port.id, port)
    return port
  }

  /**
   * Add output port
   */
  protected addOutput(name: string, dataType: DataType): Port {
    const port: Port = {
      id: generateId(),
      nodeId: this.id,
      name,
      dataType,
      direction: PortDirection.OUTPUT,
      connected: false,
      value: undefined
    }
    this.outputs.set(port.id, port)
    return port
  }

  /**
   * Add parameter
   */
  protected addParameter(param: NodeParameter): void {
    this.parameters.set(param.id, param.defaultValue)
  }

  /**
   * Get parameter value
   */
  protected getParameter(id: string): any {
    return this.parameters.get(id)
  }

  /**
   * Set parameter value
   */
  setParameter(id: string, value: any): void {
    this.parameters.set(id, value)
  }

  /**
   * Get input value by port name
   */
  protected getInputValue(portName: string): any {
    const port = Array.from(this.inputs.values()).find(p => p.name === portName)
    return port?.value
  }

  /**
   * Set output value by port name
   */
  protected setOutputValue(portName: string, value: any): void {
    const port = Array.from(this.outputs.values()).find(p => p.name === portName)
    if (port) {
      // Don't let Vue wrap Tone.js audio nodes in proxies
      if (value && typeof value === 'object' && 'context' in value && 'connect' in value) {
        import('vue').then(({ markRaw }) => {
          port.value = markRaw(value)
        })
      } else {
        port.value = value
      }
    }
  }

  /**
   * Get port by ID
   */
  getPort(portId: string): Port | undefined {
    return this.inputs.get(portId) || this.outputs.get(portId)
  }

  /**
   * Get all input ports
   */
  getInputPorts(): Port[] {
    return Array.from(this.inputs.values())
  }

  /**
   * Get all output ports
   */
  getOutputPorts(): Port[] {
    return Array.from(this.outputs.values())
  }

  /**
   * Get all ports
   */
  getAllPorts(): Port[] {
    return [...this.getInputPorts(), ...this.getOutputPorts()]
  }

  /**
   * Serialize node to JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      position: this.position,
      enabled: this.enabled,
      parameters: Object.fromEntries(this.parameters),
      inputs: Array.from(this.inputs.values()),
      outputs: Array.from(this.outputs.values())
    }
  }
}
