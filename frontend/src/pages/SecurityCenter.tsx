import React, { useState } from 'react';
import { Shield, Lock, Activity, Users, AlertTriangle, CheckCircle, Network, Server, Key } from 'lucide-react';

export function SecurityCenter() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 h-full flex flex-col bg-slate-950 text-slate-200 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="text-indigo-500" />
          Security Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform security posture and encryption status</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-800">
        {['overview', 'authentication', 'encryption', 'network'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Activity size={24} /></div>
              <div>
                <div className="text-2xl font-bold">142</div>
                <div className="text-xs text-slate-400">Auth Events (24h)</div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle size={24} /></div>
              <div>
                <div className="text-2xl font-bold text-red-400">5</div>
                <div className="text-xs text-slate-400">Failed Logins (24h)</div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500"><Users size={24} /></div>
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-slate-400">Active Sessions</div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500"><Lock size={24} /></div>
              <div>
                <div className="text-xl font-bold text-emerald-400">Healthy</div>
                <div className="text-xs text-slate-400">Encryption Status</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Network className="text-slate-400" size={20} />
              Security Architecture
            </h2>
            <div className="p-6 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-sm font-medium">
              <div className="text-center">
                <Server size={32} className="mx-auto mb-2 text-slate-400" />
                Edge Cameras
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-emerald-400 text-xs mb-1">TLS 1.3 / SRTP</span>
                <div className="w-full h-px bg-slate-700 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-700 rotate-45"></div>
                </div>
              </div>
              <div className="text-center">
                <Shield size={32} className="mx-auto mb-2 text-indigo-400" />
                API Gateway (Auth)
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-emerald-400 text-xs mb-1">RBAC / JWT</span>
                <div className="w-full h-px bg-slate-700 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-700 rotate-45"></div>
                </div>
              </div>
              <div className="text-center">
                <Lock size={32} className="mx-auto mb-2 text-amber-500" />
                Encrypted Storage
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'encryption' && (
        <div className="grid grid-cols-2 gap-6">
          {[
            { name: 'Camera Streams', prot: 'TLS 1.3 / SRTP', status: 'Active' },
            { name: 'API Transport', prot: 'HTTPS / TLS 1.3', status: 'Active' },
            { name: 'Database Data-at-Rest', prot: 'AES-256', status: 'Active' },
            { name: 'Evidence Storage', prot: 'SHA-256 Signed', status: 'Active' },
            { name: 'Token Signing', prot: 'RS256 (2048-bit)', status: 'Active' },
          ].map(enc => (
            <div key={enc.name} className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
                  <Key size={20} />
                </div>
                <div>
                  <div className="font-semibold">{enc.name}</div>
                  <div className="text-xs text-slate-400 mt-1">Protocol: {enc.prot}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-400/10 px-3 py-1 rounded-full">
                <CheckCircle size={14} /> {enc.status}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {(activeTab === 'authentication' || activeTab === 'network') && (
        <div className="flex items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
          <p>Detailed {activeTab} logs and configurations would be displayed here.</p>
        </div>
      )}
    </div>
  );
}
