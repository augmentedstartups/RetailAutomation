# Retail Analytics Dashboard

A real-time computer vision dashboard showcasing YOLO26 capabilities for retail analytics. Features futuristic UI with live object detection, tracking, segmentation, pose estimation, and heatmaps.

![Dashboard Preview](https://img.shields.io/badge/YOLO-26-blue?style=for-the-badge&logo=ultralytics) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)

![Dashboard Screenshot](mainimage.png)

## Features

- **Object Detection & Tracking**: Real-time person detection with ID tracking
- **Tracking Trails**: Customizable motion trails with gradient thickness
- **Segmentation**: Instance segmentation overlays
- **Pose Estimation**: Skeletal keypoint detection
- **Heatmaps**: Accumulation zones showing foot traffic patterns
- **Model Selection**: Switch between nano/small/medium/large/x-large models
- **Confidence Tuning**: Adjustable detection threshold slider
- **Pause/Resume**: Control processing to save resources
- **Live Analytics**: Real-time people count graph and FPS counter

## Demo

![Demo GIF](demo.gif)

## Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **GPU (Optional)**: Apple Silicon (M1/M2/M3/M4), NVIDIA CUDA, or CPU

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/RetailAutomation.git
cd RetailAutomation
```

### 2. Backend Setup

The backend will automatically download YOLO26 models on first run (nano through x-large for detection, segmentation, and pose).

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Usage

1. Start the backend server (see above)
2. Start the frontend dev server
3. Open your browser to `http://localhost:5173`
4. Use the controls panel to toggle features:
   - **Speed ↔ Accuracy**: Select model size
   - **Object Tracking**: Enable ID-based tracking
   - **Tracking Trails**: Show motion paths with adjustable length
   - **Segmentation**: Overlay instance masks
   - **Pose Estimation**: Display keypoint skeletons
   - **Heatmap**: Visualize traffic density
   - **Confidence Threshold**: Tune detection sensitivity

## Project Structure

```
RetailAutomation/
├── backend/
│   ├── models/          # Auto-downloaded YOLO26 weights (.pt files)
│   ├── main.py          # FastAPI server
│   ├── processor.py     # Computer vision logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.tsx      # Main dashboard
│   │   └── index.css    # Futuristic styling
│   └── package.json
├── retailvideo.mp4      # Sample retail footage
└── README.md
```

## Technologies

- **Backend**: FastAPI, Ultralytics YOLO26, OpenCV, PyTorch
- **Frontend**: React, TypeScript, ShadCN UI, TailwindCSS, Recharts
- **Real-time**: WebSockets, MJPEG streaming

## License

MIT

## Acknowledgments

- [Ultralytics YOLO26](https://docs.ultralytics.com/models/yolo26/) for state-of-the-art vision models
- ShadCN for elegant UI components
