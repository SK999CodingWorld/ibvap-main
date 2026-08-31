import React, { useState } from 'react';
import { Users, Shield, UserPlus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const users = [
  { id: 1, username: 'admin', name: 'System Administrator', email: 'admin@ibvap.gov', role: 'Administrator', status: 'Active', lastLogin: '10 mins ago' },
  { id: 2, username: 'commander01', name: 'John Doe', email: 'j.doe@ibvap.gov', role: 'Commander', status: 'Active', lastLogin: '1 hour ago' },
  { id: 3, username: 'operator01', name: 'Jane Smith', email: 'j.smith@ibvap.gov', role: 'Operator', status: 'Active', lastLogin: '3 hours ago' },
  { id: 4, username: 'analyst01', name: 'Bob Wilson', email: 'b.wilson@ibvap.gov', role: 'Analyst', status: 'Inactive', lastLogin: '2 days ago' },
  { id: 5, username: 'auditor01', name: 'Alice Brown', email: 'a.brown@ibvap.gov', role: 'Auditor', status: 'Active', lastLogin: '5 mins ago' },
];

const roles = [
  { name: 'Administrator', color: 'bg-red-500/20 text-red-400 border-red-500/30', desc: 'Full system access and configuration.' },
  { name: 'Commander', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', desc: 'Oversight, alert management, and incident response.' },
  { name: 'Operator', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', desc: 'Live surveillance, PTZ control, and basic alerts.' },
  { name: 'Analyst', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', desc: 'Historical data, analytics, and reporting.' },
  { name: 'Auditor', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', desc: 'Read-only access to audit logs and evidence integrity.' },
];

export function UsersRoles() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="p-6 h-full flex flex-col bg-slate-950 text-slate-200">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-emerald-500" />
            Users & Roles (RBAC)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage platform access, users, and role-based permissions</p>
        </div>
        {activeTab === 'users' && (
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors">
            <UserPlus size={16} /> Add User
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'roles' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Roles & Permissions
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'users' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-950/50 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Last Login</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleObj = roles.find(r => r.name === u.role);
                  return (
                    <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{u.username}</div>
                        <div className="text-xs text-slate-400">{u.name} • {u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs border ${roleObj?.color}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.status === 'Active' ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                            <CheckCircle2 size={14} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                            <XCircle size={14} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{u.lastLogin}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button className="text-blue-400 hover:text-blue-300"><Edit2 size={16} /></button>
                          <button className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(r => (
              <div key={r.name} className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded border text-sm font-semibold ${r.color}`}>
                    {r.name}
                  </div>
                  <Shield size={20} className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm mb-4">{r.desc}</p>
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-sm rounded transition-colors text-slate-300">
                  View Permissions Matrix
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
