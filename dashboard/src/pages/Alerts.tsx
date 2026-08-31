import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAlerts, useAlertRules } from '@/hooks/useData'
import { AlertTriangle, Bell, Plus, Check, X, Filter, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { api } from '@/api/client'

const severityColors = {
  critical: 'alert-critical border-red-500',
  warning: 'alert-warning border-yellow-500',
  info: 'alert-info border-blue-500',
}

const severityLabels = {
  critical: 'CRITICAL',
  warning: 'WARNING',
  info: 'INFO',
}

export function Alerts() {
  const { alerts, loading, acknowledge, refetch } = useAlerts()
  const { rules, loading: rulesLoading, createRule, deleteRule } = useAlertRules()
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const [filterAcknowledged, setFilterAcknowledged] = useState<'all' | 'acked' | 'unacked'>('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false
    if (filterAcknowledged === 'acked' && !alert.acknowledged) return false
    if (filterAcknowledged === 'unacked' && alert.acknowledged) return true
    return true
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Security events and notifications</p>
        </div>
        <button
          onClick={() => setShowRuleForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="flex gap-2">
              {['all', 'critical', 'warning', 'info'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev as any)}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium transition-colors',
                    filterSeverity === sev
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  )}
                >
                  {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              {['all', 'acked', 'unacked'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterAcknowledged(f as any)}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium transition-colors',
                    filterAcknowledged === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  )}
                >
                  {f === 'all' ? 'All' : f === 'acked' ? 'Acknowledged' : 'Unacknowledged'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Alert Rules</span>
            <span className="text-sm text-muted-foreground">{rules.length} rules</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No alert rules configured</p>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rule.camera_ids.length > 0 ? `${rule.camera_ids.length} cameras` : 'All cameras'} •
                      {rule.alert_types.length > 0 ? rule.alert_types.join(', ') : 'All types'} •
                      Cooldown: {rule.cooldown_seconds}s
                    </p>
                  </div>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1 hover:bg-accent rounded text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Alerts</span>
            <span className="text-sm text-muted-foreground">{alerts.length} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No alerts matching filters</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 rounded-lg border-l-4 transition-colors',
                    severityColors[alert.severity],
                    alert.acknowledged ? 'opacity-70' : ''
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded',
                          alert.severity === 'critical' ? 'bg-red-900/50 text-red-300' :
                          alert.severity === 'warning' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-blue-900/50 text-blue-300'
                        )}>
                          {severityLabels[alert.severity]}
                        </span>
                        <span className="text-xs text-muted-foreground">{alert.type.replace(/_/g, ' ')}</span>
                        {!alert.acknowledged && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-900/50 text-yellow-300 rounded">UNACK</span>
                        )}
                      </div>
                      <p className="font-medium mb-1">{alert.message}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{alert.camera_id}</span>
                        <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                        {alert.class_name && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded">
                            {alert.class_name} {alert.confidence ? `(${Math.round(alert.confidence * 100)}%)` : ''}
                          </span>
                        )}
                        {alert.plate_text && (
                          <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded">
                            Plate: {alert.plate_text}
                          </span>
                        )}
                        {alert.face_match_id && (
                          <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded">
                            Face: {alert.face_match_id} ({alert.face_distance?.toFixed(3)})
                          </span>
                        )}
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledge(alert.id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex-shrink-0"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Modal */}
      {showRuleForm && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border border-border p-6">
            <CardHeader>
              <CardTitle>Create Alert Rule</CardTitle>
            </CardHeader>
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g., Perimeter Intrusion"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary">
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cooldown (seconds)</label>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRuleForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex-1"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </Card>
      )}
    </div>
  )
}