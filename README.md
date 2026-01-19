# Retail Analytics Dashboard

## Prerequisites

- Python 3.8+
- Node.js 18+
- `retailvideo.mp4` in the project root.

## Setup & Run

### 1. Backend

Open a terminal in the root directory:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend API will run at `http://localhost:8000`.

### 2. Frontend

Open a new terminal in the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

Open the link provided (usually `http://localhost:5173`) in your browser.

## Features

- **Real-time Video**: Displays `retailvideo.mp4` with overlays.
- **Toggles**: Enable/disable Tracking, Trails, Segmentation, Pose, Heatmap.
- **Analytics**: Real-time people count graph and frame counter.
