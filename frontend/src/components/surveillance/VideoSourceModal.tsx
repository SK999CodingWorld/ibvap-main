import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore, PRESET_VIDEOS } from '@/stores/videoStore';
import { X, Upload, Video, Camera, Globe, Check, Play, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CAMERAS = [
  { id: 'BOP-01', name: 'Border Outpost 1 PTZ' },
  { id: 'BOP-02', name: 'Border Outpost 2 Thermal' },
  { id: 'BOP-03', name: 'Border Outpost 3 Fixed' },
  { id: 'CHECK-01', name: 'Checkpoint Alpha' },
  { id: 'ROAD-01', name: 'Approach Road View' },
  { id: 'ROAD-02', name: 'Approach Road ANPR' },
  { id: 'GATE-01', name: 'Main Gate Entry' },
  { id: 'WATCH-01', name: 'Watchtower East' }
];

export const VideoSourceModal: React.FC = () => {
  const { videoModalOpen, selectedCameraForModal, closeVideoModal, setVideoSource, cameraConfigs } = useVideoStore();
  const [targetCamera, setTargetCamera] = useState(selectedCameraForModal);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'webcam' | 'url'>('presets');
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL State
  const [customUrl, setCustomUrl] = useState('');

  // Webcam State
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setTargetCamera(selectedCameraForModal);
  }, [selectedCameraForModal]);

  // Clean up webcam stream when modal closes
  useEffect(() => {
    if (!videoModalOpen && webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  }, [videoModalOpen, webcamStream]);

  if (!videoModalOpen) return null;

  const currentConfig = cameraConfigs[targetCamera];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    }
  };

  const handleApplyFile = () => {
    if (filePreviewUrl && selectedFile) {
      setVideoSource(targetCamera, 'file', filePreviewUrl, selectedFile.name);
      closeVideoModal();
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_VIDEOS[0]) => {
    fetch('/api/stream/source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'test.mp4' })
    }).catch(() => {});
    setVideoSource(targetCamera, 'preset', preset.url, preset.name);
    closeVideoModal();
  };

  const handleStartWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      setWebcamStream(stream);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setWebcamError('Unable to access camera: ' + (err.message || 'Permission denied'));
    }
  };

  const handleApplyWebcam = () => {
    fetch('/api/stream/source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'webcam' })
    }).catch(() => {});
    setVideoSource(targetCamera, 'webcam', '/video_feed', 'Live Physical Webcam');
    closeVideoModal();
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      setVideoSource(targetCamera, 'url', customUrl.trim(), 'External Stream');
      closeVideoModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              Assign Video Feed to Camera
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload footage, connect your webcam, or choose high-fidelity surveillance clips with active AI overlays.
            </p>
          </div>
          <button 
            onClick={closeVideoModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera Selector */}
        <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">Target Channel:</label>
          <select 
            value={targetCamera} 
            onChange={(e) => setTargetCamera(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          >
            {CAMERAS.map(c => (
              <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
            ))}
          </select>
        </div>

        {/* Nav Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'presets' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} /> Preset Scenarios
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'upload' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={14} /> Upload Video File
          </button>
          <button
            onClick={() => setActiveTab('webcam')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'webcam' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera size={14} /> Live Webcam
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'url' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={14} /> RTSP / Stream URL
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_VIDEOS.map((preset) => {
                const isSelected = currentConfig?.sourceUrl === preset.url;
                return (
                  <div
                    key={preset.id}
                    className={`border rounded-lg p-3.5 flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-900/10' 
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                          {preset.category}
                        </span>
                        {isSelected && (
                          <span className="flex items-center text-[10px] text-cyan-400 font-bold gap-1">
                            <Check size={12} /> Active
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white">{preset.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{preset.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Targets: {preset.defaultDetections.length} tracked</span>
                      <Button size="sm" variant={isSelected ? "outline" : "default"} className="h-7 text-xs">
                        {isSelected ? "Re-apply" : "Select Feed"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept="video/mp4,video/webm,video/ogg,video/quicktime" 
                  className="hidden" 
                />
                <Upload className="w-10 h-10 text-slate-500 group-hover:text-cyan-400 mx-auto mb-3 transition-colors" />
                <h4 className="text-sm font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : "Click to browse or drag video here"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">Supports MP4, WebM, MOV files. Video will loop seamlessly with real-time AI bounding boxes.</p>
              </div>

              {filePreviewUrl && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
                  <div className="aspect-video bg-black rounded overflow-hidden relative">
                    <video src={filePreviewUrl} controls className="w-full h-full object-contain" autoPlay muted loop />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono">File: {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <Button onClick={handleApplyFile} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                      Assign to {targetCamera}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEBCAM */}
          {activeTab === 'webcam' && (
            <div className="space-y-4">
              {!webcamStream ? (
                <div className="border border-slate-800 rounded-xl p-8 text-center bg-slate-950/40 space-y-3">
                  <Camera className="w-10 h-10 text-cyan-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">Live Device Webcam Feed</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Stream your physical camera directly into the surveillance system with instant real-time AI tracking overlays.
                  </p>
                  {webcamError && (
                    <div className="p-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded flex items-center justify-center gap-1.5">
                      <AlertCircle size={14} /> {webcamError}
                    </div>
                  )}
                  <Button onClick={handleStartWebcam} className="mt-2 bg-cyan-600 hover:bg-cyan-500">
                    Connect Webcam
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 relative">
                    <video ref={webcamVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" /> LIVE CAMERA
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { webcamStream.getTracks().forEach(t => t.stop()); setWebcamStream(null); }}>
                      Stop Webcam
                    </Button>
                    <Button onClick={handleApplyWebcam} className="bg-cyan-600 hover:bg-cyan-500">
                      Link Webcam to {targetCamera}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">RTSP / HLS / MP4 Stream URL:</label>
                <input 
                  type="text" 
                  value={customUrl} 
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="rtsp://admin:pass@192.168.1.100:554/stream1 or https://.../video.mp4"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-500">
                Note: In browser environments, direct RTSP streams are proxied via WebRTC/HLS. You can also paste direct MP4/WebM video URLs.
              </p>
              <div className="flex justify-end">
                <Button onClick={handleApplyUrl} disabled={!customUrl.trim()} className="bg-cyan-600 hover:bg-cyan-500">
                  Connect Stream URL
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
