/**
 * AstroWound-MEASURE Type Definitions
 * Clinical Wound Assessment System
 */

// ============================================
// Patient Types
// ============================================

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Wound Types
// ============================================

export type WoundType = 
  | 'pressure_ulcer'
  | 'diabetic_ulcer'
  | 'venous_ulcer'
  | 'arterial_ulcer'
  | 'surgical_wound'
  | 'traumatic_wound'
  | 'burn'
  | 'other';

export type WoundLocation =
  | 'sacrum'
  | 'heel'
  | 'ankle'
  | 'leg'
  | 'foot'
  | 'arm'
  | 'hand'
  | 'back'
  | 'abdomen'
  | 'chest'
  | 'head'
  | 'other';

export type TissueType = 
  | 'epithelial'
  | 'granulation'
  | 'slough'
  | 'necrotic'
  | 'eschar';

export interface Wound {
  id: string;
  patientId: string;
  type: WoundType;
  location: WoundLocation;
  locationDetail?: string;
  onset: Date;
  etiology?: string;
  notes?: string;
  status: 'active' | 'healing' | 'healed' | 'worsening';
  assessments: WoundAssessment[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Measurement Types
// ============================================

export interface WoundMeasurement {
  area: number;           // cm²
  length: number;         // cm (longest axis)
  width: number;          // cm (perpendicular to length)
  perimeter: number;      // cm
  depth?: number;         // cm (manual entry)
  volume?: number;        // cm³ (calculated if depth provided)
}

export interface CalibrationData {
  detected: boolean;
  pixelsPerCm: number;
  confidence: number;
  markerType: 'ruler' | 'circle' | 'qr' | 'grid';
  referencePoints: Point[];
  homographyMatrix?: number[][];
}

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SegmentationResult {
  mask: ImageData;
  contour: Point[];
  contourPoints?: Point[]; // Alias for contour
  boundingBox: BoundingBox;
  confidence: number;
  area?: number;
  tissueBreakdown?: TissueAnalysis;
}

export interface TissueAnalysis {
  epithelial: number;     // percentage
  granulation: number;    // percentage
  slough: number;         // percentage
  necrotic: number;       // percentage
}

// ============================================
// Assessment Types
// ============================================

export interface QualityCheck {
  passed: boolean;
  blur: {
    score: number;
    passed: boolean;
  };
  lighting: {
    score: number;
    passed: boolean;
    issues: string[];
  };
  calibration: {
    detected: boolean;
    confidence: number;
  };
  perspective: {
    distortion: number;
    corrected: boolean;
  };
}

export interface WoundAssessment {
  id: string;
  woundId: string;
  capturedAt: Date;
  capturedBy: string;
  deviceInfo: DeviceInfo;
  
  // Original image
  originalImage: string;   // base64 or blob URL
  
  // Processed data
  processedImage?: string;
  segmentationResult: SegmentationResult;
  calibrationData: CalibrationData;
  measurement: WoundMeasurement;
  qualityCheck: QualityCheck;
  
  // Clinical observations
  tissueTypes?: Record<TissueType, number>;
  exudate?: {
    amount: 'none' | 'light' | 'moderate' | 'heavy';
    type: 'serous' | 'sanguineous' | 'serosanguineous' | 'purulent';
  };
  odor?: 'none' | 'mild' | 'moderate' | 'strong';
  periWoundCondition?: string[];
  pain?: number; // 0-10 scale
  
  // Clinical notes
  notes?: string;
  clinicianVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  cameraResolution?: {
    width: number;
    height: number;
  };
}

// ============================================
// Analytics Types
// ============================================

export interface HealingProgress {
  assessmentId: string;
  date: Date;
  area: number;
  areaChange: number;       // absolute change from previous
  areaChangePercent: number; // percentage change from previous
  healingRate: number;      // cm²/day
  projectedHealingDate?: Date;
}

export interface WoundAnalytics {
  woundId: string;
  initialArea: number;
  currentArea: number;
  totalReduction: number;
  totalReductionPercent: number;
  averageHealingRate: number;
  healingVelocity: number;  // cm²/week
  assessmentCount: number;
  daysSinceOnset: number;
  progressHistory: HealingProgress[];
  trend: 'improving' | 'stable' | 'worsening';
}

// ============================================
// Report Types
// ============================================

export interface ClinicalReport {
  id: string;
  patientId: string;
  woundId: string;
  generatedAt: Date;
  generatedBy: string;
  reportType: 'single_assessment' | 'progress_report' | 'discharge_summary';
  dateRange?: {
    start: Date;
    end: Date;
  };
  assessments: WoundAssessment[];
  analytics?: WoundAnalytics;
  recommendations?: string[];
  signature?: {
    name: string;
    credentials: string;
    signedAt: Date;
  };
}

// ============================================
// Model Types
// ============================================

export interface ModelConfig {
  name: string;
  version: string;
  inputSize: [number, number];
  outputChannels: number;
  backend: 'webgl' | 'wasm' | 'cpu';
  quantized: boolean;
}

export interface InferenceResult {
  segmentation: SegmentationResult;
  inferenceTime: number;
  modelVersion?: string;
  modelConfig?: ModelConfig;
}

// ============================================
// App State Types
// ============================================

export interface AppState {
  currentPatient: Patient | null;
  currentWound: Wound | null;
  isModelLoaded: boolean;
  isOnline: boolean;
  pendingSync: number;
}

export interface CaptureState {
  isCapturing: boolean;
  calibrationDetected: boolean;
  qualityPassed: boolean;
  previewImage: string | null;
  segmentationPreview: SegmentationResult | null;
}

// ============================================
// Database Types
// ============================================

export interface DBSchema {
  patients: Patient;
  wounds: Wound;
  assessments: WoundAssessment;
  reports: ClinicalReport;
  settings: AppSettings;
  syncQueue: SyncQueueItem;
}

export interface AppSettings {
  id: string;
  clinicName: string;
  clinicLogo?: string;
  defaultCalibrationMethod: CalibrationData['markerType'];
  autoSaveEnabled: boolean;
  qualityThresholds: {
    minBlurScore: number;
    minLightingScore: number;
    minCalibrationConfidence: number;
    maxPerspectiveDistortion: number;
  };
  measurementPrecision: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: keyof DBSchema;
  recordId: string;
  data: unknown;
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}
