import React, { useState } from 'react';
import { FileText, Search, Filter, Download, User, Activity, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const mockLogs = Array.from({ length: 20 }, (_, i) => {
  const actions = ['LOGIN', 'CAMERA_CHANGE', 'ZONE_CHANGE', 'EVIDENCE_ACCESS', 'CONFIG_CHANGE', 'INCIDENT_CHANGE'];
  const users = ['admin', 'commander01', 'operator01', 'auditor01'];
  const resources = ['System', 'Camera: CAM-01', 'Evidence: EVD-001', 'Zone: Z-01'];
  const results = ['Success', 'Success', 'Success', 'Success', 'Failure'];
  
  return {
    id: `log-${i}`,
    timestamp: new Date(Date.now() - i * 1000 * 60 * 30).toISOString().replace('T', ' ').substring(0, 19),
    user: users[i % users.length],
    action: actions[i % actions.length],
    resource: resources[i % resources.length],
    details: `User performed ${actions[i % actions.length]} on ${resources[i % resources.length]}`,
    result: results[i % results.length],
    ip: `192.168.1.${100 + (i % 5)}`
  };
});

const getActionColor = (action: string) => {
  switch (action) {
    case 'LOGIN': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'EVIDENCE_ACCESS': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'CAMERA_CHANGE': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    case 'INCIDENT_CHANGE': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    default: return 'text-slate-400 bg-slate-800 border-slate-700';
  }
};

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 h-full flex flex-col bg-slate-950 text-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-blue-500" />
            System Audit Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Immutable record of all system activities and access</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors border border-slate-700">
          <Download size={16} />
          Export Audit Trail
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Total Events (24h)</div>
          <div className="text-2xl font-bold">14,235</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Evidence Access</div>
          <div className="text-2xl font-bold text-amber-400">42</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Failed Actions</div>
          <div className="text-2xl font-bold text-red-400">12</div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Config Changes</div>
          <div className="text-2xl font-bold text-purple-400">8</div>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-800 flex gap-4 bg-slate-950">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search audit logs by user, action, or resource..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-md text-sm focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200">
            <option>All Users</option>
            <option>admin</option>
            <option>commander01</option>
            <option>operator01</option>
          </select>
          <select className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200">
            <option>All Actions</option>
            <option>LOGIN</option>
            <option>EVIDENCE_ACCESS</option>
            <option>CONFIG_CHANGE</option>
          </select>
          <button className="bg-slate-800 hover:bg-slate-700 p-2 rounded-md border border-slate-700 transition-colors">
            <Filter size={20} />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-slate-950/50 uppercase sticky top-0 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3 font-medium text-slate-300 flex items-center gap-2">
                    <User size={14} className="text-slate-500" />
                    {log.user}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-semibold border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{log.resource}</td>
                  <td className="px-4 py-3 text-slate-400">{log.details}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{log.ip}</td>
                  <td className="px-4 py-3">
                    {log.result === 'Success' ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={14} /> Success
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400">
                        <ShieldAlert size={14} /> Failure
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
