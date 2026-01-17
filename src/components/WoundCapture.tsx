/**
 * AstroWound-MEASURE Wound Capture & Analysis Component
 */

import React, { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { Camera, Loader2, Check, X, Edit3, Save } from 'lucide-react';
import { CameraModule } from './CameraModule';
import { 
  getSegmentationEngine, 
  getMeasurementEngine 
} from '@/engine';
import { useAppStore, useAssessmentsStore } from '@/store';
import type { 
  CalibrationData, 
  QualityCheck, 
  WoundAssessment, 
  WoundMeasurement,
  SegmentationResult 
} from '@/types';

interface WoundCaptureProps {
  woundId: string;
  onComplete: (assessment: WoundAssessment) => void;
  onCancel: () => void;
}

export const WoundCapture: React.FC<WoundCaptureProps> = ({
  woundId,
  onComplete,
  onCancel,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [quality, setQuality] = useState<QualityCheck | null>(null);
  const [segmentation, setSegmentation] = useState<SegmentationResult | null>(null);
  const [measurement, setMeasurement] = useState<WoundMeasurement | null>(null);
  const [manualDepth, setManualDepth] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { isModelLoaded } = useAppStore();
  const { addAssessment } = useAssessmentsStore();

  const handleCapture = useCallback(async (
    imgData: ImageData,
    cal: CalibrationData,
    qual: QualityCheck
  ) => {
    setImageData(imgData);
    setCalibration(cal);
    setQuality(qual);

    // Convert ImageData to base64 for preview
    const canvas = document.createElement('canvas');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imgData, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));

    setShowCamera(false);

    // Process image
    if (cal.detected) {
      await processImage(imgData, cal);
    }
  }, []);

  const processImage = async (imgData: ImageData, cal: CalibrationData) => {
    setProcessing(true);
    setError(null);

    try {
      // Step 1: Segmentation
      setProcessingStep('Running AI wound segmentation...');
      const segEngine = getSegmentationEngine();
      
      if (!isModelLoaded) {
        await segEngine.initialize();
      }

      const segResult = await segEngine.segment(imgData);
      setSegmentation(segResult.segmentation);

      // Step 2: Measurement
      setProcessingStep('Calculating measurements...');
      const measureEngine = getMeasurementEngine();
      const measurements = measureEngine.calculateMeasurements(
        segResult.segmentation,
        cal
      );
      setMeasurement(measurements);

      setProcessingStep('');
    } catch (err) {
      console.error('Processing error:', err);
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const saveAssessment = async () => {
    if (!capturedImage || !calibration || !quality || !segmentation || !measurement) {
      return;
    }

    const depth = manualDepth ? parseFloat(manualDepth) : undefined;
    const volume = depth ? getMeasurementEngine().calculateVolume(measurement.area, depth) : undefined;

    const assessment: WoundAssessment = {
      id: uuid(),
      woundId,
      capturedAt: new Date(),
      capturedBy: 'Current User', // TODO: Get from auth
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio,
      },
      originalImage: capturedImage,
      segmentationResult: segmentation,
      calibrationData: calibration,
      measurement: {
        ...measurement,
        depth,
        volume,
      },
      qualityCheck: quality,
      notes,
      clinicianVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addAssessment(assessment);
    onComplete(assessment);
  };

  const renderSegmentationOverlay = () => {
    if (!segmentation || !capturedImage) return null;

    const { contour, boundingBox } = segmentation;

    // Create SVG path from contour
    const pathData = contour.length > 0
      ? `M ${contour[0].x} ${contour[0].y} ` +
        contour.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
        ' Z'
      : '';

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${imageData?.width || 1} ${imageData?.height || 1}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Wound contour */}
        <path
          d={pathData}
          fill="rgba(239, 68, 68, 0.3)"
          stroke="#ef4444"
          strokeWidth="2"
        />
        
        {/* Bounding box */}
        <rect
          x={boundingBox.x}
          y={boundingBox.y}
          width={boundingBox.width}
          height={boundingBox.height}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="8,4"
        />

        {/* Length indicator */}
        <line
          x1={boundingBox.x}
          y1={boundingBox.y + boundingBox.height / 2}
          x2={boundingBox.x + boundingBox.width}
          y2={boundingBox.y + boundingBox.height / 2}
          stroke="#10b981"
          strokeWidth="2"
          markerEnd="url(#arrow)"
          markerStart="url(#arrow)"
        />

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
          </marker>
        </defs>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <h1 className="text-lg font-semibold">Wound Assessment</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Image Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {capturedImage ? (
            <div className="relative">
              <img
                src={capturedImage}
                alt="Wound"
                className="w-full aspect-[4/3] object-contain bg-gray-100"
              />
              {renderSegmentationOverlay()}
              
              {/* Retake button */}
              <button
                onClick={() => setShowCamera(true)}
                className="absolute top-4 right-4 bg-white/90 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm"
              >
                Retake
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCamera(true)}
              className="w-full aspect-[4/3] bg-gray-100 flex flex-col items-center justify-center gap-4 hover:bg-gray-200 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-astro-500 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Capture Wound Image</p>
                <p className="text-sm text-gray-500">
                  Place calibration ruler next to wound
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Processing indicator */}
        {processing && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <Loader2 className="w-8 h-8 text-astro-500 animate-spin" />
              <div>
                <p className="font-medium">Processing Image</p>
                <p className="text-sm text-gray-500">{processingStep}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Processing Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quality Check Results */}
        {quality && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Quality Check</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  quality.blur.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {quality.blur.passed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Sharpness</p>
                  <p className="text-xs text-gray-500">{Math.round(quality.blur.score * 100)}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  quality.lighting.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {quality.lighting.passed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Lighting</p>
                  <p className="text-xs text-gray-500">{Math.round(quality.lighting.score * 100)}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  quality.calibration.detected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {quality.calibration.detected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Calibration</p>
                  <p className="text-xs text-gray-500">{Math.round(quality.calibration.confidence * 100)}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  quality.perspective.corrected ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {quality.perspective.corrected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Perspective</p>
                  <p className="text-xs text-gray-500">{quality.perspective.distortion}° distortion</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Measurements */}
        {measurement && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Measurements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-astro-50 rounded-lg p-4">
                <p className="text-sm text-astro-600 font-medium">Area</p>
                <p className="text-2xl font-bold text-astro-900">{measurement.area} cm²</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Perimeter</p>
                <p className="text-2xl font-bold text-gray-900">{measurement.perimeter} cm</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Length</p>
                <p className="text-2xl font-bold text-gray-900">{measurement.length} cm</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Width</p>
                <p className="text-2xl font-bold text-gray-900">{measurement.width} cm</p>
              </div>
            </div>

            {/* Manual depth input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depth (manual entry)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={manualDepth}
                  onChange={(e) => setManualDepth(e.target.value)}
                  placeholder="0.0"
                  className="w-24 px-3 py-2 border rounded-lg"
                />
                <span className="text-gray-500">cm</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Clinical Notes</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add clinical observations, tissue type, exudate, etc."
            rows={4}
            className="w-full px-3 py-2 border rounded-lg resize-none"
          />
        </div>

        {/* Save button */}
        {measurement && (
          <button
            onClick={saveAssessment}
            className="w-full py-4 bg-astro-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-astro-600 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Assessment
          </button>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraModule
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};
