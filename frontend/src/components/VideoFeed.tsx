import React from 'react';

const VIDEO_URL = "http://localhost:8000/video_feed";

const VideoFeed: React.FC = () => {
    return (
        <div className="w-full h-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
             <img 
                src={VIDEO_URL} 
                alt="Live Video Feed" 
                className="w-full h-full object-contain"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    // You could show a placeholder or error message here
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                        parent.innerText = "Video Stream Offline";
                        parent.className += " text-white font-bold";
                    }
                }}
             />
        </div>
    );
};

export default VideoFeed;
