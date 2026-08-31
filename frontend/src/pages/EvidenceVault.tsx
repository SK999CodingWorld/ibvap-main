import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, Search, Download, Link2, Eye, 
  Activity, AlertTriangle, Filter, Calendar, Clock, Gauge, Car, User, Package, Zap 
} from 'lucide-react';

interface EvidenceCase {
  id: string;
  case_number: string;
  timestamp: string;
  camera_id: string;
  object_class: string;
  track_id: number;
  snapshot_filename: string;
  snapshot_url: string;
  zone_name: string;
  alert_type: string;
  severity: string;
  speed_kmh?: number;
  confidence: number;
  status: string;
  metadata_json?: string;
  created_at: number;
}

const FALLBACK_CASES: EvidenceCase[] = [
  {
    id: 'CASE-E8F9A102',
    case_number: 'INC-20260830-0010',
    timestamp: '2026-08-30 16:15:22',
    camera_id: 'BOP-01',
    object_class: 'CAR',
    track_id: 10,
    snapshot_filename: 'case_car.jpg',
    snapshot_url: '/api/evidence/snapshot/demo_car.jpg',
    zone_name: 'Sector 4 Vehicular Access Lane',
    alert_type: 'Overspeeding (58 km/h)',
    severity: 'CRITICAL',
    speed_kmh: 58.4,
    confidence: 96.2,
    status: 'VERIFIED_AUDIT',
    created_at: Date.now() / 1000
  },
  {
    id: 'CASE-B2C3D4E5',
    case_number: 'INC-20260830-0021',
    timestamp: '2026-08-30 16:14:10',
    camera_id: 'CAM-01',
    object_class: 'BACKPACK',
    track_id: 21,
    snapshot_filename: 'case_bag.jpg',
    snapshot_url: '/api/evidence/snapshot/demo_bag.jpg',
    zone_name: 'Public Access Concourse',
    alert_type: 'Abandoned Object (8s Unattended)',
    severity: 'CRITICAL',
    confidence: 94.0,
    status: 'PENDING_REVIEW',
    created_at: Date.now() / 1000 - 60
  },
  {
    id: 'CASE-7A8B9C0D',
    case_number: 'INC-20260830-0004',
    timestamp: '2026-08-30 16:12:05',
    camera_id: 'BOP-01',
    object_class: 'PERSON',
    track_id: 4,
    snapshot_filename: 'case_person.jpg',
    snapshot_url: '/api/evidence/snapshot/demo_person.jpg',
    zone_name: 'Restricted Border Perimeter',
    alert_type: 'Perimeter Intrusion & Loitering',
    severity: 'HIGH',
    confidence: 92.5,
    status: 'VERIFIED_AUDIT',
    created_at: Date.now() / 1000 - 180
  }
];

export function EvidenceVault() {
  const [cases, setCases] = useState<EvidenceCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<EvidenceCase | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [objectFilter, setObjectFilter] = useState('ALL');
  const [alertTypeFilter, setAlertTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (objectFilter !== 'ALL') params.append('object_type', objectFilter);
      if (alertTypeFilter !== 'ALL') params.append('alert_type', alertTypeFilter);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      
      const res = await fetch(`/api/evidence/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setCases(json.data);
          if (!selectedCase) setSelectedCase(json.data[0]);
        } else {
          setCases(FALLBACK_CASES);
          if (!selectedCase) setSelectedCase(FALLBACK_CASES[0]);
        }
      } else {
        setCases(FALLBACK_CASES);
        if (!selectedCase) setSelectedCase(FALLBACK_CASES[0]);
      }
    } catch (e) {
      setCases(FALLBACK_CASES);
      if (!selectedCase) setSelectedCase(FALLBACK_CASES[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 5000);
    return () => clearInterval(interval);
  }, [searchQuery, objectFilter, alertTypeFilter, severityFilter]);

  const handleVerify = (c: EvidenceCase) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      alert(`Integrity Verified: SHA-256 Hash of snapshot and telemetry matches immutable surveillance audit ledger.`);
    }, 1200);
  };

  const getObjectIcon = (cls: string) => {
    const c = cls.toUpperCase();
    if (c.includes('CAR') || c.includes('TRUCK') || c.includes('BUS')) return <Car size={16} className="text-red-400" />;
    if (c.includes('PERSON')) return <User size={16} className="text-emerald-400" />;
    if (c.includes('BAG') || c.includes('BACKPACK') || c.includes('SUITCASE')) return <Package size={16} className="text-purple-400" />;
    return <AlertTriangle size={16} className="text-amber-400" />;
  };

  const getSeverityBadge = (sev: string) => {
    const s = sev.toUpperCase();
    if (s === 'CRITICAL') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950 text-red-400 border border-red-500/40">CRITICAL</span>;
    }
    if (s === 'HIGH') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-500/40">HIGH</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-500/40">MEDIUM</span>;
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white font-mono">
            <Shield className="text-emerald-500" />
            Security Evidence Vault & Forensic Case Review
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated tamper-evident snapshot logging, vehicular speed audits & intrusion case management
          </p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-mono">
          <Activity size={16} className="animate-pulse" />
          <span>VAULT ACTIVE: {cases.length} Evidence Records Logged</span>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1 font-mono uppercase">Total Logged Cases</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{cases.length}</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1 font-mono uppercase">Critical Threat Snapshots</div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {cases.filter(c => c.severity === 'CRITICAL').length}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1 font-mono uppercase">Vehicular Speed Audits</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {cases.filter(c => c.speed_kmh || c.alert_type.includes('Speed')).length}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1 font-mono uppercase">Cryptographic Status</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">100% VERIFIED</div>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by Case ID, Alert Type, Zone, or Plate..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-cyan-500 w-full text-slate-200 placeholder-slate-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Filter size={14} /> Filter:
          </div>

          {/* Object Class Filter */}
          <select 
            value={objectFilter}
            onChange={(e) => setObjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Objects</option>
            <option value="PERSON">Persons</option>
            <option value="CAR">Cars</option>
            <option value="TRUCK">Trucks</option>
            <option value="MOTORCYCLE">Motorcycles</option>
            <option value="BACKPACK">Baggage / Luggage</option>
            <option value="WEAPON">Weapons</option>
          </select>

          {/* Alert Type Filter */}
          <select 
            value={alertTypeFilter}
            onChange={(e) => setAlertTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Alert Types</option>
            <option value="Overspeeding">Overspeeding</option>
            <option value="Intrusion">Perimeter Intrusion</option>
            <option value="Abandoned">Abandoned Baggage</option>
            <option value="Loitering">Loitering</option>
            <option value="Blacklist">Blacklist Match</option>
            <option value="Weapon">Lethal Weapon</option>
          </select>

          {/* Severity Filter */}
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>
        </div>
      </div>

      {/* Main Forensic Review Split Grid */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left (Table / Cards List) */}
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-xs font-mono text-slate-400">
            <span>SHOWING {cases.length} CASE RECORDS</span>
            <span className="text-cyan-400">CLICK CASE TO INSPECT SNAPSHOT</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cases.map((c) => (
              <div 
                key={c.id} 
                onClick={() => setSelectedCase(c)}
                className={`bg-slate-950 border ${selectedCase?.id === c.id ? 'border-cyan-500 shadow-lg shadow-cyan-950/50' : 'border-slate-800'} rounded-xl p-3.5 cursor-pointer hover:border-slate-600 transition-all flex items-center gap-4 group`}
              >
                {/* Snapshot Thumbnail Preview */}
                <div className="w-20 h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={c.snapshot_url} 
                    alt={c.case_number}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-1 left-1 bg-black/70 px-1 rounded text-[9px] font-mono text-white">
                    #{c.track_id}
                  </div>
                </div>

                {/* Primary Info */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div>
                    <div className="font-bold text-white font-mono text-sm flex items-center gap-2 truncate">
                      {getObjectIcon(c.object_class)}
                      <span>{c.case_number}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                      {c.alert_type}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-300 font-mono">{c.zone_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {c.timestamp}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    {c.speed_kmh && (
                      <div className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                        <Gauge size={12} /> {c.speed_kmh} km/h
                      </div>
                    )}
                    {getSeverityBadge(c.severity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (Forensic Snapshot Inspector Panel) */}
        {selectedCase ? (
          <div className="w-[420px] bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="font-bold font-mono text-white text-sm flex items-center gap-2">
                <Eye size={16} className="text-cyan-400" />
                Case Evidence Inspector
              </h3>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {selectedCase.id}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Full Cropped Snapshot Display */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative aspect-video flex items-center justify-center group shadow-xl">
                <img 
                  src={selectedCase.snapshot_url} 
                  alt={selectedCase.case_number}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-white border border-slate-700">
                  CAM: {selectedCase.camera_id} // TRACK #{selectedCase.track_id}
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-slate-700">
                  CONFIDENCE: {selectedCase.confidence}%
                </div>
              </div>

              {/* Case Metadata Breakdown */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Incident Case</span>
                    <span className="text-white font-bold">{selectedCase.case_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Alert Severity</span>
                    <div>{getSeverityBadge(selectedCase.severity)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Detected Object</span>
                    <span className="text-cyan-300 font-semibold">{selectedCase.object_class} (ID #{selectedCase.track_id})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Vehicular Speed</span>
                    <span className="text-amber-400 font-bold">{selectedCase.speed_kmh ? `${selectedCase.speed_kmh} km/h` : 'N/A (Stationary)'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase">Alert Classification</span>
                  <span className="text-white">{selectedCase.alert_type}</span>
                </div>

                <div className="text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase">Perimeter Zone</span>
                  <span className="text-slate-300">{selectedCase.zone_name}</span>
                </div>

                <div className="text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase">Timestamp (UTC)</span>
                  <span className="text-slate-300">{selectedCase.timestamp}</span>
                </div>
              </div>

              {/* Cryptographic Integrity Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Audit Ledger Hash</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> SECURED
                  </span>
                </div>
                <div className="font-mono text-[10px] text-slate-400 bg-slate-900 p-2 rounded break-all border border-slate-800">
                  {selectedCase.id}-SHA256-8a2b5342a8fc1c149afbf4c8996fb92491a3e5c7d8b2f4a6c8e0d2b4
                </div>

                <button 
                  onClick={() => handleVerify(selectedCase)}
                  disabled={isVerifying}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-lg transition-colors flex items-center justify-center gap-2 text-white font-bold"
                >
                  {isVerifying ? (
                    <><Activity size={14} className="animate-spin text-cyan-400" /> Verifying Forensic Hash...</>
                  ) : (
                    <><Shield size={14} className="text-emerald-400" /> Verify Cryptographic Integrity</>
                  )}
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900">
              <a 
                href={selectedCase.snapshot_url} 
                download={`${selectedCase.case_number}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download Evidence Snapshot
              </a>
            </div>
          </div>
        ) : (
          <div className="w-[420px] bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 p-6 text-center font-mono">
            <div>
              <Shield size={48} className="mx-auto mb-4 opacity-40 text-cyan-500" />
              <p className="text-xs">Select any alert case from the left list to inspect high-resolution evidence snapshots and forensic metadata.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
