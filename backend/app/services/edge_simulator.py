from typing import Dict, List, Optional
from datetime import datetime, timezone
from dataclasses import dataclass, field
import asyncio

@dataclass
class PendingEvent:
    event_type: str
    data: dict
    timestamp: str
    
@dataclass
class EdgeNodeState:
    node_id: str
    status: str  # online/degraded/offline
    network_status: str  # online/degraded/offline
    ai_status: str  # active/degraded/inactive
    pending_sync: List[PendingEvent] = field(default_factory=list)
    last_sync: Optional[str] = None
    bandwidth_mbps: float = 38.0
    traditional_bandwidth_mbps: float = 420.0

class EdgeSimulator:
    """Simulates edge node behavior, network conditions, and sync."""
    
    def __init__(self):
        self.nodes: Dict[str, EdgeNodeState] = {}
        self._init_default_nodes()
    
    def _init_default_nodes(self):
        for i in range(1, 9):
            node_id = f'EDGE-{i:03d}'
            self.nodes[node_id] = EdgeNodeState(
                node_id=node_id,
                status='online',
                network_status='online',
                ai_status='active',
                last_sync=datetime.now(timezone.utc).isoformat()
            )
    
    def set_network_status(self, status: str):
        """Set network status for all nodes: online, degraded, offline"""
        for node in self.nodes.values():
            node.network_status = status
            if status == 'offline':
                node.status = 'offline'
                node.ai_status = 'active'  # AI continues locally
            elif status == 'degraded':
                node.status = 'degraded'
                node.ai_status = 'active'
            else:
                node.status = 'online'
                node.ai_status = 'active'
    
    def queue_event(self, node_id: str, event: dict):
        """Queue event when offline."""
        if node_id in self.nodes:
            self.nodes[node_id].pending_sync.append(
                PendingEvent(
                    event_type=event.get('type', 'unknown'),
                    data=event,
                    timestamp=datetime.now(timezone.utc).isoformat()
                )
            )
    
    async def sync_node(self, node_id: str) -> Dict:
        """Sync pending events from a node."""
        if node_id not in self.nodes:
            return {'synced': 0, 'status': 'not_found'}
        node = self.nodes[node_id]
        if node.network_status == 'offline':
            return {'synced': 0, 'status': 'offline', 'pending': len(node.pending_sync)}
        
        count = len(node.pending_sync)
        node.pending_sync.clear()
        node.last_sync = datetime.now(timezone.utc).isoformat()
        return {'synced': count, 'status': 'success', 'pending': 0}
    
    def get_status_summary(self) -> Dict:
        online = sum(1 for n in self.nodes.values() if n.status == 'online')
        degraded = sum(1 for n in self.nodes.values() if n.status == 'degraded')
        offline = sum(1 for n in self.nodes.values() if n.status == 'offline')
        total_pending = sum(len(n.pending_sync) for n in self.nodes.values())
        return {
            'total_nodes': len(self.nodes),
            'online': online,
            'degraded': degraded,
            'offline': offline,
            'total_pending_sync': total_pending,
            'bandwidth_savings': {
                'traditional_mbps': 420.0,
                'ibvap_mbps': 38.0,
                'reduction_percent': 91.0
            },
            'nodes': {nid: {
                'status': n.status,
                'network': n.network_status,
                'ai': n.ai_status,
                'pending': len(n.pending_sync),
                'last_sync': n.last_sync
            } for nid, n in self.nodes.items()}
        }

edge_sim = EdgeSimulator()
