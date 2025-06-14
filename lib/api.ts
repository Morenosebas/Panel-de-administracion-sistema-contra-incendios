import type { DeviceState, ControlMode } from "./types"

const API_BASE_URL = "http://localhost:4000/api"

export async function controlDevice(device: "ventilador" | "aspersor", state: DeviceState) {
  const response = await fetch(`${API_BASE_URL}/control/${device}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ state }),
  })

  if (!response.ok) {
    throw new Error(`Failed to control ${device}`)
  }

  return response.json()
}

export async function setControlMode(mode: ControlMode) {
  const response = await fetch(`${API_BASE_URL}/control/modo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode }),
  })

  if (!response.ok) {
    throw new Error("Failed to set control mode")
  }

  return response.json()
}
