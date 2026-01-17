/**
 * AstroWound-MEASURE Camera Module
 * Standardized wound photography with quality checks
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Check, AlertTriangle, RotateCcw, Zap } from 'lucide-react';
import { useCaptureStore } from '@/store';
import { getCalibrationEngine, getQualityCheckEngine } from '@/engine';
import type { CalibrationData, QualityCheck } from '@/types';

interface CameraModuleProps {
  onCapture: (imageData: ImageData, calibration: CalibrationData, quality: QualityCheck) => void;
  onClose: () => void;
}

export const CameraModule: React.FC<CameraModuleProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveCalibration, setLiveCalibration] = useState<CalibrationData | null>(null);

  const {
    isCapturing,
    setCapturing,
    calibrationDetected,
    setCalibrationDetected,
    qualityPassed,
    setQualityPassed,
    previewImage,
    setPreviewImage,
  } = useCaptureStore();

  // Initialize camera
  useEffect(() => {
    initCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const initCamera = async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 4 / 3 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Start live calibration detection
      startLiveCalibrationDetection();
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(mode => mode === 'user' ? 'environment' : 'user');
  };

  const toggleFlash = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      
      if (capabilities.torch) {
        // Use any to bypass strict typing for torch constraint which is browser-specific
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as Record<string, unknown>],
        } as MediaTrackConstraints);
        setFlashEnabled(!flashEnabled);
      }
    }
  };

  // Live calibration detection
  const startLiveCalibrationDetection = () => {
    const calibrationEngine = getCalibrationEngine();
    let animationId: number;

    const detectCalibration = async () => {
      if (!videoRef.current || !canvasRef.current) {
        animationId = requestAnimationFrame(detectCalibration);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState < 2) {
        animationId = requestAnimationFrame(detectCalibration);
        return;
      }

      // Resize canvas to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame
      ctx.drawImage(video, 0, 0);

      // Get image data for calibration detection (downsampled for performance)
      const scaledWidth = 320;
      const scaledHeight = Math.round(320 * video.videoHeight / video.videoWidth);
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = scaledWidth;
      tempCanvas.height = scaledHeight;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(video, 0, 0, scaledWidth, scaledHeight);
      
      const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);

      try {
        const calibration = await calibrationEngine.detectCalibration(imageData);
        setLiveCalibration(calibration);
        setCalibrationDetected(calibration.detected && calibration.confidence > 0.6);
      } catch (err) {
        console.error('Calibration detection error:', err);
      }

      // Continue detection loop (throttled)
      setTimeout(() => {
        animationId = requestAnimationFrame(detectCalibration);
      }, 200); // Check every 200ms
    };

    animationId = requestAnimationFrame(detectCalibration);

    return () => cancelAnimationFrame(animationId);
  };

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    setCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      // Set canvas to full video resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw frame
      ctx.drawImage(video, 0, 0);

      // Get full resolution image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Get preview data URL
      const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewImage(previewUrl);

      // Run calibration detection
      const calibrationEngine = getCalibrationEngine();
      const calibration = await calibrationEngine.detectCalibration(imageData);
      setCalibrationDetected(calibration.detected);

      // Run quality checks
      const qualityEngine = getQualityCheckEngine();
      const quality = await qualityEngine.runQualityChecks(imageData, calibration);
      setQualityPassed(quality.passed);

      // Pass results to parent
      onCapture(imageData, calibration, quality);
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture image');
    } finally {
      setIsProcessing(false);
      setCapturing(false);
    }
  }, [isProcessing, onCapture, setCapturing, setPreviewImage, setCalibrationDetected, setQualityPassed]);

  const retake = () => {
    setPreviewImage(null);
    setCalibrationDetected(false);
    setQualityPassed(false);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
          <AlertTriangle className="w-12 h-12 text-clinical-danger mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={initCamera}
              className="px-4 py-2 bg-astro-500 text-white rounded-lg"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <button onClick={onClose} className="p-2" title="Close camera" aria-label="Close camera">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="font-semibold">Capture Wound Image</h2>
          <p className="text-sm text-gray-300">
            Position calibration ruler in frame
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {previewImage ? (
          <img
            src={previewImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </>
        )}

        {/* Calibration Overlay */}
        {!previewImage && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-white/50 -translate-x-1/2" />
                <div className="absolute bottom-0 left-1/2 w-0.5 h-4 bg-white/50 -translate-x-1/2" />
                <div className="absolute left-0 top-1/2 w-4 h-0.5 bg-white/50 -translate-y-1/2" />
                <div className="absolute right-0 top-1/2 w-4 h-0.5 bg-white/50 -translate-y-1/2" />
              </div>
            </div>

            {/* Calibration status */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
              <div className={`px-4 py-2 rounded-full ${
                calibrationDetected 
                  ? 'bg-clinical-success/90' 
                  : 'bg-clinical-warning/90'
              } text-white font-medium`}>
                {calibrationDetected ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Calibration detected ({Math.round((liveCalibration?.confidence || 0) * 100)}%)
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Place calibration ruler in frame
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview controls */}
        {previewImage && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                calibrationDetected ? 'bg-clinical-success' : 'bg-clinical-danger'
              }`}>
                {calibrationDetected ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <X className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="text-white text-sm">Calibration</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                qualityPassed ? 'bg-clinical-success' : 'bg-clinical-danger'
              }`}>
                {qualityPassed ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <X className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="text-white text-sm">Quality</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/80">
        {previewImage ? (
          <div className="flex justify-center gap-6">
            <button
              onClick={retake}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <span className="text-sm">Retake</span>
            </button>
            <button
              onClick={onClose}
              disabled={!calibrationDetected}
              className={`flex flex-col items-center gap-1 ${
                calibrationDetected ? 'text-white' : 'text-gray-500'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                calibrationDetected ? 'bg-clinical-success' : 'bg-gray-700'
              }`}>
                <Check className="w-6 h-6" />
              </div>
              <span className="text-sm">Use Photo</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {/* Toggle camera */}
            <button
              onClick={toggleCamera}
              className="p-3 text-white"
              title="Switch camera"
              aria-label="Switch camera"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            {/* Capture button */}
            <button
              onClick={captureImage}
              disabled={isProcessing}
              className="relative"
              title="Capture image"
              aria-label="Capture image"
            >
              <div className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${
                isProcessing ? 'opacity-50' : ''
              }`}>
                <div className={`w-16 h-16 rounded-full bg-white ${
                  isCapturing ? 'animate-pulse' : ''
                }`} />
              </div>
            </button>

            {/* Flash toggle */}
            <button
              onClick={toggleFlash}
              className="p-3 text-white"
              title="Toggle flash"
              aria-label="Toggle flash"
            >
              <Zap className={`w-6 h-6 ${flashEnabled ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
