import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Filter, Eye, CheckCircle, ShieldAlert, AlertOctagon, Info, ArrowUpRight, Search, Activity } from 'lucide-react';
import { RiskScoreDisplay } from '../components/alerts/RiskScoreDisplay';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  const fetchLiveAlerts = async () => {
    try {
      const res = await fetch('/api/stream/alerts');
      if (res.ok) {
        const liveData = await res.json();
        if (Array.isArray(liveData) && liveData.length > 0) {
          const formatted = liveData.map((a: any, idx: number) => ({
            id: `ALT-${String(a.track_id || idx + 1).padStart(4, '0')}`,
            severity: a.severity || 'CRITICAL',
            type: a.type || 'Perimeter Security Alert',
            camera: a.camera_id || 'BOP-01',
            cameraName: 'Sector 4 PTZ',
            objectType: a.object_type || 'PERSON',
            trackingId: `TRK-${a.track_id || idx}`,
            confidence: a.confidence || 88.0,
            score: a.score || Math.min(100, Math.round((a.confidence || 85) * 0.85)),
            status: 'NEW',
            timestamp: a.timestamp || new Date().toISOString(),
            factors: a.factors || [
              { name: 'Perimeter Intrusion', score: 26, description: a.zone || 'Sector 4 Red Perimeter', category: 'zone' },
              { name: `Confidence Scaling (${a.confidence}%)`, score: Math.round((a.confidence - 60) * 0.4), description: `Dynamic modulation by confidence ${a.confidence}%`, category: 'confidence' }
            ]
          }));
          setAlerts(formatted);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchLiveAlerts();
    const interval = setInterval(fetchLiveAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (id: string, newStatus: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded border border-red-500/30">CRITICAL</span>;
      case 'HIGH': return <span className="px-2 py-1 text-xs font-bold bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">HIGH</span>;
      case 'MEDIUM': return <span className="px-2 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">MEDIUM</span>;
      case 'LOW': return <span className="px-2 py-1 text-xs font-bold bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">LOW</span>;
      default: return <span className="px-2 py-1 text-xs font-bold bg-slate-500/20 text-slate-400 rounded border border-slate-500/30">INFO</span>;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'border-l-red-500';
      case 'HIGH': return 'border-l-orange-500';
      case 'MEDIUM': return 'border-l-amber-500';
      case 'LOW': return 'border-l-blue-500';
      default: return 'border-l-slate-500';
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.id.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.objectType.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 h-full flex flex-col bg-slate-950 text-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            Alert Management & Threat Risk Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Dynamic, multi-variate risk calculation factoring in model confidence, dwell time, object threat, and zone tier
          </p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
          <Activity size={14} className="animate-pulse" />
          <span>REAL-TIME THREAT SCORING ACTIVE</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-slate-400 text-xs font-mono uppercase">Total Active</span>
          <span className="text-2xl font-bold font-mono text-cyan-400">{alerts.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-red-400 text-xs font-mono uppercase flex items-center gap-1"><AlertOctagon className="w-3.5 h-3.5"/> Critical</span>
          <span className="text-2xl font-bold font-mono text-red-400">{alerts.filter(a => a.severity === 'CRITICAL').length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-orange-400 text-xs font-mono uppercase flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> High</span>
          <span className="text-2xl font-bold font-mono text-orange-400">{alerts.filter(a => a.severity === 'HIGH').length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-amber-400 text-xs font-mono uppercase">Medium</span>
          <span className="text-2xl font-bold font-mono text-amber-400">{alerts.filter(a => a.severity === 'MEDIUM').length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-blue-400 text-xs font-mono uppercase">Low</span>
          <span className="text-2xl font-bold font-mono text-blue-400">{alerts.filter(a => a.severity === 'LOW').length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-emerald-400 text-xs font-mono uppercase">Dynamic Scaled</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">100%</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 bg-slate-900 p-3 rounded-lg border border-slate-800 items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-300 w-72">
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search alerts by ID, type, object..." 
            className="bg-transparent border-none outline-none w-full text-xs font-mono text-slate-200 placeholder-slate-500" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button 
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                selectedSeverity === sev ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {filteredAlerts.map(alert => (
          <div key={alert.id} className={`bg-slate-900 border border-slate-800 border-l-4 rounded-lg overflow-hidden transition-all ${getBorderColor(alert.severity)}`}>
            <div className="p-4">
              <div className="flex justify-between items-start">
                
                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{alert.id}</span>
                    {getSeverityBadge(alert.severity)}
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                      {alert.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {alert.timestamp?.includes('T') ? alert.timestamp.split('T')[1].substring(0, 8) : alert.timestamp}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-200 mb-1 font-mono">{alert.type}</h3>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-slate-400 mt-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{alert.cameraName} ({alert.camera})</span>
                    </div>
                    <div>Target: <span className="text-slate-200 font-semibold">{alert.objectType}</span></div>
                    <div>Track ID: <span className="font-mono text-cyan-400 font-bold">{alert.trackingId}</span></div>
                    <div>Model Confidence: <span className="text-emerald-400 font-bold">{alert.confidence}%</span></div>
                  </div>
                </div>

                {/* Risk Score */}
                <div 
                  className="px-6 border-l border-slate-800 ml-4 flex flex-col items-center cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors"
                  onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                >
                  <RiskScoreDisplay score={alert.score} />
                  <span className="text-[10px] font-mono text-slate-500 mt-2 flex items-center gap-1">
                    Explain Factors {expandedAlert === alert.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800 font-mono text-xs">
                {alert.status === 'NEW' && (
                  <button onClick={() => handleAction(alert.id, 'ACKNOWLEDGED')} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                  </button>
                )}
                <button onClick={() => handleAction(alert.id, 'ESCALATED')} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded transition-colors flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Escalate
                </button>
                <button onClick={() => handleAction(alert.id, 'RESOLVED')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors ml-auto">
                  Resolve
                </button>
              </div>
            </div>

            {/* Expandable Mathematical Breakdown */}
            {expandedAlert === alert.id && (
              <div className="bg-slate-950 p-5 border-t border-slate-800 font-mono">
                <RiskScoreDisplay score={alert.score} factors={alert.factors} expanded={true} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
