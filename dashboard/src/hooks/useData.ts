import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/client'
import type { Camera, Alert, HealthCheck, AlertRule, PTZStatus, StorageInfo } from '@/api/types'

export function useHealth(pollInterval = 5000) {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.getHealth()
      setHealth(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, pollInterval)
    return () => clearInterval(interval)
  }, [fetchHealth, pollInterval])

  return { health, loading, error, refetch: fetchHealth }
}

export function useCameras(pollInterval = 10000) {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCameras = useCallback(async () => {
    try {
      const data = await api.getCameras()
      setCameras(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cameras')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCameras()
    const interval = setInterval(fetchCameras, pollInterval)
    return () => clearInterval(interval)
  }, [fetchCameras, pollInterval])

  return { cameras, loading, error, refetch: fetchCameras }
}

export function useCamera(id: string, pollInterval = 5000) {
  const [camera, setCamera] = useState<Camera | null>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCamera = useCallback(async () => {
    try {
      const [cam, hlth] = await Promise.all([
        api.getCamera(id),
        api.getCameraHealth(id),
      ])
      setCamera(cam)
      setHealth(hlth)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch camera')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCamera()
    const interval = setInterval(fetchCamera, pollInterval)
    return () => clearInterval(interval)
  }, [fetchCamera, pollInterval])

  return { camera, health, loading, error, refetch: fetchCamera }
}

export function useAlerts(pollInterval = 3000) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async (limit = 100, cameraId?: string) => {
    try {
      const data = await api.getAlerts(limit, cameraId)
      setAlerts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(() => fetchAlerts(), pollInterval)
    return () => clearInterval(interval)
  }, [fetchAlerts, pollInterval])

  const acknowledge = async (id: string, user = 'operator') => {
    await api.acknowledgeAlert(id, user)
    fetchAlerts()
  }

  return { alerts, loading, error, refetch: fetchAlerts, acknowledge }
}

export function useAlertRules() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    try {
      const data = await api.getAlertRules()
      setRules(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alert rules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const createRule = async (rule: Omit<AlertRule, 'id'>) => {
    const created = await api.createAlertRule(rule)
    await fetchRules()
    return created
  }

  const deleteRule = async (id: string) => {
    await api.deleteAlertRule(id)
    await fetchRules()
  }

  return { rules, loading, error, refetch: fetchRules, createRule, deleteRule }
}

export function useStorage() {
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStorage = useCallback(async () => {
    try {
      const data = await api.getStorageInfo()
      setStorage(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch storage info')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStorage()
    const interval = setInterval(fetchStorage, 30000)
    return () => clearInterval(interval)
  }, [fetchStorage])

  return { storage, loading, error, refetch: fetchStorage }
}

export function usePTZStatus(cameraId: string, pollInterval = 2000) {
  const [status, setStatus] = useState<PTZStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getPTZStatus(cameraId)
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PTZ status')
    } finally {
      setLoading(false)
    }
  }, [cameraId])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, pollInterval)
    return () => clearInterval(interval)
  }, [fetchStatus, pollInterval])

  return { status, loading, error, refetch: fetchStatus }
}