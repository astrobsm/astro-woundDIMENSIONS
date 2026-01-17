/**
 * AstroWound-MEASURE Quality Check Engine
 * Image quality validation for clinical accuracy
 */

import type { QualityCheck, CalibrationData } from '@/types';

interface QualityThresholds {
  minBlurScore: number;
  minLightingScore: number;
  minCalibrationConfidence: number;
  maxPerspectiveDistortion: number;
}

const DEFAULT_THRESHOLDS: QualityThresholds = {
  minBlurScore: 0.7,
  minLightingScore: 0.6,
  minCalibrationConfidence: 0.8,
  maxPerspectiveDistortion: 15, // degrees
};

/**
 * Quality Check Engine for image validation
 */
export class QualityCheckEngine {
  private thresholds: QualityThresholds;
  private canvas: HTMLCanvasElement;

  constructor(thresholds: Partial<QualityThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.canvas = document.createElement('canvas');
    // Get context for canvas - used implicitly for getImageData
    this.canvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Run all quality checks on an image
   */
  async runQualityChecks(
    imageData: ImageData,
    calibrationData: CalibrationData
  ): Promise<QualityCheck> {
    const blurResult = await this.checkBlur(imageData);
    const lightingResult = await this.checkLighting(imageData);
    const perspectiveResult = await this.checkPerspective(calibrationData);

    const allPassed = 
      blurResult.passed && 
      lightingResult.passed && 
      calibrationData.detected &&
      calibrationData.confidence >= this.thresholds.minCalibrationConfidence &&
      perspectiveResult.corrected;

    return {
      passed: allPassed,
      blur: blurResult,
      lighting: lightingResult,
      calibration: {
        detected: calibrationData.detected,
        confidence: calibrationData.confidence,
      },
      perspective: perspectiveResult,
    };
  }

  /**
   * Check image blur using Laplacian variance
   */
  private async checkBlur(imageData: ImageData): Promise<{ score: number; passed: boolean }> {
    const { data, width, height } = imageData;
    
    // Convert to grayscale
    const grayscale = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Apply Laplacian kernel
    const laplacian = new Float32Array(width * height);
    const kernel = [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0]
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += grayscale[(y + ky) * width + (x + kx)] * kernel[ky + 1][kx + 1];
          }
        }
        laplacian[y * width + x] = sum;
      }
    }

    // Calculate variance
    let mean = 0;
    let count = 0;
    for (let i = 0; i < laplacian.length; i++) {
      if (laplacian[i] !== 0) {
        mean += laplacian[i];
        count++;
      }
    }
    mean /= count;

    let variance = 0;
    for (let i = 0; i < laplacian.length; i++) {
      if (laplacian[i] !== 0) {
        variance += Math.pow(laplacian[i] - mean, 2);
      }
    }
    variance /= count;

    // Normalize score (higher variance = sharper image)
    // Typical variance ranges from 50 (very blurry) to 5000+ (very sharp)
    const normalizedScore = Math.min(1, variance / 1000);

    return {
      score: Math.round(normalizedScore * 100) / 100,
      passed: normalizedScore >= this.thresholds.minBlurScore,
    };
  }

  /**
   * Check lighting conditions
   */
  private async checkLighting(imageData: ImageData): Promise<{
    score: number;
    passed: boolean;
    issues: string[];
  }> {
    const { data, width, height } = imageData;
    const issues: string[] = [];

    // Analyze brightness distribution
    let totalBrightness = 0;
    let minBrightness = 255;
    let maxBrightness = 0;
    const brightnessHistogram = new Int32Array(256);

    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      totalBrightness += brightness;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
      brightnessHistogram[brightness]++;
    }

    const avgBrightness = totalBrightness / (width * height);
    const dynamicRange = maxBrightness - minBrightness;

    // Check for underexposure
    if (avgBrightness < 50) {
      issues.push('Image is too dark');
    }

    // Check for overexposure
    if (avgBrightness > 200) {
      issues.push('Image is too bright');
    }

    // Check for low contrast
    if (dynamicRange < 100) {
      issues.push('Low contrast - poor lighting');
    }

    // Check for shadows (significant dark regions)
    const darkPixels = brightnessHistogram.slice(0, 50).reduce((a, b) => a + b, 0);
    const darkPercentage = darkPixels / (width * height);
    if (darkPercentage > 0.3) {
      issues.push('Significant shadows detected');
    }

    // Check for blown highlights
    const brightPixels = brightnessHistogram.slice(245).reduce((a, b) => a + b, 0);
    const brightPercentage = brightPixels / (width * height);
    if (brightPercentage > 0.1) {
      issues.push('Overexposed regions detected');
    }

    // Calculate overall lighting score
    let score = 1.0;
    
    // Penalize for deviation from ideal brightness (128)
    score -= Math.abs(avgBrightness - 128) / 256 * 0.3;
    
    // Penalize for low dynamic range
    score -= Math.max(0, (150 - dynamicRange) / 150) * 0.3;
    
    // Penalize for issues
    score -= issues.length * 0.15;
    
    score = Math.max(0, Math.min(1, score));

    return {
      score: Math.round(score * 100) / 100,
      passed: score >= this.thresholds.minLightingScore && issues.length <= 1,
      issues,
    };
  }

  /**
   * Check and correct perspective distortion
   */
  private async checkPerspective(calibrationData: CalibrationData): Promise<{
    distortion: number;
    corrected: boolean;
  }> {
    if (!calibrationData.detected || calibrationData.referencePoints.length < 2) {
      return { distortion: 0, corrected: false };
    }

    // Calculate distortion from reference points
    // For ruler: check if tick marks are evenly spaced
    // For circle: check circularity
    // For grid: check grid regularity

    let distortion = 0;

    if (calibrationData.markerType === 'ruler' && calibrationData.referencePoints.length >= 3) {
      // Calculate variance in tick spacing
      const points = calibrationData.referencePoints;
      const spacings: number[] = [];
      
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        spacings.push(Math.sqrt(dx * dx + dy * dy));
      }

      const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
      const variance = spacings.reduce((sum, s) => sum + Math.pow(s - avgSpacing, 2), 0) / spacings.length;
      const cv = Math.sqrt(variance) / avgSpacing; // Coefficient of variation

      // Convert to distortion angle estimate (rough approximation)
      distortion = cv * 45; // degrees
    }

    const isCorrectable = distortion <= this.thresholds.maxPerspectiveDistortion;

    return {
      distortion: Math.round(distortion * 10) / 10,
      corrected: isCorrectable,
    };
  }

  /**
   * Get quality check summary
   */
  getSummary(check: QualityCheck): string {
    const lines: string[] = [];

    if (check.passed) {
      lines.push('✅ Image quality: PASSED');
    } else {
      lines.push('❌ Image quality: FAILED');
    }

    lines.push(`   Sharpness: ${check.blur.passed ? '✓' : '✗'} (${Math.round(check.blur.score * 100)}%)`);
    lines.push(`   Lighting: ${check.lighting.passed ? '✓' : '✗'} (${Math.round(check.lighting.score * 100)}%)`);
    lines.push(`   Calibration: ${check.calibration.detected ? '✓' : '✗'} (${Math.round(check.calibration.confidence * 100)}%)`);
    lines.push(`   Perspective: ${check.perspective.corrected ? '✓' : '✗'} (${check.perspective.distortion}° distortion)`);

    if (check.lighting.issues.length > 0) {
      lines.push('   Lighting issues:');
      check.lighting.issues.forEach(issue => lines.push(`     - ${issue}`));
    }

    return lines.join('\n');
  }

  /**
   * Get recommendations for improving quality
   */
  getRecommendations(check: QualityCheck): string[] {
    const recommendations: string[] = [];

    if (!check.blur.passed) {
      recommendations.push('Hold the camera steady or use a tripod');
      recommendations.push('Ensure adequate lighting for faster shutter speed');
      recommendations.push('Clean the camera lens');
    }

    if (!check.lighting.passed) {
      if (check.lighting.issues.includes('Image is too dark')) {
        recommendations.push('Increase ambient lighting');
        recommendations.push('Use the camera flash if available');
      }
      if (check.lighting.issues.includes('Image is too bright')) {
        recommendations.push('Reduce direct lighting on the wound');
        recommendations.push('Avoid harsh overhead lights');
      }
      if (check.lighting.issues.includes('Significant shadows detected')) {
        recommendations.push('Use diffused lighting');
        recommendations.push('Adjust camera angle to reduce shadows');
      }
    }

    if (!check.calibration.detected) {
      recommendations.push('Ensure the calibration ruler is visible in the frame');
      recommendations.push('Place the ruler on the same plane as the wound');
      recommendations.push('Avoid covering the ruler markings');
    }

    if (!check.perspective.corrected) {
      recommendations.push('Position the camera perpendicular to the wound surface');
      recommendations.push('Maintain consistent distance from the wound');
    }

    return recommendations;
  }

  /**
   * Update quality thresholds
   */
  setThresholds(thresholds: Partial<QualityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

// Singleton instance
let qualityCheckEngineInstance: QualityCheckEngine | null = null;

export function getQualityCheckEngine(): QualityCheckEngine {
  if (!qualityCheckEngineInstance) {
    qualityCheckEngineInstance = new QualityCheckEngine();
  }
  return qualityCheckEngineInstance;
}
