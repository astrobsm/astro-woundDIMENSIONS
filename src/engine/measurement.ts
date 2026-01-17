/**
 * AstroWound-MEASURE Measurement Engine
 * Wound geometry calculations and analysis
 */

import type { 
  WoundMeasurement, 
  CalibrationData, 
  SegmentationResult,
  Point,
  HealingProgress,
  WoundAssessment,
  WoundAnalytics
} from '@/types';

/**
 * Measurement Engine for wound geometry calculations
 */
export class MeasurementEngine {
  
  /**
   * Calculate all wound measurements from segmentation
   */
  calculateMeasurements(
    segmentation: SegmentationResult,
    calibration: CalibrationData
  ): WoundMeasurement {
    if (!calibration.detected || calibration.pixelsPerCm <= 0) {
      throw new Error('Valid calibration required for measurement');
    }

    const { mask, contour } = segmentation;
    const pixelsPerCm = calibration.pixelsPerCm;
    const pixelsPerCmSquared = pixelsPerCm * pixelsPerCm;

    // Calculate area
    const areaPixels = this.calculateAreaFromMask(mask);
    const area = areaPixels / pixelsPerCmSquared;

    // Calculate perimeter
    const perimeterPixels = this.calculatePerimeter(contour);
    const perimeter = perimeterPixels / pixelsPerCm;

    // Calculate length and width using minimum bounding rectangle
    const { length: lengthPixels, width: widthPixels } = this.calculateLengthWidth(contour);
    const length = lengthPixels / pixelsPerCm;
    const width = widthPixels / pixelsPerCm;

    return {
      area: this.round(area, 2),
      length: this.round(length, 2),
      width: this.round(width, 2),
      perimeter: this.round(perimeter, 2),
    };
  }

  /**
   * Calculate area from binary mask
   */
  private calculateAreaFromMask(mask: ImageData): number {
    const { data, width, height } = mask;
    let count = 0;

    for (let i = 0; i < width * height; i++) {
      // Check red channel (grayscale mask has same value in R, G, B)
      if (data[i * 4] > 127) {
        count++;
      }
    }

    return count;
  }

  /**
   * Calculate perimeter from contour points
   */
  private calculatePerimeter(contour: Point[]): number {
    if (contour.length < 3) return 0;

    let perimeter = 0;
    for (let i = 0; i < contour.length; i++) {
      const current = contour[i];
      const next = contour[(i + 1) % contour.length];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    return perimeter;
  }

  /**
   * Calculate length and width using rotating calipers (minimum bounding rectangle)
   */
  private calculateLengthWidth(contour: Point[]): { length: number; width: number } {
    if (contour.length < 3) {
      return { length: 0, width: 0 };
    }

    // Compute convex hull
    const hull = this.convexHull(contour);

    // Use rotating calipers to find minimum area bounding rectangle
    const minRect = this.minAreaRect(hull);

    return {
      length: Math.max(minRect.width, minRect.height),
      width: Math.min(minRect.width, minRect.height),
    };
  }

  /**
   * Compute convex hull using Graham scan
   */
  private convexHull(points: Point[]): Point[] {
    if (points.length < 3) return [...points];

    // Find lowest point
    let lowest = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[lowest].y ||
          (points[i].y === points[lowest].y && points[i].x < points[lowest].x)) {
        lowest = i;
      }
    }

    // Swap lowest to first position
    const sorted = [...points];
    [sorted[0], sorted[lowest]] = [sorted[lowest], sorted[0]];
    const anchor = sorted[0];

    // Sort by polar angle
    sorted.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.y - anchor.y, a.x - anchor.x);
      const angleB = Math.atan2(b.y - anchor.y, b.x - anchor.x);
      return angleA - angleB;
    });

    // Graham scan
    const hull: Point[] = [sorted[0], sorted[1]];

    for (let i = 2; i < sorted.length; i++) {
      while (hull.length > 1 && this.crossProduct(
        hull[hull.length - 2],
        hull[hull.length - 1],
        sorted[i]
      ) <= 0) {
        hull.pop();
      }
      hull.push(sorted[i]);
    }

    return hull;
  }

  /**
   * Cross product of vectors (p1->p2) and (p1->p3)
   */
  private crossProduct(p1: Point, p2: Point, p3: Point): number {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  }

  /**
   * Find minimum area bounding rectangle using rotating calipers
   */
  private minAreaRect(hull: Point[]): { width: number; height: number; angle: number } {
    if (hull.length < 3) {
      return { width: 0, height: 0, angle: 0 };
    }

    let minArea = Infinity;
    let bestRect = { width: 0, height: 0, angle: 0 };

    // Try each edge as the base of the rectangle
    for (let i = 0; i < hull.length; i++) {
      const p1 = hull[i];
      const p2 = hull[(i + 1) % hull.length];

      // Angle of this edge
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // Rotate all points
      const rotated = hull.map(p => this.rotatePoint(p, -angle, hull[0]));

      // Find bounding box of rotated points
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      for (const p of rotated) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }

      const width = maxX - minX;
      const height = maxY - minY;
      const area = width * height;

      if (area < minArea) {
        minArea = area;
        bestRect = { width, height, angle };
      }
    }

    return bestRect;
  }

  /**
   * Rotate point around center
   */
  private rotatePoint(point: Point, angle: number, center: Point): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  /**
   * Calculate volume if depth is provided
   */
  calculateVolume(area: number, depth: number): number {
    // Using simplified ellipsoid formula
    // V ≈ (π/6) × L × W × D, but we use area directly
    // V ≈ 0.327 × Area × Depth (empirical formula for wounds)
    return this.round(0.327 * area * depth, 2);
  }

  /**
   * Calculate healing progress from assessments
   */
  calculateHealingProgress(
    assessments: WoundAssessment[]
  ): HealingProgress[] {
    if (assessments.length === 0) return [];

    // Sort by date
    const sorted = [...assessments].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    );

    const progress: HealingProgress[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const previous = i > 0 ? sorted[i - 1] : null;

      const currentArea = current.measurement.area;
      const previousArea = previous?.measurement.area ?? currentArea;

      const areaChange = currentArea - previousArea;
      const areaChangePercent = previousArea > 0 
        ? (areaChange / previousArea) * 100 
        : 0;

      // Calculate healing rate (cm²/day)
      let healingRate = 0;
      if (previous) {
        const daysDiff = this.daysBetween(
          new Date(previous.capturedAt),
          new Date(current.capturedAt)
        );
        if (daysDiff > 0) {
          healingRate = -areaChange / daysDiff; // Negative change = healing
        }
      }

      // Project healing date
      let projectedHealingDate: Date | undefined;
      if (healingRate > 0 && currentArea > 0) {
        const daysToHeal = currentArea / healingRate;
        projectedHealingDate = new Date(current.capturedAt);
        projectedHealingDate.setDate(projectedHealingDate.getDate() + Math.ceil(daysToHeal));
      }

      progress.push({
        assessmentId: current.id,
        date: new Date(current.capturedAt),
        area: currentArea,
        areaChange: this.round(areaChange, 2),
        areaChangePercent: this.round(areaChangePercent, 1),
        healingRate: this.round(healingRate, 3),
        projectedHealingDate,
      });
    }

    return progress;
  }

  /**
   * Calculate comprehensive wound analytics
   */
  calculateWoundAnalytics(
    woundId: string,
    assessments: WoundAssessment[],
    onset: Date
  ): WoundAnalytics {
    const progress = this.calculateHealingProgress(assessments);

    if (progress.length === 0) {
      return {
        woundId,
        initialArea: 0,
        currentArea: 0,
        totalReduction: 0,
        totalReductionPercent: 0,
        averageHealingRate: 0,
        healingVelocity: 0,
        assessmentCount: 0,
        daysSinceOnset: 0,
        progressHistory: [],
        trend: 'stable',
      };
    }

    const initialArea = progress[0].area;
    const currentArea = progress[progress.length - 1].area;
    const totalReduction = initialArea - currentArea;
    const totalReductionPercent = initialArea > 0 
      ? (totalReduction / initialArea) * 100 
      : 0;

    // Average healing rate
    const healingRates = progress.filter(p => p.healingRate > 0).map(p => p.healingRate);
    const averageHealingRate = healingRates.length > 0
      ? healingRates.reduce((a, b) => a + b, 0) / healingRates.length
      : 0;

    // Healing velocity (cm²/week)
    const healingVelocity = averageHealingRate * 7;

    // Days since onset
    const daysSinceOnset = this.daysBetween(onset, new Date());

    // Determine trend
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (progress.length >= 2) {
      const recentProgress = progress.slice(-3);
      const avgChange = recentProgress.reduce((sum, p) => sum + p.areaChangePercent, 0) / recentProgress.length;
      
      if (avgChange < -5) trend = 'improving';
      else if (avgChange > 5) trend = 'worsening';
    }

    return {
      woundId,
      initialArea: this.round(initialArea, 2),
      currentArea: this.round(currentArea, 2),
      totalReduction: this.round(totalReduction, 2),
      totalReductionPercent: this.round(totalReductionPercent, 1),
      averageHealingRate: this.round(averageHealingRate, 3),
      healingVelocity: this.round(healingVelocity, 2),
      assessmentCount: assessments.length,
      daysSinceOnset,
      progressHistory: progress,
      trend,
    };
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / msPerDay);
  }

  /**
   * Round number to specified decimal places
   */
  private round(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Validate measurement against clinical thresholds
   */
  validateMeasurement(measurement: WoundMeasurement): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for unrealistic measurements
    if (measurement.area > 1000) {
      warnings.push('Area exceeds 1000 cm² - verify calibration');
    }

    if (measurement.length > 50 || measurement.width > 50) {
      warnings.push('Dimensions exceed 50 cm - verify calibration');
    }

    // Check aspect ratio
    const aspectRatio = measurement.length / measurement.width;
    if (aspectRatio > 10) {
      warnings.push('Unusual aspect ratio detected - verify segmentation');
    }

    // Sanity check: area should be approximately length × width × π/4 for elliptical shapes
    const expectedArea = (Math.PI / 4) * measurement.length * measurement.width;
    const areaRatio = measurement.area / expectedArea;
    if (areaRatio < 0.3 || areaRatio > 1.5) {
      warnings.push('Area inconsistent with dimensions - verify segmentation');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Generate measurement summary text
   */
  generateSummary(measurement: WoundMeasurement): string {
    const lines = [
      `Area: ${measurement.area} cm²`,
      `Length: ${measurement.length} cm`,
      `Width: ${measurement.width} cm`,
      `Perimeter: ${measurement.perimeter} cm`,
    ];

    if (measurement.depth !== undefined) {
      lines.push(`Depth: ${measurement.depth} cm`);
    }

    if (measurement.volume !== undefined) {
      lines.push(`Volume: ${measurement.volume} cm³`);
    }

    return lines.join('\n');
  }
}

// Singleton instance
let measurementEngineInstance: MeasurementEngine | null = null;

export function getMeasurementEngine(): MeasurementEngine {
  if (!measurementEngineInstance) {
    measurementEngineInstance = new MeasurementEngine();
  }
  return measurementEngineInstance;
}
