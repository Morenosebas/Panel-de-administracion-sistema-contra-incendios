export interface SensorData {
  gas: number | null
  flama: boolean | null
  estadoVent: string | null
  estadoAsp: string | null
  modo: string | null
}

export type DeviceState = "ON" | "OFF"
export type ControlMode = "MANUAL" | "AUTOMATICO"

export interface ControlResponse {
  ventilador?: DeviceState
  aspersor?: DeviceState
  modo?: ControlMode
}
