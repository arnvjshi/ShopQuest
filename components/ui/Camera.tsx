import React, { useRef, useEffect, useState } from "react";

/**
 * Camera component displays the device camera feed fullscreen, with a frosted glass overlay and centered overlays.
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
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-black z-0 flex items-center justify-center ${className}`}
      style={{ touchAction: "none" }}
    >
      {/* Camera video stream (lowest z-index above bg) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-10"
      />
      {/* Subtle frosted glass overlay (centered, not fully opaque) */}
      <div className="absolute inset-0 z-20 bg-white/10 backdrop-blur-md border border-white/20 pointer-events-none flex items-center justify-center" />
      {/* Overlay content (centered) */}
      {overlayContent && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          {overlayContent}
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 text-white text-lg font-semibold">
          {error}
        </div>
      )}
    </div>
  );
};

export default Camera; 