import asyncio
import json
import logging
import time
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from collections import defaultdict

from shared.config.settings import settings
from shared.messaging.streams import StreamManager
from shared.schemas.alert import Alert, AlertType, AlertSeverity, AlertRule
from shared.schemas.event import Event, EventType

logger = logging.getLogger(__name__)


class AlertEngine:
    def __init__(self, stream_manager: StreamManager):
        self.stream_manager = stream_manager
        self.rules: Dict[str, AlertRule] = {}
        self.alert_history: List[Alert] = []
        self.last_alert_time: Dict[str, float] = defaultdict(float)
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._consumer_group = "alert_engine"
        self._consumer_name = "alert-1"

    async def start(self):
        await self.stream_manager.create_consumer_group(
            StreamManager.EVENT_STREAM,
            self._consumer_group,
            self._consumer_name,
        )
        await self.stream_manager.create_consumer_group(
            StreamManager.TRACK_STREAM,
            self._consumer_group,
            self._consumer_name,
        )
        self._running = True

        task = asyncio.create_task(self._process_events())
        self._tasks.append(task)

        task = asyncio.create_task(self._process_tracks())
        self._tasks.append(task)

        logger.info("Alert Engine started")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("Alert Engine stopped")

    def add_rule(self, rule: AlertRule):
        self.rules[rule.id] = rule

    def remove_rule(self, rule_id: str):
        self.rules.pop(rule_id, None)

    def get_rules(self) -> List[AlertRule]:
        return list(self.rules.values())

    def get_alerts(self, limit: int = 100, camera_id: Optional[str] = None) -> List[Alert]:
        alerts = self.alert_history
        if camera_id:
            alerts = [a for a in alerts if a.camera_id == camera_id]
        return alerts[-limit:]

    async def _process_events(self):
        streams = {StreamManager.EVENT_STREAM: "0"}

        while self._running:
            try:
                results = await self.stream_manager.read_group(
                    self._consumer_group,
                    self._consumer_name,
                    streams,
                    count=50,
                    block=1000,
                )

                if not results:
                    continue

                for stream, messages in results:
                    for msg_id, msg_data in messages:
                        try:
                            data_str = msg_data.get(b"data", msg_data.get("data"))
                            if isinstance(data_str, bytes):
                                data_str = data_str.decode()
                            event_data = json.loads(data_str)
                            event = Event(**event_data)
                            await self._evaluate_event(event)
                            await self.stream_manager.ack(StreamManager.EVENT_STREAM, self._consumer_group, msg_id)
                        except Exception as e:
                            logger.error(f"Error processing event: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Event processing error: {e}")
                await asyncio.sleep(1)

    async def _process_tracks(self):
        streams = {StreamManager.TRACK_STREAM: "0"}

        while self._running:
            try:
                results = await self.stream_manager.read_group(
                    self._consumer_group,
                    self._consumer_name,
                    streams,
                    count=50,
                    block=1000,
                )

                if not results:
                    continue

                for stream, messages in results:
                    for msg_id, msg_data in messages:
                        try:
                            data_str = msg_data.get(b"data", msg_data.get("data"))
                            if isinstance(data_str, bytes):
                                data_str = data_str.decode()
                            track_batch = json.loads(data_str)
                            await self._evaluate_tracks(track_batch)
                            await self.stream_manager.ack(StreamManager.TRACK_STREAM, self._consumer_group, msg_id)
                        except Exception as e:
                            logger.error(f"Error processing tracks: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Track processing error: {e}")
                await asyncio.sleep(1)

    async def _evaluate_event(self, event: Event):
        for rule in self.rules.values():
            if not rule.enabled:
                continue

            if rule.camera_ids and event.camera_id not in rule.camera_ids:
                continue

            if rule.event_types and event.type not in rule.event_types:
                continue

            if event.type in [EventType.ZONE_ENTRY, EventType.ZONE_EXIT, EventType.LINE_CROSS]:
                if rule.zone_ids and event.zone_id not in rule.zone_ids:
                    continue

            await self._create_alert_from_event(event, rule)

    async def _evaluate_tracks(self, track_batch: Dict):
        pass

    async def _create_alert_from_event(self, event: Event, rule: AlertRule):
        cooldown_key = f"{rule.id}:{event.camera_id}:{event.zone_id or ''}:{event.track_id or ''}"
        now = time.time()

        if now - self.last_alert_time[cooldown_key] < rule.cooldown_seconds:
            return

        alert_type_map = {
            EventType.ZONE_ENTRY: AlertType.INTRUSION,
            EventType.ZONE_EXIT: AlertType.INTRUSION,
            EventType.LINE_CROSS: AlertType.LINE_CROSSING,
            EventType.FACE_MATCHED: AlertType.FACE_MATCH,
            EventType.PLATE_MATCHED: AlertType.PLATE_MATCH,
            EventType.CAMERA_OFFLINE: AlertType.CAMERA_OFFLINE,
            EventType.CAMERA_ONLINE: AlertType.CAMERA_ONLINE,
        }

        alert_type = alert_type_map.get(event.type, AlertType.INTRUSION)

        alert = Alert(
            id=str(uuid.uuid4())[:12],
            camera_id=event.camera_id or "unknown",
            zone_id=event.zone_id,
            track_id=event.track_id,
            type=alert_type,
            severity=rule.severity,
            message=event.message,
            class_name=event.data.get("class_name"),
            confidence=event.data.get("confidence"),
            plate_text=event.data.get("plate_text"),
            face_match_id=event.data.get("face_match_id"),
            face_distance=event.data.get("face_distance"),
            metadata=event.data,
            timestamp=event.timestamp,
        )

        self.last_alert_time[cooldown_key] = now
        await self._store_alert(alert)

    async def _store_alert(self, alert: Alert):
        self.alert_history.append(alert)
        if len(self.alert_history) > settings.alert_max_history:
            self.alert_history = self.alert_history[-settings.alert_max_history:]

        await self.stream_manager.add_alert(StreamManager.ALERT_STREAM, alert.model_dump())

        logger.warning(f"ALERT: {alert.message} (camera: {alert.camera_id}, type: {alert.type.value})")