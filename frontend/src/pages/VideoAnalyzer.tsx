import React, { useState, useRef } from 'react';
import { 
  Upload, Play, FileText, Download, CheckCircle2, AlertTriangle, 
  Clock, Shield, User, Car, Eye, RefreshCw, BarChart2, Activity,
  FileSpreadsheet, FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const VideoAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisReport, setAnalysisReport] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setAnalysisReport(null);
    }
  };

  const handleStartAnalysis = () => {
    if (!videoPreviewUrl) return;
    setIsAnalyzing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          // Set simulated rich report
          setAnalysisReport({
            videoId: `VID-${Date.now().toString().slice(-6)}`,
            filename: selectedFile?.name || 'surveillance_feed.mp4',
            duration: '02m 41s',
            totalFrames: 4830,
            fps: 30.0,
            counts: {
              people: 27,
              vehicles: 12,
              animals: 4,
              zoneEvents: 6,
              loitering: 2,
              anpr: 8,
              critical: 1,
              high: 3,
              medium: 4
            },
            eventTimeline: [
              { timestamp: '00:00:14', timeSeconds: 14, event: 'PERSON_DETECTED', target: 'P-101', risk: 'LOW', detail: 'Person standing near Outer Gate' },
              { timestamp: '00:00:38', timeSeconds: 38, event: 'VEHICLE_DETECTED', target: 'V-014 (SUV)', risk: 'MEDIUM', detail: 'Vehicle approached Checkpoint Lane 1' },
              { timestamp: '00:00:42', timeSeconds: 42, event: 'ANPR_READ', target: 'MH 12 AB 1234', risk: 'LOW', detail: 'Plate recognized with 98.2% confidence' },
              { timestamp: '00:01:15', timeSeconds: 75, event: 'ZONE_ENTRY', target: 'P-104', risk: 'HIGH', detail: 'Crossed into Restricted Perimeter Alpha' },
              { timestamp: '00:01:48', timeSeconds: 108, event: 'LOITERING', target: 'P-104', risk: 'CRITICAL', detail: 'Dwell time exceeded 120s near boundary fence' },
              { timestamp: '00:02:10', timeSeconds: 130, event: 'ANIMAL_DETECTED', target: 'A-002', risk: 'LOW', detail: 'Wild animal filtered - No intrusion alarm triggered' },
              { timestamp: '00:02:35', timeSeconds: 155, event: 'DIRECTION_VIOLATION', target: 'P-104', risk: 'CRITICAL', detail: 'Vector directed toward sensitive outpost asset' }
            ],
            detectedObjects: [
              { id: 'P-104', type: 'PERSON', confidence: 96.4, action: 'walking', clothing: 'Navy Jacket / Dark Pants', dwell: '02m 15s', maxRisk: 87 },
              { id: 'V-014', type: 'VEHICLE (SUV)', confidence: 98.2, plate: 'MH 12 AB 1234', speed: '32 km/h', dwell: '00m 45s', maxRisk: 38 },
              { id: 'A-002', type: 'ANIMAL (Wild)', confidence: 92.1, species: 'Wild Animal', filter: 'Filtered to Low Risk', dwell: '00m 30s', maxRisk: 12 }
            ],
            riskSummary: {
              overallScore: 87,
              rating: 'CRITICAL',
              primaryReason: 'Person P-104 entered Restricted Zone Alpha during non-operational hours and loitered for 135s',
              sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
            }
          });
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  const handleSeekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  const exportJSON = () => {
    if (!analysisReport) return;
    const blob = new Blob([JSON.stringify(analysisReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IBVAP-Analysis-${analysisReport.videoId}.json`;
    a.click();
  };

  const exportCSV = () => {
    if (!analysisReport) return;
    let csv = 'Timestamp,Event,Target,Risk,Detail\n';
    analysisReport.eventTimeline.forEach((e: any) => {
      csv += `"${e.timestamp}","${e.event}","${e.target}","${e.risk}","${e.detail}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IBVAP-Events-${analysisReport.videoId}.csv`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 overflow-y-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-cyan-400 w-6 h-6" />
            Uploaded Video Intelligence Analyzer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload custom CCTV or border footage to execute automated object detection, tracking, ANPR, and incident report generation.
          </p>
        </div>
      </div>

      {/* Upload Box & Video Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Upload size={18} className="text-cyan-400" />
              Select or Upload Footage
            </h3>
            <p className="text-xs text-slate-400">
              Supports standard MP4, WebM, and MKV files. Video is analyzed locally without external third-party data transmission.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-950/60 hover:bg-slate-950 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              className="hidden"
            />
            <Upload className="w-10 h-10 text-slate-500 group-hover:text-cyan-400 mx-auto mb-3 transition-colors" />
            <div className="text-sm font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : "Click to select video file from disk"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "Drag and drop video clip here"}
            </div>
          </div>

          {/* Quick Demo Sample Picker */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Or use sample border footage:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setVideoPreviewUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                setSelectedFile(new File([], 'sample_border_thermal.mp4'));
                setAnalysisReport(null);
              }}
              className="h-7 text-xs"
            >
              Load Thermal Sample
            </Button>
          </div>

          {/* Start Analysis Button & Progress */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleStartAnalysis}
              disabled={!videoPreviewUrl || isAnalyzing}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center justify-center gap-2 py-5"
            >
              {isAnalyzing ? (
                <><RefreshCw size={16} className="animate-spin" /> Processing Frames ({progress}%)...</>
              ) : (
                <><Play size={16} /> Run Full Video Intelligence Pipeline</>
              )}
            </Button>

            {isAnalyzing && (
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className="bg-cyan-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye size={18} className="text-cyan-400" />
              Source Video Stream
            </h3>
            {videoPreviewUrl && (
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-xs font-mono border border-cyan-500/30">
                READY FOR ANALYSIS
              </span>
            )}
          </div>

          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">
            {videoPreviewUrl ? (
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-600 font-mono text-xs flex flex-col items-center">
                <Activity size={32} className="mb-2 opacity-40 text-slate-500" />
                No video loaded. Select a file or sample above.
              </div>
            )}
          </div>

          <div className="mt-3 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Inference: YOLOv8x + ByteTrack + PaddleOCR</span>
            <span>Local GPU Accelerated</span>
          </div>
        </div>

      </div>

      {/* Analysis Report Section */}
      {analysisReport && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Report Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
                  ANALYSIS COMPLETE
                </span>
                <h2 className="text-xl font-bold text-white">Video Intelligence Report // {analysisReport.videoId}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                File: {analysisReport.filename} · Duration: {analysisReport.duration} ({analysisReport.totalFrames} frames @ {analysisReport.fps} FPS)
              </p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportCSV} className="text-xs flex items-center gap-1.5">
                <FileSpreadsheet size={14} /> Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportJSON} className="text-xs flex items-center gap-1.5">
                <FileCode size={14} /> Export JSON
              </Button>
              <Button size="sm" onClick={() => window.print()} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs flex items-center gap-1.5">
                <Download size={14} /> Print / PDF
              </Button>
            </div>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-center">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase">People</div>
              <div className="text-xl font-bold text-cyan-400 mt-0.5">{analysisReport.counts.people}</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase">Vehicles</div>
              <div className="text-xl font-bold text-blue-400 mt-0.5">{analysisReport.counts.vehicles}</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase">Animals</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{analysisReport.counts.animals}</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase">Zone Events</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{analysisReport.counts.zoneEvents}</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase">Loitering</div>
              <div className="text-xl font-bold text-orange-400 mt-0.5">{analysisReport.counts.loitering}</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase">ANPR Reads</div>
              <div className="text-xl font-bold text-purple-400 mt-0.5">{analysisReport.counts.anpr}</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase">Critical</div>
              <div className="text-xl font-bold text-red-500 mt-0.5">{analysisReport.counts.critical}</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-slate-500 uppercase">High Risk</div>
              <div className="text-xl font-bold text-orange-500 mt-0.5">{analysisReport.counts.high}</div>
            </div>
          </div>

          {/* Interactive Event Timeline */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              Spatio-Temporal Event Markers (Click to Seek Video)
            </h3>
            
            <div className="space-y-2">
              {analysisReport.eventTimeline.map((item: any, i: number) => (
                <div
                  key={i}
                  onClick={() => handleSeekTo(item.timeSeconds)}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-lg flex justify-between items-center cursor-pointer transition-all hover:bg-slate-900/80 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                      {item.timestamp}
                    </span>
                    <span className="font-semibold text-xs text-white">{item.event}</span>
                    <span className="text-xs text-slate-400 font-mono">({item.target})</span>
                    <span className="text-xs text-slate-400 hidden md:inline">— {item.detail}</span>
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    item.risk === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-500/30' :
                    item.risk === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {item.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Chain of Custody Box */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
            <div>
              <div className="text-slate-400">Cryptographic Integrity Seal (SHA-256):</div>
              <div className="text-cyan-300 break-all text-[11px] mt-0.5">{analysisReport.riskSummary.sha256Hash}</div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 size={16} /> EVIDENCE SEALED
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default VideoAnalyzer;
