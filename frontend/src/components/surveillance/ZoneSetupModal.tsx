import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Shield, RefreshCw, Trash2, CheckCircle2, Crosshair, AlertCircle, X } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface ZoneSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZoneUpdated?: () => void;
}

export const ZoneSetupModal: React.FC<ZoneSetupModalProps> = ({
  isOpen,
  onClose,
  onZoneUpdated
}) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [snapshotUrl, setSnapshotUrl] = useState<string>('/api/stream/snapshot');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 1280, height: 720 });
  const imageRef = useRef<HTMLImageElement>(null);

  // Fetch current zone coordinates & snapshot on open
  useEffect(() => {
    if (isOpen) {
      setSnapshotUrl(`/api/stream/snapshot?t=${Date.now()}`);
      setSaveSuccess(false);
      setErrorMessage(null);

      // Fetch existing zone from backend
      fetch('/api/stream/zone')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.polygon) && data.polygon.length >= 3) {
            setPoints(data.polygon.map(([x, y]: [number, number]) => ({ x, y })));
          }
          if (data.width && data.height) {
            setImageDims({ width: data.width, height: data.height });
          }
        })
        .catch(err => console.error("Could not fetch current zone:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (points.length >= 4) {
      return; // Already 4 points selected
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale from display pixels to actual native frame resolution (e.g. 1280x720)
    const scaleX = imageDims.width / rect.width;
    const scaleY = imageDims.height / rect.height;

    const actualX = Math.round(clickX * scaleX);
    const actualY = Math.round(clickY * scaleY);

    setPoints(prev => [...prev, { x: actualX, y: actualY }]);
  };

  const handleReset = () => {
    setPoints([]);
    setErrorMessage(null);
  };

  const handleRefreshSnapshot = () => {
    setSnapshotUrl(`/api/stream/snapshot?t=${Date.now()}`);
  };

  const handleSaveZone = async () => {
    if (points.length < 3) {
      setErrorMessage("Please click at least 3 points (or 4 points) to form a restricted perimeter zone.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        polygon: points.map(p => [p.x, p.y])
      };

      const res = await fetch('/api/stream/zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccess(true);
        if (onZoneUpdated) onZoneUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage("Server rejected polygon coordinates.");
      }
    } catch (err) {
      setErrorMessage("Failed to connect to backend server.");
    } finally {
      setSaving(false);
    }
  };

  // Convert points to SVG polygon points in percentage (0 to 100%)
  const svgPoints = points
    .map(p => `${(p.x / imageDims.width) * 100},${(p.y / imageDims.height) * 100}`)
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Shield className="text-amber-400" size={18} />
              Restricted Zone Polygon Setup (4-Point Calibration)
            </h2>
            <p className="text-xs text-slate-400">
              Click 4 points on the snapshot below to define the perimeter tripwire for live intrusion detection.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-mono text-xs font-bold rounded border border-amber-500/20">
              {points.length}/4 Points Selected
            </span>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Interactive Snapshot Canvas */}
          <div 
            className="relative bg-black rounded-xl overflow-hidden border border-slate-700 cursor-crosshair select-none shadow-2xl group"
            onClick={handleImageClick}
          >
            {/* Base Snapshot Image */}
            <img 
              ref={imageRef}
              src={snapshotUrl} 
              alt="Camera Calibration Snapshot"
              className="w-full h-auto aspect-video object-cover pointer-events-none"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
                }
              }}
            />

            {/* SVG Polygon & Lines Overlay */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              {points.length >= 3 && (
                <polygon 
                  points={svgPoints} 
                  fill="rgba(234, 179, 8, 0.28)" 
                  stroke="#eab308" 
                  strokeWidth="0.6" 
                  strokeDasharray="2,1" 
                />
              )}
              {points.length === 2 && (
                <line 
                  x1={(points[0].x / imageDims.width) * 100} 
                  y1={(points[0].y / imageDims.height) * 100} 
                  x2={(points[1].x / imageDims.width) * 100} 
                  y2={(points[1].y / imageDims.height) * 100} 
                  stroke="#eab308" 
                  strokeWidth="0.6" 
                />
              )}
            </svg>

            {/* Render Point Nodes */}
            {points.map((p, idx) => (
              <div 
                key={idx}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                style={{
                  left: `${(p.x / imageDims.width) * 100}%`,
                  top: `${(p.y / imageDims.height) * 100}%`
                }}
              >
                <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-[11px] font-mono font-bold text-white animate-pulse">
                  P{idx + 1}
                </div>
              </div>
            ))}

            {/* Helper overlay when points are needed */}
            {points.length < 4 && (
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2">
                <Crosshair size={14} className="animate-spin" /> 
                {points.length === 0 && "Click Top-Left (Point 1)"}
                {points.length === 1 && "Click Top-Right (Point 2)"}
                {points.length === 2 && "Click Bottom-Right (Point 3)"}
                {points.length === 3 && "Click Bottom-Left (Point 4)"}
              </div>
            )}
          </div>

          {/* Point Readout bar */}
          <div className="flex flex-wrap justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-3 text-slate-300 flex-wrap">
              <span className="text-slate-500 font-bold">CALIBRATION POINTS:</span>
              {points.length === 0 && <span className="text-slate-500">None placed yet</span>}
              {points.map((p, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-bold">
                  P{i + 1}: ({p.x}, {p.y})
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleRefreshSnapshot}
                className="text-slate-400 hover:text-white text-xs h-7 gap-1"
              >
                <RefreshCw size={12} /> Refresh Frame
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleReset}
                className="text-red-400 hover:text-red-300 text-xs h-7 gap-1"
              >
                <Trash2 size={12} /> Reset Points
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              Restricted zone polygon saved! Live video stream & intrusion checks updated.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end items-center gap-3 bg-slate-950/60">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 text-xs">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveZone} 
            disabled={points.length < 3 || saving}
            className="bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40"
          >
            {saving ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
            Save & Apply Restricted Zone
          </Button>
        </div>

      </div>
    </div>
  );
};
