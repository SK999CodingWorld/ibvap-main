import axios, { AxiosInstance, AxiosError } from 'axios'
import type { Camera, Alert, AlertRule, HealthCheck } from '@/api/types'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.status, error.message)
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data)
    return response.data
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.patch<T>(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url)
    return response.data
  }

  // Health
  getHealth(): Promise<HealthCheck> {
    return this.get('/health')
  }

  // Cameras
  getCameras(): Promise<Camera[]> {
    return this.get('/cameras')
  }

  getCamera(id: string): Promise<Camera> {
    return this.get(`/cameras/${id}`)
  }

  getCameraHealth(id: string): Promise<any> {
    return this.get(`/cameras/${id}/health`)
  }

  createCamera(camera: Omit<Camera, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<{ id: string }> {
    return this.post('/cameras', camera)
  }

  updateCamera(id: string, updates: Partial<Camera>): Promise<{ message: string }> {
    return this.patch(`/cameras/${id}`, updates)
  }

  deleteCamera(id: string): Promise<{ message: string }> {
    return this.delete(`/cameras/${id}`)
  }

  // Alerts
  getAlerts(limit?: number, camera_id?: string): Promise<Alert[]> {
    return this.get('/alerts', { limit, camera_id })
  }

  acknowledgeAlert(id: string, user?: string): Promise<{ message: string }> {
    return this.post(`/alerts/${id}/acknowledge`, { user })
  }

  getAlertRules(): Promise<AlertRule[]> {
    return this.get('/alerts/rules')
  }

  createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<{ id: string }> {
    return this.post('/alerts/rules', rule)
  }

  deleteAlertRule(id: string): Promise<{ message: string }> {
    return this.delete(`/alerts/rules/${id}`)
  }

  // Recordings
  getStorageInfo(): Promise<any> {
    return this.get('/recordings/storage')
  }

  getEventClips(cameraId: string, eventType?: string): Promise<{ clips: any[] }> {
    return this.get(`/recordings/cameras/${cameraId}/clips`, { event_type: eventType })
  }

  exportEvidence(cameraId: string, startTime: string, endTime: string): Promise<{ path: string }> {
    return this.post(`/recordings/cameras/${cameraId}/evidence`, { start_time: startTime, end_time: endTime })
  }

  // PTZ
  initializePTZ(cameraId: string): Promise<{ message: string }> {
    return this.post(`/ptz/cameras/${cameraId}/initialize`)
  }

  moveAbsolute(cameraId: string, pan: number, tilt: number, zoom: number, speed?: number): Promise<{ message: string }> {
    return this.post(`/ptz/cameras/${cameraId}/move/absolute`, { pan, tilt, zoom, speed })
  }

  moveRelative(cameraId: string, pan: number, tilt: number, zoom: number, speed?: number): Promise<{ message: string }> {
    return this.post(`/ptz/cameras/${cameraId}/move/relative`, { pan, tilt, zoom, speed })
  }

  moveContinuous(cameraId: string, pan: number, tilt: number, zoom: number, speed?: number): Promise<{ message: string }> {
    return this.post(`/ptz/cameras/${cameraId}/move/continuous`, { pan, tilt, zoom, speed })
  }

  stopPTZ(cameraId: string): Promise<{ message: string }> {
    return this.post(`/ptz/cameras/${cameraId}/stop`)
  }

  gotoPreset(cameraId: string, presetName: string): Promise<{ message: string }> {
    return this.post(`/ptz/cameras/${cameraId}/preset`, { preset_name: presetName })
  }

  setPreset(cameraId: string, preset: any): Promise<{ message: string }> {
    return this.post(`/ptz/cameras/${cameraId}/presets`, preset)
  }

  getPresets(cameraId: string): Promise<{ presets: any[] }> {
    return this.get(`/ptz/cameras/${cameraId}/presets`)
  }

  getPTZStatus(cameraId: string): Promise<any> {
    return this.get(`/ptz/cameras/${cameraId}/status`)
  }

  // Face watchlist
  getFaceWatchlist(): Promise<{ watchlist: string[] }> {
    return this.get('/analytics/face/watchlist')
  }

  addFaceWatchlist(name: string, imagePath: string): Promise<{ message: string }> {
    return this.post('/analytics/face/watchlist', { name, image_path: imagePath })
  }

  removeFaceWatchlist(name: string): Promise<{ message: string }> {
    return this.delete(`/analytics/face/watchlist/${name}`)
  }

  // Video stream URL
  getVideoStreamUrl(cameraId: string): string {
    return `${API_BASE.replace('/api', '')}/video_feed/${cameraId}`
  }
}

export const api = new ApiClient()