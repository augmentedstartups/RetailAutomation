import cv2
import numpy as np
from ultralytics import YOLO
from ultralytics.utils.downloads import attempt_download_asset
from collections import defaultdict, deque
from pathlib import Path
import time
import torch

class VideoProcessor:
    def __init__(self, video_path="retailvideo.mp4"):
        self.video_path = video_path
        self.cap = cv2.VideoCapture(self.video_path)

        self.model_dir = Path(__file__).resolve().parent / "models"
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.available_sizes = ["n", "s", "m", "l", "x"]
        self._ensure_weights()
        self.model_cache = {}
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"

        self.track_history = defaultdict(deque)

        self.heatmap_accum = None

        self.toggles = {
            "tracking": True,
            "trails": False,
            "segmentation": False,
            "pose": False,
            "heatmap": False,
            "trail_length": 60,
            "model_size": "m",
            "confidence": 0.25,
            "paused": False
        }

        self.metrics = {
            "fps": 0,
            "people_count": 0,
            "frame_count": 0
        }
        self.color_cache = {}
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        self.last_frame_bytes = None

    def update_toggles(self, new_toggles):
        self.toggles.update(new_toggles)

    def _weights_path(self, size, task):
        suffix = "" if task == "det" else f"-{task}"
        name = f"yolo26{size}{suffix}.pt"
        return self.model_dir / name

    def _ensure_weights(self):
        root_dir = self.model_dir.parent.parent
        for path in root_dir.glob("yolo26*.pt"):
            target = self.model_dir / path.name
            if not target.exists():
                path.replace(target)
        for size in self.available_sizes:
            for task in ["det", "seg", "pose"]:
                path = self._weights_path(size, task)
                attempt_download_asset(str(path), release="latest")

    def _get_model(self, size, task):
        key = f"{size}-{task}"
        if key in self.model_cache:
            return self.model_cache[key]
        path = self._weights_path(size, task)
        model = YOLO(str(path))
        self.model_cache[key] = model
        return model

    def _color_from_id(self, track_id):
        if track_id in self.color_cache:
            return self.color_cache[track_id]
        hue = (track_id * 37) % 180
        color = cv2.cvtColor(np.uint8([[[hue, 200, 255]]]), cv2.COLOR_HSV2BGR)[0][0]
        bgr = (int(color[0]), int(color[1]), int(color[2]))
        self.color_cache[track_id] = bgr
        return bgr

    def _draw_futuristic_box(self, img, x1, y1, x2, y2, color, track_id=None):
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        overlay = img.copy()
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, thickness=6)
        cv2.addWeighted(overlay, 0.15, img, 0.85, 0, img)
        cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness=2)
        corner = 18
        cv2.line(img, (x1, y1), (x1 + corner, y1), color, 2)
        cv2.line(img, (x1, y1), (x1, y1 + corner), color, 2)
        cv2.line(img, (x2, y1), (x2 - corner, y1), color, 2)
        cv2.line(img, (x2, y1), (x2, y1 + corner), color, 2)
        cv2.line(img, (x1, y2), (x1 + corner, y2), color, 2)
        cv2.line(img, (x1, y2), (x1, y2 - corner), color, 2)
        cv2.line(img, (x2, y2), (x2 - corner, y2), color, 2)
        cv2.line(img, (x2, y2), (x2, y2 - corner), color, 2)
        if track_id is not None:
            label = f"ID {track_id}"
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(img, (x1, y1 - h - 8), (x1 + w + 8, y1), color, -1)
            cv2.putText(img, label, (x1 + 4, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (10, 10, 10), 1)

    def _overlay_masks(self, img, masks, color):
        h, w = img.shape[:2]
        for mask in masks:
            if mask.shape[0] != h or mask.shape[1] != w:
                mask = cv2.resize(mask.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST).astype(bool)
            overlay = img.copy()
            overlay[mask] = (0.35 * np.array(color) + 0.65 * img[mask]).astype(np.uint8)
            img[:] = overlay

    def get_video_frame(self):
        while True:
            try:
                if self.toggles.get("paused") and self.last_frame_bytes is not None:
                    time.sleep(0.1)
                    yield self.last_frame_bytes
                    continue
                start_time = time.time()
                success, frame = self.cap.read()
                if not success or frame is None:
                    self.cap.release()
                    self.cap = cv2.VideoCapture(self.video_path)
                    continue

                self.metrics["frame_count"] += 1

                if self.heatmap_accum is None:
                    self.heatmap_accum = np.zeros((frame.shape[0], frame.shape[1]), dtype=np.float32)

                annotated_frame = frame.copy()

                size = self.toggles.get("model_size", "m")
                if size not in self.available_sizes:
                    size = "m"

                current_model = self._get_model(size, "det")
                if self.toggles["segmentation"]:
                    current_model = self._get_model(size, "seg")
                elif self.toggles["pose"]:
                    current_model = self._get_model(size, "pose")

                conf = float(self.toggles.get("confidence", 0.25))
                if self.toggles["tracking"]:
                    results = current_model.track(frame, persist=True, verbose=False, classes=[0], device=self.device, conf=conf)
                else:
                    results = current_model(frame, verbose=False, classes=[0], device=self.device, conf=conf)

                if results:
                    result = results[0]
                    boxes = result.boxes
                    self.metrics["people_count"] = len(boxes) if boxes is not None else 0

                    if self.toggles["segmentation"] and result.masks is not None:
                        masks = result.masks.data.cpu().numpy().astype(bool)
                        self._overlay_masks(annotated_frame, masks, (140, 70, 255))

                    if self.toggles["pose"] and result.keypoints is not None:
                        kpts = result.keypoints.xy.cpu().numpy()
                        for person in kpts:
                            for x, y in person:
                                if x > 0 and y > 0:
                                    cv2.circle(annotated_frame, (int(x), int(y)), 2, (255, 255, 255), -1)

                    if boxes.id is not None:
                        track_ids = boxes.id.int().cpu().tolist()
                        xywh = boxes.xywh.cpu()

                        for box, track_id in zip(xywh, track_ids):
                            x, y, w, h = box
                            center = (int(x), int(y))
                            x1 = x - w / 2
                            y1 = y - h / 2
                            x2 = x + w / 2
                            y2 = y + h / 2
                            color = self._color_from_id(track_id)
                            self._draw_futuristic_box(annotated_frame, x1, y1, x2, y2, color, track_id)

                            if self.toggles["trails"]:
                                trail_length = int(self.toggles.get("trail_length", 60))
                                history = self.track_history[track_id]
                                history.append(center)
                                while len(history) > trail_length:
                                    history.popleft()
                                points = np.hstack(history).astype(np.int32).reshape((-1, 1, 2))
                                points = points.reshape((-1, 2))
                                total = len(points)
                                for i in range(1, total):
                                    t = i / max(1, total - 1)
                                    thickness = max(1, int(1 + (t * 3)))
                                    cv2.line(
                                        annotated_frame,
                                        tuple(points[i - 1]),
                                        tuple(points[i]),
                                        (0, 255, 255),
                                        thickness,
                                    )

                            if self.toggles["heatmap"]:
                                cv2.circle(self.heatmap_accum, center, 25, 1.0, -1)

                    elif self.toggles["heatmap"] and len(boxes) > 0:
                        xywh = boxes.xywh.cpu()
                        for box in xywh:
                            x, y, w, h = box
                            cv2.circle(self.heatmap_accum, (int(x), int(y)), 25, 1.0, -1)

                    if boxes.id is None and len(boxes) > 0:
                        xyxy = boxes.xyxy.cpu()
                        for box in xyxy:
                            x1, y1, x2, y2 = box
                            color = (0, 255, 255)
                            self._draw_futuristic_box(annotated_frame, x1, y1, x2, y2, color)

                if self.toggles["heatmap"]:
                    heatmap_blur = cv2.GaussianBlur(self.heatmap_accum, (0, 0), 15)
                    heatmap_norm = cv2.normalize(heatmap_blur, None, 0, 255, cv2.NORM_MINMAX)
                    heatmap_color = cv2.applyColorMap(heatmap_norm.astype(np.uint8), cv2.COLORMAP_TURBO)
                    mask = heatmap_norm > 5
                    overlay = annotated_frame.copy()
                    overlay[mask] = heatmap_color[mask]
                    annotated_frame = cv2.addWeighted(overlay, 0.55, annotated_frame, 0.45, 0)

                fps = 1.0 / (time.time() - start_time)
                self.metrics["fps"] = int(fps)

                ret, buffer = cv2.imencode('.jpg', annotated_frame)
                frame_bytes = buffer.tobytes()
                self.last_frame_bytes = frame_bytes

                yield frame_bytes
            except Exception as e:
                print(f"Frame processing error: {e}")
                if self.last_frame_bytes is not None:
                    yield self.last_frame_bytes
                else:
                    time.sleep(0.1)
                    continue
