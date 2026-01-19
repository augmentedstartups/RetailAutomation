import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Activity, Footprints, Grid, User } from 'lucide-react';
import axios from 'axios';

interface Toggles {
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

interface DashboardControlsProps {
    toggles: Toggles;
    setToggles: React.Dispatch<React.SetStateAction<Toggles>>;
}

const API_URL = "http://localhost:8000/toggles";

const DashboardControls: React.FC<DashboardControlsProps> = ({ toggles, setToggles }) => {

    const sizeOptions = ["n", "s", "m", "l", "x"];
    const sizeLabels = ["Nano", "Small", "Medium", "Large", "X-Large"];

    const buildPayload = (next: Toggles) => ({
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

    const handleToggleChange = async (key: keyof Toggles, value: boolean) => {
        let newToggles = { ...toggles, [key]: value };
        
        if (key === 'segmentation' && value) {
            newToggles.pose = false;
        } else if (key === 'pose' && value) {
            newToggles.segmentation = false;
        }
        
        setToggles(newToggles);
        try {
            await axios.post(API_URL, buildPayload(newToggles));
        } catch (error) {
            console.error("Failed to update toggles:", error);
        }
    };

    const handleTrailLengthChange = async (value: number[]) => {
        const newToggles = { ...toggles, trailLength: value[0] };
        setToggles(newToggles);
        try {
            await axios.post(API_URL, buildPayload(newToggles));
        } catch (error) {
            console.error("Failed to update trail length:", error);
        }
    };

    const handleModelSizeChange = async (value: number[]) => {
        const newToggles = { ...toggles, modelSizeIndex: value[0] };
        setToggles(newToggles);
        try {
            await axios.post(API_URL, buildPayload(newToggles));
        } catch (error) {
            console.error("Failed to update model size:", error);
        }
    };

    const handleConfidenceChange = async (value: number[]) => {
        const newToggles = { ...toggles, confidence: value[0] };
        setToggles(newToggles);
        try {
            await axios.post(API_URL, buildPayload(newToggles));
        } catch (error) {
            console.error("Failed to update confidence:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Speed</span>
                        <span className="text-sm font-medium">Accuracy</span>
                    </div>
                    <Slider
                        value={[toggles.modelSizeIndex]}
                        min={0}
                        max={4}
                        step={1}
                        onValueChange={handleModelSizeChange}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{sizeLabels[0]}</span>
                        <span>{sizeLabels[4]}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Selected: {sizeLabels[toggles.modelSizeIndex] ?? "Medium"}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm font-medium">Object Tracking</span>
                    </div>
                    <Switch 
                        checked={toggles.tracking} 
                        onCheckedChange={(c) => handleToggleChange('tracking', c)} 
                    />
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Footprints className="h-4 w-4" />
                        <span className="text-sm font-medium">Tracking Trails</span>
                    </div>
                    <Switch 
                        checked={toggles.trails} 
                        onCheckedChange={(c) => handleToggleChange('trails', c)} 
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Trail Length</span>
                        <span className="text-xs font-mono">{toggles.trailLength}</span>
                    </div>
                    <Slider
                        value={[toggles.trailLength]}
                        min={20}
                        max={120}
                        step={5}
                        onValueChange={handleTrailLengthChange}
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Confidence Threshold</span>
                        <span className="text-xs font-mono">{toggles.confidence.toFixed(2)}</span>
                    </div>
                    <Slider
                        value={[toggles.confidence]}
                        min={0.05}
                        max={0.95}
                        step={0.05}
                        onValueChange={handleConfidenceChange}
                    />
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Grid className="h-4 w-4" />
                        <span className="text-sm font-medium">Segmentation</span>
                    </div>
                    <Switch 
                        checked={toggles.segmentation} 
                        onCheckedChange={(c) => handleToggleChange('segmentation', c)}
                        disabled={toggles.pose}
                    />
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Pose Estimation</span>
                    </div>
                    <Switch 
                        checked={toggles.pose} 
                        onCheckedChange={(c) => handleToggleChange('pose', c)}
                        disabled={toggles.segmentation}
                    />
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Heatmap</span>
                    </div>
                    <Switch 
                        checked={toggles.heatmap} 
                        onCheckedChange={(c) => handleToggleChange('heatmap', c)} 
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default DashboardControls;
