import React, { useState } from 'react';
import { Shield, Clock, MapPin, Users, FileText, CheckCircle, AlertTriangle, Paperclip, Activity } from 'lucide-react';
import { RiskScoreDisplay } from '../components/alerts/RiskScoreDisplay';

const MOCK_INCIDENTS = [
  {
    id: 'INC-0042',
    severity: 'CRITICAL',
    status: 'Investigating',
    location: 'Sector 4, North Fence',
    cameras: ['CAM-N-01', 'CAM-N-02'],
    riskScore: 87,
    assignedTo: 'operator_alpha',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    timeline: [
      { id: 1, time: new Date(Date.now() - 30 * 60000).toISOString(), action: 'Detected', details: 'System correlated 3 high-risk alerts' },
      { id: 2, time: new Date(Date.now() - 28 * 60000).toISOString(), action: 'Verified', details: 'Verified by system admin' },
      { id: 3, time: new Date(Date.now() - 25 * 60000).toISOString(), action: 'Assigned', details: 'Assigned to operator_alpha' },
      { id: 4, time: new Date(Date.now() - 15 * 60000).toISOString(), action: 'Note added', details: 'Subject visually confirmed, dispatching patrol' },
      { id: 5, time: new Date(Date.now() - 5 * 60000).toISOString(), action: 'Status changed', details: 'Moved to Investigating' },
    ],
    alerts: ['ALT-0042', 'ALT-0043', 'ALT-0044'],
    evidence: ['EVD-992', 'EVD-993'],
    notes: [
      { id: 1, user: 'operator_alpha', text: 'Subject visually confirmed, dispatching patrol', time: new Date(Date.now() - 15 * 60000).toISOString() }
    ]
  },
  {
    id: 'INC-0041',
    severity: 'HIGH',
    status: 'Assigned',
    location: 'Sector 2, West Gate',
    cameras: ['CAM-W-03'],
    riskScore: 72,
    assignedTo: 'operator_beta',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    timeline: [
      { id: 1, time: new Date(Date.now() - 120 * 60000).toISOString(), action: 'Detected', details: 'High speed vehicle approach' },
      { id: 2, time: new Date(Date.now() - 110 * 60000).toISOString(), action: 'Assigned', details: 'Assigned to operator_beta' },
    ],
    alerts: ['ALT-0041'],
    evidence: [],
    notes: []
  },
  {
    id: 'INC-0040',
    severity: 'MEDIUM',
    status: 'Resolved',
    location: 'Sector 7, East Buffer',
    cameras: ['CAM-E-01', 'CAM-E-05'],
    riskScore: 45,
    assignedTo: 'operator_gamma',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    timeline: [
      { id: 1, time: new Date(Date.now() - 24 * 3600000).toISOString(), action: 'Detected', details: 'Multiple loitering alerts' },
      { id: 2, time: new Date(Date.now() - 23 * 3600000).toISOString(), action: 'Resolved', details: 'Maintenance crew identified' },
    ],
    alerts: ['ALT-0038', 'ALT-0039', 'ALT-0040'],
    evidence: ['EVD-881'],
    notes: [
      { id: 1, user: 'operator_gamma', text: 'Confirmed authorized maintenance crew', time: new Date(Date.now() - 23 * 3600000).toISOString() }
    ]
  }
];

export function IncidentsPage() {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<typeof MOCK_INCIDENTS[0] | null>(null);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-500 rounded border border-red-500/30">CRITICAL</span>;
      case 'HIGH': return <span className="px-2 py-1 text-xs font-bold bg-orange-500/20 text-orange-500 rounded border border-orange-500/30">HIGH</span>;
      case 'MEDIUM': return <span className="px-2 py-1 text-xs font-bold bg-amber-500/20 text-amber-500 rounded border border-amber-500/30">MEDIUM</span>;
      default: return <span className="px-2 py-1 text-xs font-bold bg-blue-500/20 text-blue-500 rounded border border-blue-500/30">LOW</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Investigating': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Assigned': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-200">
      {/* Left List Pane */}
      <div className={`flex-1 p-6 flex flex-col border-r border-slate-800 ${selectedIncident ? 'hidden lg:flex lg:max-w-md' : ''}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Incident Workspace</h1>
          <p className="text-slate-400 text-sm">Correlated events and investigations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 text-xs">Active Incidents</span>
            <div className="text-xl font-bold">14</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 text-xs">Avg Resolution</span>
            <div className="text-xl font-bold">45m</div>
          </div>
        </div>

        {/* Incident List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {incidents.map(inc => (
            <div 
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedIncident?.id === inc.id 
                  ? 'bg-slate-800 border-slate-600' 
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono font-bold text-sm">{inc.id}</span>
                {getSeverityBadge(inc.severity)}
              </div>
              <div className="text-sm font-medium mb-2">{inc.location}</div>
              <div className="flex justify-between items-center text-xs">
                <span className={`px-2 py-0.5 rounded border ${getStatusColor(inc.status)}`}>
                  {inc.status}
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(inc.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail Pane */}
      {selectedIncident ? (
        <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold font-mono">{selectedIncident.id}</h2>
                {getSeverityBadge(selectedIncident.severity)}
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(selectedIncident.status)}`}>
                  {selectedIncident.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {selectedIncident.location}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4"/> Assigned: {selectedIncident.assignedTo}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm font-medium transition-colors">Assign</button>
              {selectedIncident.status !== 'Resolved' && (
                <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors">
                  Resolve Incident
                </button>
              )}
              <button className="lg:hidden px-3 py-1.5 bg-slate-800 rounded" onClick={() => setSelectedIncident(null)}>Close</button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 flex gap-6">
            
            {/* Main Info */}
            <div className="flex-1 space-y-6">
              
              {/* Context row */}
              <div className="flex gap-6">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 mb-2">Max Risk Score</div>
                  <RiskScoreDisplay score={selectedIncident.riskScore} />
                </div>
                
                <div className="flex-1 bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-col justify-center">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-400" /> Correlated Alerts</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.alerts.map(alt => (
                      <span key={alt} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm font-mono text-indigo-300">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Investigation Notes</h4>
                <div className="space-y-3 mb-4">
                  {selectedIncident.notes.map(note => (
                    <div key={note.id} className="bg-slate-800 p-3 rounded">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="font-medium text-slate-300">{note.user}</span>
                        <span>{new Date(note.time).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{note.text}</p>
                    </div>
                  ))}
                  {selectedIncident.notes.length === 0 && <p className="text-sm text-slate-500 italic">No notes added yet.</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Add a note..." className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors">Add</button>
                </div>
              </div>

            </div>

            {/* Sidebar / Timeline */}
            <div className="w-80 space-y-6">
              
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" /> Timeline</h4>
                <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
                  {selectedIncident.timeline.map((event, idx) => (
                    <div key={event.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-900"></div>
                      <div className="text-xs text-slate-400 mb-0.5">{new Date(event.time).toLocaleTimeString()}</div>
                      <div className="text-sm font-medium text-slate-200">{event.action}</div>
                      <div className="text-xs text-slate-500 mt-1">{event.details}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2"><Paperclip className="w-4 h-4 text-slate-400" /> Linked Evidence</h4>
                <div className="space-y-2">
                  {selectedIncident.evidence.map(ev => (
                    <div key={ev} className="flex items-center justify-between p-2 bg-slate-800 rounded text-sm">
                      <span className="font-mono text-indigo-300">{ev}</span>
                      <button className="text-slate-400 hover:text-white">View</button>
                    </div>
                  ))}
                  {selectedIncident.evidence.length === 0 && <p className="text-xs text-slate-500">No evidence linked.</p>}
                </div>
                <button className="w-full mt-3 py-1.5 border border-dashed border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-500 rounded text-sm transition-colors">
                  + Link Evidence
                </button>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center text-slate-500 bg-slate-950">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Select an incident to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}
