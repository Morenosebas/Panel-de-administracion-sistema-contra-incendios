"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Flame,
  Wind,
  Droplets,
  Gauge,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { controlDevice, setControlMode } from "@/lib/api";
import type { SensorData, DeviceState, ControlMode } from "@/lib/types";

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>({
    gas: null,
    flama: null,
    estadoVent: null,
    estadoAsp: null,
    modo: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const {
    connect,
    disconnect,
    manualReconnect,
    isConnected: wsConnected,
    hasExceededMaxAttempts,
    reconnectAttempts,
  } = useWebSocket({
    url: "ws://localhost:4000/ws/sensors",
    onMessage: (data: SensorData) => {
      setSensorData(data);
      setIsConnected(true);
    },
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
    onError: () => setIsConnected(false),
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  const handleDeviceControl = async (
    device: "ventilador" | "aspersor",
    state: DeviceState
  ) => {
    setIsLoading(true);
    try {
      await controlDevice(device, state);
    } catch (error) {
      console.error(`Error controlando ${device}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (mode: ControlMode) => {
    setIsLoading(true);
    try {
      await setControlMode(mode);
    } catch (error) {
      console.error("Error al cambiar el modo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGasLevel = () => {
    if (sensorData.gas === null) return "unknown";
    if (sensorData.gas < 300) return "safe";
    if (sensorData.gas < 600) return "warning";
    return "danger";
  };

  const getGasColor = () => {
    const level = getGasLevel();
    switch (level) {
      case "safe":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "danger":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  // Mapeo de niveles de gas a textos en español
  const gasLevelsMapping: Record<string, string> = {
    safe: "SEGURO",
    warning: "ADVERTENCIA",
    danger: "PELIGRO",
    unknown: "DESCONOCIDO",
  };

  const isEmergency = sensorData.flama === true || getGasLevel() === "danger";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Panel de Control de Seguridad contra Incendios
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitorea sensores y controla sistemas de seguridad en tiempo real
        </p>
        <div className="flex items-center justify-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Conectado</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">
                {hasExceededMaxAttempts ? "Conexión Fallida" : "Desconectado"}
              </span>
              {hasExceededMaxAttempts && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={manualReconnect}
                  className="ml-2"
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reintentar Conexión
                </Button>
              )}
            </>
          )}
          {!isConnected && reconnectAttempts > 0 && !hasExceededMaxAttempts && (
            <span className="text-xs text-gray-500 ml-2">
              Reconectando... ({reconnectAttempts}/5)
            </span>
          )}
        </div>
      </div>

      {/* Alerta de Emergencia */}
      {isEmergency && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>¡EMERGENCIA DETECTADA!</strong>
            {sensorData.flama && " Llama detectada."}
            {getGasLevel() === "danger" &&
              " Niveles de gas peligrosos detectados."}
          </AlertDescription>
        </Alert>
      )}

      {hasExceededMaxAttempts && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200 flex items-center justify-between">
            <span>
              <strong>¡Conexión Perdida!</strong> No se pudo conectar al
              servidor tras 5 intentos. Los datos en tiempo real no están
              disponibles.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={manualReconnect}
              disabled={isLoading}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Modo de Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Modo de Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">
                Modo Actual:{" "}
                <Badge
                  variant={
                    sensorData.modo === "AUTOMATICO" ? "default" : "secondary"
                  }
                >
                  {sensorData.modo || "Desconocido"}
                </Badge>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sensorData.modo === "AUTOMATICO"
                  ? "El sistema responde automáticamente a las lecturas de los sensores"
                  : "Control manual de todos los dispositivos"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sensorData.modo === "MANUAL" ? "default" : "outline"}
                onClick={() => handleModeChange("MANUAL")}
                disabled={isLoading || !isConnected}
                size="sm"
              >
                Manual
              </Button>
              <Button
                variant={
                  sensorData.modo === "AUTOMATICO" ? "default" : "outline"
                }
                onClick={() => handleModeChange("AUTOMATICO")}
                disabled={isLoading || !isConnected}
                size="sm"
              >
                Automático
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lecturas de Sensores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Sensor de Gas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getGasColor()}`}>
                  {sensorData.gas !== null ? sensorData.gas : "--"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  PPM
                </div>
              </div>
              <div className="flex justify-center">
                <Badge
                  variant={
                    getGasLevel() === "safe"
                      ? "default"
                      : getGasLevel() === "warning"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {gasLevelsMapping[getGasLevel()]}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getGasLevel() === "safe"
                      ? "bg-green-500"
                      : getGasLevel() === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      ((sensorData.gas || 0) / 1000) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Detector de Llama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {sensorData.flama === true ? (
                  <XCircle className="h-16 w-16 text-red-500" />
                ) : sensorData.flama === false ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
              <Badge
                variant={
                  sensorData.flama === true
                    ? "destructive"
                    : sensorData.flama === false
                    ? "default"
                    : "secondary"
                }
              >
                {sensorData.flama === true
                  ? "LLAMA DETECTADA"
                  : sensorData.flama === false
                  ? "SIN LLAMA"
                  : "DESCONOCIDO"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Dispositivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Ventilador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Estado:</span>
                <Badge
                  variant={
                    sensorData.estadoVent === "ON" ? "default" : "secondary"
                  }
                >
                  {sensorData.estadoVent || "Desconocido"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={
                    sensorData.estadoVent === "ON" ? "default" : "outline"
                  }
                  onClick={() => handleDeviceControl("ventilador", "ON")}
                  disabled={
                    isLoading ||
                    !isConnected ||
                    sensorData.modo === "AUTOMATICO"
                  }
                  className="flex-1"
                >
                  Encender
                </Button>
                <Button
                  variant={
                    sensorData.estadoVent === "OFF" ? "default" : "outline"
                  }
                  onClick={() => handleDeviceControl("ventilador", "OFF")}
                  disabled={
                    isLoading ||
                    !isConnected ||
                    sensorData.modo === "AUTOMATICO"
                  }
                  className="flex-1"
                >
                  Apagar
                </Button>
              </div>
              {sensorData.modo === "AUTOMATICO" && (
                <p className="text-xs text-gray-500 text-center">
                  Controlado automáticamente en el modo actual
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Sistema de Aspersión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Estado:</span>
                <Badge
                  variant={
                    sensorData.estadoAsp === "ON" ? "default" : "secondary"
                  }
                >
                  {sensorData.estadoAsp || "Desconocido"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={
                    sensorData.estadoAsp === "ON" ? "default" : "outline"
                  }
                  onClick={() => handleDeviceControl("aspersor", "ON")}
                  disabled={
                    isLoading ||
                    !isConnected ||
                    sensorData.modo === "AUTOMATICO"
                  }
                  className="flex-1"
                >
                  Encender
                </Button>
                <Button
                  variant={
                    sensorData.estadoAsp === "OFF" ? "default" : "outline"
                  }
                  onClick={() => handleDeviceControl("aspersor", "OFF")}
                  disabled={
                    isLoading ||
                    !isConnected ||
                    sensorData.modo === "AUTOMATICO"
                  }
                  className="flex-1"
                >
                  Apagar
                </Button>
              </div>
              {sensorData.modo === "AUTOMATICO" && (
                <p className="text-xs text-gray-500 text-center">
                  Controlado automáticamente en el modo actual
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Conexión
              </div>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "En línea" : "Fuera de línea"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Nivel de Gas
              </div>
              <Badge
                variant={
                  getGasLevel() === "safe"
                    ? "default"
                    : getGasLevel() === "warning"
                    ? "secondary"
                    : "destructive"
                }
              >
                {gasLevelsMapping[getGasLevel()]}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Detección de Incendio
              </div>
              <Badge variant={sensorData.flama ? "destructive" : "default"}>
                {sensorData.flama ? "Alerta" : "Sin Alerta"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Modo de Control
              </div>
              <Badge
                variant={
                  sensorData.modo === "AUTOMATICO" ? "default" : "secondary"
                }
              >
                {sensorData.modo || "Desconocido"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
