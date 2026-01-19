from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
import uvicorn
from processor import VideoProcessor

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Video Processor
video_processor = VideoProcessor(video_path="../retailvideo.mp4")

class ToggleRequest(BaseModel):
    tracking: bool = True
    trails: bool = False
    segmentation: bool = False
    pose: bool = False
    heatmap: bool = False
    trail_length: int = 60
    model_size: str = "m"
    confidence: float = 0.25
    paused: bool = False

@app.get("/")
async def root():
    return {"message": "Retail Analytics Backend is running"}

@app.get("/video_feed")
def video_feed():
    def generate():
        for frame_bytes in video_processor.get_video_frame():
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.post("/toggles")
async def update_toggles(toggles: ToggleRequest):
    video_processor.update_toggles(toggles.model_dump())
    return {"status": "updated", "toggles": video_processor.toggles}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Send metrics every 100ms
            data = video_processor.metrics
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
