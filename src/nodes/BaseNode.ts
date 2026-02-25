import { markRaw } from 'vue'
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
  protected parameterDefinitions: Map<string, NodeParameter> = new Map()
  
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
    this.parameterDefinitions.set(param.id, param)
    this.parameters.set(param.id, param.defaultValue)
    
    // If parameter is exposed as input, create input port
    if (param.exposedAsInput) {
      this.exposeParameterAsInput(param.id)
    }
  }

  /**
   * Get parameter value (checks input port first if exposed)
   */
  protected getParameter(id: string): any {
    const paramDef = this.parameterDefinitions.get(id)
    if (paramDef?.exposedAsInput) {
      // Check if there's an input port for this parameter
      const inputPortName = `param_${id}`
      const inputValue = this.getInputValue(inputPortName)
      // Use input value if connected, otherwise use parameter value
      if (inputValue !== undefined) {
        return inputValue
      }
    }
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
      // Never let Vue wrap objects (audio nodes, canvases, etc.) in reactive proxies
      port.value = (value && typeof value === 'object') ? markRaw(value) : value
    }
  }

  /**
   * Get port by ID
   */
  getPort(portId: string): Port | undefined {
    return this.inputs.get(portId) || this.outputs.get(portId)
  }

  /**
   * Get port by name
   */
  getPortByName(portName: string): Port | undefined {
    const inputPort = Array.from(this.inputs.values()).find(p => p.name === portName)
    if (inputPort) return inputPort
    
    const outputPort = Array.from(this.outputs.values()).find(p => p.name === portName)
    return outputPort
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
   * Get all parameter definitions
   */
  getParameterDefinitions(): NodeParameter[] {
    return Array.from(this.parameterDefinitions.values())
  }

  /**
   * Get parameter definition by ID
   */
  getParameterDefinition(id: string): NodeParameter | undefined {
    return this.parameterDefinitions.get(id)
  }

  /**
   * Expose parameter as input port
   */
  exposeParameterAsInput(parameterId: string): void {
    const paramDef = this.parameterDefinitions.get(parameterId)
    if (!paramDef) return
    
    paramDef.exposedAsInput = true
    
    // Create input port for this parameter
    const portName = `param_${parameterId}`
    const dataType = paramDef.dataType || DataType.NUMERIC
    
    // Check if port already exists
    const existingPort = Array.from(this.inputs.values()).find(p => p.name === portName)
    if (!existingPort) {
      this.addInput(portName, dataType)
    }
  }

  /**
   * Hide parameter input port
   */
  hideParameterInput(parameterId: string): void {
    const paramDef = this.parameterDefinitions.get(parameterId)
    if (!paramDef) return
    
    paramDef.exposedAsInput = false
    
    // Remove input port for this parameter
    const portName = `param_${parameterId}`
    const portToRemove = Array.from(this.inputs.entries()).find(([_, p]) => p.name === portName)
    if (portToRemove) {
      this.inputs.delete(portToRemove[0])
    }
  }

  /**
   * Toggle parameter exposure as input
   */
  toggleParameterExposure(parameterId: string): void {
    const paramDef = this.parameterDefinitions.get(parameterId)
    if (!paramDef) return
    
    if (paramDef.exposedAsInput) {
      this.hideParameterInput(parameterId)
    } else {
      this.exposeParameterAsInput(parameterId)
    }
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
      parameterDefinitions: Array.from(this.parameterDefinitions.values()),
      inputs: Array.from(this.inputs.values()),
      outputs: Array.from(this.outputs.values())
    }
  }
}
