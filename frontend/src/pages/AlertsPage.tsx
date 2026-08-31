import React, { useState } from 'react';
import { AlertTriangle, Clock, Filter, Eye, CheckCircle, ShieldAlert, AlertOctagon, Info, ArrowUpRight, Search } from 'lucide-react';
import { RiskScoreDisplay } from '../components/alerts/RiskScoreDisplay';

// Mock Data
const MOCK_ALERTS = [
  {
    id: 'ALT-0042',
    severity: 'CRITICAL',
    type: 'Zone Intrusion',
    camera: 'CAM-N-01',
    cameraName: 'North Fence Alpha',
    objectType: 'Person',
    trackingId: 'TRK-9921',
    confidence: 94,
    score: 87,
    status: 'NEW',
    timestamp: new Date().toISOString(),
    factors: [
      { name: 'Restricted zone', score: 30, description: 'Object in restricted sector A', category: 'zone' },
      { name: 'Restricted hours', score: 20, description: 'Detection during lockdown hours', category: 'time' },
      { name: 'Movement toward protected', score: 15, description: 'Trajectory towards main facility', category: 'behavior' },
      { name: 'Loitering', score: 12, description: 'Object stationary for >45s', category: 'behavior' },
      { name: 'Multi object correlation', score: 10, description: 'Accompanied by unknown vehicle', category: 'correlation' },
    ]
  },
  {
    id: 'ALT-0041',
    severity: 'HIGH',
    type: 'Suspicious Vehicle',
    camera: 'CAM-W-03',
    cameraName: 'West Gate Approach',
    objectType: 'Vehicle',
    trackingId: 'TRK-8834',
    confidence: 88,
    score: 72,
    status: 'INVESTIGATING',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    factors: [
      { name: 'High Speed', score: 25, description: 'Speeding near perimeter', category: 'behavior' },
      { name: 'Unrecognized License Plate', score: 20, description: 'Plate not in allowlist', category: 'context' },
      { name: 'Zone crossing', score: 15, description: 'Crossed outer perimeter', category: 'zone' },
      { name: 'Night movement', score: 12, description: 'Moving without lights', category: 'time' },
    ]
  },
  {
    id: 'ALT-0040',
    severity: 'MEDIUM',
    type: 'Loitering',
    camera: 'CAM-S-02',
    cameraName: 'South Perimeter Beta',
    objectType: 'Person',
    trackingId: 'TRK-7711',
    confidence: 91,
    score: 45,
    status: 'NEW',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    factors: [
      { name: 'Loitering', score: 25, description: 'Object stationary for >5 mins', category: 'behavior' },
      { name: 'Proximity to fence', score: 20, description: 'Within 5m of physical fence', category: 'zone' },
    ]
  },
  {
    id: 'ALT-0039',
    severity: 'LOW',
    type: 'Animal Detected',
    camera: 'CAM-E-01',
    cameraName: 'East Forest Edge',
    objectType: 'Animal',
    trackingId: 'TRK-6652',
    confidence: 96,
    score: 22,
    status: 'RESOLVED',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    factors: [
      { name: 'Zone intrusion', score: 15, description: 'Entered buffer zone', category: 'zone' },
      { name: 'Known pattern', score: -10, description: 'Movement matches local wildlife', category: 'context' },
    ]
  },
];

export function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const handleAction = (id: string, newStatus: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-500 rounded border border-red-500/30">CRITICAL</span>;
      case 'HIGH': return <span className="px-2 py-1 text-xs font-bold bg-orange-500/20 text-orange-500 rounded border border-orange-500/30">HIGH</span>;
      case 'MEDIUM': return <span className="px-2 py-1 text-xs font-bold bg-amber-500/20 text-amber-500 rounded border border-amber-500/30">MEDIUM</span>;
      case 'LOW': return <span className="px-2 py-1 text-xs font-bold bg-blue-500/20 text-blue-500 rounded border border-blue-500/30">LOW</span>;
      default: return <span className="px-2 py-1 text-xs font-bold bg-slate-500/20 text-slate-400 rounded border border-slate-500/30">INFO</span>;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-l-red-500';
      case 'HIGH': return 'border-l-orange-500';
      case 'MEDIUM': return 'border-l-amber-500';
      case 'LOW': return 'border-l-blue-500';
      default: return 'border-l-slate-500';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-950 text-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alert Management</h1>
          <p className="text-slate-400 text-sm">Real-time threat detection and response</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-slate-400 text-sm">Total Active</span>
          <span className="text-2xl font-bold">12</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-red-500 text-sm font-semibold flex items-center gap-1"><AlertOctagon className="w-4 h-4"/> Critical</span>
          <span className="text-2xl font-bold text-red-500">2</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-orange-500 text-sm font-semibold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> High</span>
          <span className="text-2xl font-bold text-orange-500">4</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-amber-500 text-sm font-semibold">Medium</span>
          <span className="text-2xl font-bold text-amber-500">5</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-blue-500 text-sm font-semibold">Low</span>
          <span className="text-2xl font-bold text-blue-500">1</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col">
          <span className="text-green-500 text-sm font-semibold">Resolved Today</span>
          <span className="text-2xl font-bold text-green-500">45</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded text-sm text-slate-300 w-64">
          <Search className="w-4 h-4" />
          <input type="text" placeholder="Search alerts..." className="bg-transparent border-none outline-none w-full" />
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors">
          <Filter className="w-4 h-4" /> Severity
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors">
          Status: Open
        </button>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {alerts.map(alert => (
          <div key={alert.id} className={`bg-slate-900 border border-slate-800 border-l-4 rounded-lg overflow-hidden transition-all ${getBorderColor(alert.severity)}`}>
            <div className="p-4">
              <div className="flex justify-between items-start">
                
                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-slate-400">{alert.id}</span>
                    {getSeverityBadge(alert.severity)}
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                      alert.status === 'NEW' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                      alert.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {alert.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-200 mb-1">{alert.type}</h3>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mt-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>{alert.cameraName} ({alert.camera})</span>
                    </div>
                    <div>Object: <span className="text-slate-200 font-medium">{alert.objectType}</span></div>
                    <div>Track ID: <span className="font-mono text-slate-300">{alert.trackingId}</span></div>
                    <div>Confidence: <span className="text-slate-200 font-medium">{alert.confidence}%</span></div>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="px-6 border-l border-slate-800 ml-4 flex flex-col items-center cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors"
                     onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}>
                  <RiskScoreDisplay score={alert.score} />
                  <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    Details {expandedAlert === alert.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                {alert.status === 'NEW' && (
                  <button onClick={() => handleAction(alert.id, 'ACKNOWLEDGED')} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Acknowledge
                  </button>
                )}
                {['NEW', 'ACKNOWLEDGED', 'INVESTIGATING'].includes(alert.status) && (
                  <>
                    <button onClick={() => handleAction(alert.id, 'ESCALATED')} className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 text-sm font-medium rounded transition-colors flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Escalate
                    </button>
                    <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded transition-colors flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4" /> Create Incident
                    </button>
                  </>
                )}
                {alert.status !== 'RESOLVED' && (
                  <button onClick={() => handleAction(alert.id, 'RESOLVED')} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded transition-colors ml-auto">
                    Resolve
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Factors */}
            {expandedAlert === alert.id && (
              <div className="bg-slate-950 p-6 border-t border-slate-800">
                <RiskScoreDisplay score={alert.score} factors={alert.factors} expanded={true} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
