import { BaseNode } from '../BaseNode'
import { DataType, NodeCategory, type NodeMetadata } from '../types'

/**
 * Gyroscope/Accelerometer Input Node
 * Outputs numeric sensor data from a connected peer
 */
export class GyroInputNode extends BaseNode {
  constructor(id?: string) {
    super('gyro-input', id)
  }

  getMetadata(): NodeMetadata {
    return {
      type: 'gyro-input',
      category: NodeCategory.INPUT,
      displayName: 'Gyro/Accel Input',
      description: 'Receives gyroscope and accelerometer data from a peer',
      color: '#f59e0b',
      icon: '📱'
    }
  }

  initialize(): void {
    // Output ports for different sensor values
    this.addOutput('accelX', DataType.NUMERIC)
    this.addOutput('accelY', DataType.NUMERIC)
    this.addOutput('accelZ', DataType.NUMERIC)
    this.addOutput('gyroAlpha', DataType.NUMERIC)
    this.addOutput('gyroBeta', DataType.NUMERIC)
    this.addOutput('gyroGamma', DataType.NUMERIC)
    this.addOutput('magnitude', DataType.NUMERIC) // Combined acceleration magnitude
  }

  /**
   * Set which peer this node is receiving from
   */
  setPeerId(peerId: string): void {
    this.name = `Gyro (${peerId.substring(0, 8)})`
  }

  /**
   * Update with new sensor data from peer
   */
  updateSensorData(data: {
    ax?: number
    ay?: number
    az?: number
    alpha?: number
    beta?: number
    gamma?: number
  }): void {
    const { ax = 0, ay = 0, az = 0, alpha = 0, beta = 0, gamma = 0 } = data
    
    // Calculate magnitude
    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az)
    
    // Set output values
    this.setOutputValue('accelX', ax)
    this.setOutputValue('accelY', ay)
    this.setOutputValue('accelZ', az)
    this.setOutputValue('gyroAlpha', alpha)
    this.setOutputValue('gyroBeta', beta)
    this.setOutputValue('gyroGamma', gamma)
    this.setOutputValue('magnitude', magnitude)
  }

  process(): void {
    // Processing happens in updateSensorData when data arrives
    // This method is called by the execution engine each frame
  }
}
