import React, { useRef, useEffect, useState } from "react";

/**
 * Camera component displays the device camera feed with a glass (frosted) effect overlay.
 */
export const Camera: React.FC<{
  className?: string;
  overlayContent?: React.ReactNode;
}> = ({ className = "", overlayContent }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Unable to access camera");
      }
    };
    getCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-xl ${className}`} style={{ minHeight: 320 }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Glass effect overlay */}
      <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl pointer-events-none" />
      {/* Overlay content (e.g., AR UI, controls) */}
      {overlayContent && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          {overlayContent}
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 text-white text-lg font-semibold">
          {error}
        </div>
      )}
    </div>
  );
};

export default Camera; 