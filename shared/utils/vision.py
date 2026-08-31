import cv2
import numpy as np
from typing import Tuple, List, Optional
import time


def draw_bbox(
    image: np.ndarray,
    bbox: Tuple[float, float, float, float],
    label: str = "",
    color: Tuple[int, int, int] = (0, 255, 0),
    thickness: int = 2,
    font_scale: float = 0.5,
) -> np.ndarray:
    x1, y1, x2, y2 = map(int, bbox)
    cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness)
    if label:
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
        cv2.rectangle(image, (x1, y1 - th - 4), (x1 + tw, y1), color, -1)
        cv2.putText(image, label, (x1, y1 - 2), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), thickness)
    return image


def draw_polygon(
    image: np.ndarray,
    points: List[Tuple[float, float]],
    color: Tuple[int, int, int] = (0, 255, 255),
    thickness: int = 2,
    label: str = "",
) -> np.ndarray:
    pts = np.array(points, dtype=np.int32).reshape((-1, 1, 2))
    cv2.polylines(image, [pts], True, color, thickness)
    if label and len(points) > 0:
        x, y = points[0]
        cv2.putText(image, label, (int(x), int(y) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    return image


def draw_line(
    image: np.ndarray,
    pt1: Tuple[float, float],
    pt2: Tuple[float, float],
    color: Tuple[int, int, int] = (255, 0, 255),
    thickness: int = 2,
    label: str = "",
) -> np.ndarray:
    cv2.line(image, (int(pt1[0]), int(pt1[1])), (int(pt2[0]), int(pt2[1])), color, thickness)
    if label:
        mid_x = int((pt1[0] + pt2[0]) / 2)
        mid_y = int((pt1[1] + pt2[1]) / 2)
        cv2.putText(image, label, (mid_x, mid_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
    return image


def draw_zone_overlay(
    image: np.ndarray,
    zones: List[dict],
    alpha: float = 0.2,
) -> np.ndarray:
    overlay = image.copy()
    for zone in zones:
        ztype = zone.get("type", "polygon")
        coords = zone.get("coordinates", [])
        color = zone.get("color", (0, 255, 255))
        name = zone.get("name", "")

        if ztype == "polygon" and len(coords) >= 3:
            pts = np.array(coords, dtype=np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(overlay, [pts], color)
            cv2.polylines(overlay, [pts], True, color, 2)
            if name:
                x, y = coords[0]
                cv2.putText(overlay, name, (int(x), int(y) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        elif ztype == "rectangle" and len(coords) == 1 and len(coords[0]) == 4:
            x1, y1, x2, y2 = coords[0]
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)
            if name:
                cv2.putText(overlay, name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        elif ztype == "circle" and len(coords) == 1 and len(coords[0]) == 3:
            cx, cy, r = coords[0]
            cv2.circle(overlay, (int(cx), int(cy)), int(r), color, -1)
            cv2.circle(overlay, (int(cx), int(cy)), int(r), color, 2)
            if name:
                cv2.putText(overlay, name, (int(cx) - 30, int(cy)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0, image)
    return image


def resize_keep_aspect(image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
    h, w = image.shape[:2]
    tw, th = target_size
    scale = min(tw / w, th / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = cv2.resize(image, (nw, nh), interpolation=cv2.INTER_LINEAR)

    canvas = np.zeros((th, tw, 3), dtype=np.uint8)
    dx, dy = (tw - nw) // 2, (th - nh) // 2
    canvas[dy:dy+nh, dx:dx+nw] = resized
    return canvas


def crop_bbox(image: np.ndarray, bbox: Tuple[float, float, float, float], padding: float = 0.0) -> np.ndarray:
    h, w = image.shape[:2]
    x1, y1, x2, y2 = bbox
    bw, bh = x2 - x1, y2 - y1
    px, py = bw * padding, bh * padding
    x1 = max(0, int(x1 - px))
    y1 = max(0, int(y1 - py))
    x2 = min(w, int(x2 + px))
    y2 = min(h, int(y2 + py))
    if x2 <= x1 or y2 <= y1:
        return np.array([])
    return image[y1:y2, x1:x2].copy()


def nms(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float = 0.45) -> List[int]:
    if len(boxes) == 0:
        return []
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        ovr = inter / (areas[i] + areas[order[1:]] - inter)
        inds = np.where(ovr <= iou_threshold)[0]
        order = order[inds + 1]
    return keep


class FPSCounter:
    def __init__(self, window: int = 30):
        self.window = window
        self.times: List[float] = []

    def tick(self):
        now = time.time()
        self.times.append(now)
        if len(self.times) > self.window:
            self.times.pop(0)

    def fps(self) -> float:
        if len(self.times) < 2:
            return 0.0
        return (len(self.times) - 1) / (self.times[-1] - self.times[0])


def letterbox(im: np.ndarray, new_shape: Tuple[int, int] = (640, 640), color: Tuple[int, int, int] = (114, 114, 114)) -> Tuple[np.ndarray, float, Tuple[float, float]]:
    shape = im.shape[:2]
    if isinstance(new_shape, int):
        new_shape = (new_shape, new_shape)
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]
    dw /= 2
    dh /= 2
    if shape[::-1] != new_unpad:
        im = cv2.resize(im, new_unpad, interpolation=cv2.INTER_LINEAR)
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    im = cv2.copyMakeBorder(im, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
    return im, r, (dw, dh)