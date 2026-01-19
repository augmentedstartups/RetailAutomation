import { useState, useEffect } from 'react';
import VideoFeed from '@/components/VideoFeed';
import DashboardControls from '@/components/DashboardControls';
import AnalyticsGraph from '@/components/AnalyticsGraph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';
import useWebSocket from 'react-use-websocket';
import axios from 'axios';

interface Metrics {
  fps: number;
  people_count: number;
  frame_count: number;
}

interface ToggleState {
  tracking: boolean;
  trails: boolean;
  segmentation: boolean;
  pose: boolean;
  heatmap: boolean;
  trailLength: number;
  modelSizeIndex: number;
  confidence: number;
  paused: boolean;
}

function App() {
  const [toggles, setToggles] = useState<ToggleState>({
    tracking: true,
    trails: false,
    segmentation: false,
    pose: false,
    heatmap: false,
    trailLength: 60,
    modelSizeIndex: 2,
    confidence: 0.25,
    paused: false,
  });

  const [metrics, setMetrics] = useState<Metrics>({
    fps: 0,
    people_count: 0,
    frame_count: 0,
  });

  const [graphData, setGraphData] = useState<{ time: string; count: number }[]>([]);
  const API_URL = 'http://localhost:8000/toggles';
  const sizeOptions = ["n", "s", "m", "l", "x"];

  const buildPayload = (next: ToggleState) => ({
    tracking: next.tracking,
    trails: next.trails,
    segmentation: next.segmentation,
    pose: next.pose,
    heatmap: next.heatmap,
    trail_length: next.trailLength,
    model_size: sizeOptions[next.modelSizeIndex] ?? "m",
    confidence: next.confidence,
    paused: next.paused,
  });

  const handlePauseToggle = async () => {
    const next = { ...toggles, paused: !toggles.paused };
    setToggles(next);
    try {
      await axios.post(API_URL, buildPayload(next));
    } catch (error) {
      console.error("Failed to update pause:", error);
    }
  };

  const WS_URL = 'ws://localhost:8000/ws';

  const { lastJsonMessage } = useWebSocket(WS_URL, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (lastJsonMessage) {
      const data = lastJsonMessage as Metrics;
      setMetrics(data);
      
      setGraphData(prev => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const newData = [...prev, { time: timeStr, count: data.people_count }];
        if (newData.length > 50) return newData.slice(newData.length - 50);
        return newData;
      });
    }
  }, [lastJsonMessage]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Retail Camera Dashboard</h1>
          <p className="text-muted-foreground mt-2">YOLO26 Real-time Analytics</p>
        </div>
        <Button variant="outline" size="icon" onClick={handlePauseToggle} aria-label={toggles.paused ? 'Resume' : 'Pause'}>
          {toggles.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
        <div className="lg:col-span-2 h-full flex flex-col gap-4">
          <div className="flex-grow bg-card rounded-lg border shadow-sm relative overflow-hidden">
             <VideoFeed />
             <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm font-mono">
                FPS: {metrics.fps}
             </div>
          </div>
        </div>

        <div className="flex flex-col h-full">
            <div className="h-64 flex-shrink-0 mb-6">
                <AnalyticsGraph data={graphData} currentCount={metrics.people_count} />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Frames Processed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{metrics.frame_count}</div>
                        <p className="text-xs text-muted-foreground">Total frames analyzed</p>
                    </CardContent>
                </Card>

                <DashboardControls toggles={toggles} setToggles={setToggles} />
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;
