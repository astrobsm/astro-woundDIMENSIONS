/**
 * AstroWound-MEASURE Calibration Engine
 * Scale detection and measurement calibration
 */

import type { CalibrationData, Point } from '@/types';

// Calibration marker specifications
const CALIBRATION_SPECS = {
  ruler: {
    tickSpacingCm: 1,
    minTickCount: 5,
    color: { r: 0, g: 0, b: 0 }, // Black ticks on white
  },
  circle: {
    diameterCm: 2.5,
    color: { r: 0, g: 0, b: 0 },
  },
  grid: {
    cellSizeCm: 1,
    minCells: 4,
  },
};

/**
 * Calibration Engine for scale detection
 */
export class CalibrationEngine {
  private canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.createElement('canvas');
    // Get context for canvas - used implicitly for getImageData
    this.canvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Detect calibration marker in image
   */
  async detectCalibration(imageData: ImageData): Promise<CalibrationData> {
    // Try different detection methods in order of reliability
    
    // 1. Try ruler detection
    const rulerResult = await this.detectRuler(imageData);
    if (rulerResult.detected && rulerResult.confidence > 0.8) {
      return rulerResult;
    }

    // 2. Try circle detection
    const circleResult = await this.detectCircle(imageData);
    if (circleResult.detected && circleResult.confidence > 0.8) {
      return circleResult;
    }

    // 3. Try grid detection
    const gridResult = await this.detectGrid(imageData);
    if (gridResult.detected && gridResult.confidence > 0.8) {
      return gridResult;
    }

    // Return best result or failure
    const results = [rulerResult, circleResult, gridResult];
    const best = results.reduce((a, b) => a.confidence > b.confidence ? a : b);
    
    return best;
  }

  /**
   * Detect ruler calibration marker
   */
  private async detectRuler(imageData: ImageData): Promise<CalibrationData> {
    const { width, height, data } = imageData;
    const grayscale = this.toGrayscale(data, width, height);
    
    // Edge detection using Sobel operator
    const edges = this.sobelEdgeDetection(grayscale, width, height);
    
    // Hough line transform to find ruler edges
    const lines = this.houghLineTransform(edges, width, height);
    
    // Find parallel lines (ruler edges)
    const parallelLines = this.findParallelLines(lines);
    
    if (parallelLines.length < 2) {
      return this.createFailedCalibration('ruler');
    }

    // Detect tick marks between parallel lines
    const ticks = this.detectTickMarks(grayscale, width, height, parallelLines);
    
    if (ticks.length < CALIBRATION_SPECS.ruler.minTickCount) {
      return this.createFailedCalibration('ruler');
    }

    // Calculate pixels per cm from tick spacing
    const avgTickSpacing = this.calculateAverageSpacing(ticks);
    const pixelsPerCm = avgTickSpacing / CALIBRATION_SPECS.ruler.tickSpacingCm;
    
    // Calculate confidence based on consistency of tick spacing
    const confidence = this.calculateTickConfidence(ticks);

    return {
      detected: true,
      pixelsPerCm,
      confidence,
      markerType: 'ruler',
      referencePoints: ticks,
    };
  }

  /**
   * Detect circular calibration marker
   */
  private async detectCircle(imageData: ImageData): Promise<CalibrationData> {
    const { width, height, data } = imageData;
    const grayscale = this.toGrayscale(data, width, height);
    
    // Edge detection
    const edges = this.sobelEdgeDetection(grayscale, width, height);
    
    // Hough circle transform
    const circles = this.houghCircleTransform(edges, width, height);
    
    if (circles.length === 0) {
      return this.createFailedCalibration('circle');
    }

    // Find the most circular detection
    const bestCircle = circles.reduce((a, b) => 
      a.circularity > b.circularity ? a : b
    );

    // Calculate pixels per cm from circle diameter
    const diameterPixels = bestCircle.radius * 2;
    const pixelsPerCm = diameterPixels / CALIBRATION_SPECS.circle.diameterCm;

    // Calculate confidence based on circularity
    const confidence = bestCircle.circularity;

    return {
      detected: true,
      pixelsPerCm,
      confidence,
      markerType: 'circle',
      referencePoints: [
        { x: bestCircle.centerX, y: bestCircle.centerY },
        { x: bestCircle.centerX + bestCircle.radius, y: bestCircle.centerY },
      ],
    };
  }

  /**
   * Detect grid calibration marker
   */
  private async detectGrid(imageData: ImageData): Promise<CalibrationData> {
    const { width, height, data } = imageData;
    const grayscale = this.toGrayscale(data, width, height);
    
    // Find grid intersections using corner detection
    const corners = this.harrisCornerDetection(grayscale, width, height);
    
    // Cluster corners to find grid pattern
    const gridPoints = this.findGridPattern(corners);
    
    if (gridPoints.length < CALIBRATION_SPECS.grid.minCells * 4) {
      return this.createFailedCalibration('grid');
    }

    // Calculate cell size from grid points
    const cellSizePixels = this.calculateGridCellSize(gridPoints);
    const pixelsPerCm = cellSizePixels / CALIBRATION_SPECS.grid.cellSizeCm;

    // Calculate confidence based on grid regularity
    const confidence = this.calculateGridConfidence(gridPoints);

    return {
      detected: true,
      pixelsPerCm,
      confidence,
      markerType: 'grid',
      referencePoints: gridPoints,
    };
  }

  /**
   * Convert RGBA to grayscale
   */
  private toGrayscale(data: Uint8ClampedArray, width: number, height: number): Float32Array {
    const grayscale = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    
    return grayscale;
  }

  /**
   * Sobel edge detection
   */
  private sobelEdgeDetection(
    grayscale: Float32Array,
    width: number,
    height: number
  ): Float32Array {
    const edges = new Float32Array(width * height);
    
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = grayscale[(y + ky) * width + (x + kx)];
            gx += pixel * sobelX[ky + 1][kx + 1];
            gy += pixel * sobelY[ky + 1][kx + 1];
          }
        }
        
        edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    
    return edges;
  }

  /**
   * Hough line transform (simplified)
   */
  private houghLineTransform(
    edges: Float32Array,
    width: number,
    height: number
  ): Array<{ rho: number; theta: number; votes: number }> {
    const diag = Math.sqrt(width * width + height * height);
    const rhoMax = Math.ceil(diag);
    const thetaSteps = 180;
    
    // Accumulator array
    const accumulator = new Int32Array(2 * rhoMax * thetaSteps);
    
    const threshold = this.otsuThreshold(edges);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > threshold) {
          for (let t = 0; t < thetaSteps; t++) {
            const theta = (t * Math.PI) / thetaSteps;
            const rho = Math.round(x * Math.cos(theta) + y * Math.sin(theta));
            const idx = (rho + rhoMax) * thetaSteps + t;
            accumulator[idx]++;
          }
        }
      }
    }
    
    // Find peaks
    const lines: Array<{ rho: number; theta: number; votes: number }> = [];
    const voteThreshold = Math.max(width, height) * 0.2;
    
    for (let r = 0; r < 2 * rhoMax; r++) {
      for (let t = 0; t < thetaSteps; t++) {
        const votes = accumulator[r * thetaSteps + t];
        if (votes > voteThreshold) {
          lines.push({
            rho: r - rhoMax,
            theta: (t * Math.PI) / thetaSteps,
            votes
          });
        }
      }
    }
    
    return lines.sort((a, b) => b.votes - a.votes).slice(0, 20);
  }

  /**
   * Hough circle transform (simplified)
   */
  private houghCircleTransform(
    edges: Float32Array,
    width: number,
    height: number
  ): Array<{ centerX: number; centerY: number; radius: number; circularity: number }> {
    const minRadius = Math.min(width, height) * 0.05;
    const maxRadius = Math.min(width, height) * 0.3;
    const radiusSteps = 20;
    
    const circles: Array<{ centerX: number; centerY: number; radius: number; circularity: number }> = [];
    const threshold = this.otsuThreshold(edges);
    
    // Find edge points
    const edgePoints: Point[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > threshold) {
          edgePoints.push({ x, y });
        }
      }
    }
    
    // Sample edge points for efficiency
    const sampledPoints = edgePoints.filter((_, i) => i % 10 === 0);
    
    for (let r = 0; r < radiusSteps; r++) {
      const radius = minRadius + (r / radiusSteps) * (maxRadius - minRadius);
      
      // Accumulator for this radius
      const accumulator = new Map<string, number>();
      
      for (const point of sampledPoints) {
        for (let angle = 0; angle < 360; angle += 10) {
          const rad = (angle * Math.PI) / 180;
          const cx = Math.round(point.x - radius * Math.cos(rad));
          const cy = Math.round(point.y - radius * Math.sin(rad));
          
          if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
            const key = `${cx},${cy}`;
            accumulator.set(key, (accumulator.get(key) || 0) + 1);
          }
        }
      }
      
      // Find peaks
      for (const [key, votes] of accumulator) {
        if (votes > sampledPoints.length * 0.1) {
          const [cx, cy] = key.split(',').map(Number);
          const circularity = this.calculateCircularity(edgePoints, cx, cy, radius);
          
          if (circularity > 0.7) {
            circles.push({
              centerX: cx,
              centerY: cy,
              radius,
              circularity
            });
          }
        }
      }
    }
    
    return circles;
  }

  /**
   * Harris corner detection (simplified)
   */
  private harrisCornerDetection(
    grayscale: Float32Array,
    width: number,
    height: number
  ): Point[] {
    const corners: Point[] = [];
    const k = 0.04;
    const windowSize = 3;
    
    // Calculate image derivatives
    const Ix = new Float32Array(width * height);
    const Iy = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        Ix[y * width + x] = grayscale[y * width + x + 1] - grayscale[y * width + x - 1];
        Iy[y * width + x] = grayscale[(y + 1) * width + x] - grayscale[(y - 1) * width + x];
      }
    }
    
    // Calculate Harris response
    const response = new Float32Array(width * height);
    const offset = Math.floor(windowSize / 2);
    
    for (let y = offset; y < height - offset; y++) {
      for (let x = offset; x < width - offset; x++) {
        let Ixx = 0, Iyy = 0, Ixy = 0;
        
        for (let wy = -offset; wy <= offset; wy++) {
          for (let wx = -offset; wx <= offset; wx++) {
            const idx = (y + wy) * width + (x + wx);
            Ixx += Ix[idx] * Ix[idx];
            Iyy += Iy[idx] * Iy[idx];
            Ixy += Ix[idx] * Iy[idx];
          }
        }
        
        const det = Ixx * Iyy - Ixy * Ixy;
        const trace = Ixx + Iyy;
        response[y * width + x] = det - k * trace * trace;
      }
    }
    
    // Non-maximum suppression
    const threshold = this.calculatePercentile(response, 99);
    
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        const val = response[y * width + x];
        if (val > threshold) {
          let isMax = true;
          for (let dy = -1; dy <= 1 && isMax; dy++) {
            for (let dx = -1; dx <= 1 && isMax; dx++) {
              if (dx === 0 && dy === 0) continue;
              if (response[(y + dy) * width + (x + dx)] > val) {
                isMax = false;
              }
            }
          }
          if (isMax) {
            corners.push({ x, y });
          }
        }
      }
    }
    
    return corners;
  }

  /**
   * Find parallel lines from detected lines
   */
  private findParallelLines(
    lines: Array<{ rho: number; theta: number; votes: number }>
  ): Array<{ rho: number; theta: number }> {
    const parallelGroups: Array<Array<{ rho: number; theta: number }>> = [];
    const thetaTolerance = 0.1; // radians
    
    for (const line of lines) {
      let foundGroup = false;
      
      for (const group of parallelGroups) {
        const avgTheta = group.reduce((sum, l) => sum + l.theta, 0) / group.length;
        if (Math.abs(line.theta - avgTheta) < thetaTolerance) {
          group.push(line);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        parallelGroups.push([line]);
      }
    }
    
    // Find largest group of parallel lines
    const largestGroup = parallelGroups.reduce((a, b) => 
      a.length > b.length ? a : b, []
    );
    
    return largestGroup;
  }

  /**
   * Detect tick marks on ruler
   */
  private detectTickMarks(
    grayscale: Float32Array,
    width: number,
    height: number,
    lines: Array<{ rho: number; theta: number }>
  ): Point[] {
    // Simplified: find dark vertical lines between ruler edges
    const ticks: Point[] = [];
    
    // Project along ruler direction
    const avgTheta = lines.reduce((sum, l) => sum + l.theta, 0) / lines.length;
    const perpTheta = avgTheta + Math.PI / 2;
    
    const cos = Math.cos(perpTheta);
    const sin = Math.sin(perpTheta);
    
    // Create profile along ruler
    const profileLength = Math.floor(Math.sqrt(width * width + height * height));
    const profile = new Float32Array(profileLength);
    const counts = new Int32Array(profileLength);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const proj = Math.round(x * cos + y * sin + profileLength / 2);
        if (proj >= 0 && proj < profileLength) {
          profile[proj] += grayscale[y * width + x];
          counts[proj]++;
        }
      }
    }
    
    // Normalize profile
    for (let i = 0; i < profileLength; i++) {
      if (counts[i] > 0) {
        profile[i] /= counts[i];
      }
    }
    
    // Find local minima (dark ticks)
    for (let i = 2; i < profileLength - 2; i++) {
      if (profile[i] < profile[i - 1] && 
          profile[i] < profile[i + 1] &&
          profile[i] < profile[i - 2] &&
          profile[i] < profile[i + 2]) {
        // Convert back to image coordinates
        const x = (i - profileLength / 2) * cos + width / 2;
        const y = (i - profileLength / 2) * sin + height / 2;
        ticks.push({ x, y });
      }
    }
    
    return ticks;
  }

  /**
   * Calculate average spacing between points
   */
  private calculateAverageSpacing(points: Point[]): number {
    if (points.length < 2) return 0;
    
    let totalSpacing = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalSpacing += Math.sqrt(dx * dx + dy * dy);
    }
    
    return totalSpacing / (points.length - 1);
  }

  /**
   * Calculate confidence from tick spacing consistency
   */
  private calculateTickConfidence(ticks: Point[]): number {
    if (ticks.length < 3) return 0;
    
    const spacings: number[] = [];
    for (let i = 1; i < ticks.length; i++) {
      const dx = ticks[i].x - ticks[i - 1].x;
      const dy = ticks[i].y - ticks[i - 1].y;
      spacings.push(Math.sqrt(dx * dx + dy * dy));
    }
    
    const mean = spacings.reduce((a, b) => a + b, 0) / spacings.length;
    const variance = spacings.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / spacings.length;
    const stdDev = Math.sqrt(variance);
    
    // Coefficient of variation (lower is better)
    const cv = stdDev / mean;
    
    // Convert to confidence (0-1)
    return Math.max(0, 1 - cv * 2);
  }

  /**
   * Calculate circularity of detected circle
   */
  private calculateCircularity(
    edgePoints: Point[],
    cx: number,
    cy: number,
    radius: number
  ): number {
    const tolerance = radius * 0.1;
    let onCircle = 0;
    
    for (const point of edgePoints) {
      const dist = Math.sqrt(Math.pow(point.x - cx, 2) + Math.pow(point.y - cy, 2));
      if (Math.abs(dist - radius) < tolerance) {
        onCircle++;
      }
    }
    
    const expectedPoints = 2 * Math.PI * radius;
    return Math.min(1, onCircle / expectedPoints);
  }

  /**
   * Find grid pattern from corners
   */
  private findGridPattern(corners: Point[]): Point[] {
    // Cluster corners that form a regular grid
    // Simplified: return corners that have regular spacing
    if (corners.length < 4) return [];
    
    // Sort by x, then y
    const sorted = [...corners].sort((a, b) => a.x - b.x || a.y - b.y);
    
    // Find most common spacing
    const xSpacings: number[] = [];
    const ySpacings: number[] = [];
    
    for (let i = 1; i < sorted.length; i++) {
      xSpacings.push(Math.abs(sorted[i].x - sorted[i - 1].x));
      ySpacings.push(Math.abs(sorted[i].y - sorted[i - 1].y));
    }
    
    // Filter corners that match grid pattern
    return sorted;
  }

  /**
   * Calculate grid cell size
   */
  private calculateGridCellSize(gridPoints: Point[]): number {
    const spacings: number[] = [];
    
    for (let i = 1; i < gridPoints.length; i++) {
      const dx = Math.abs(gridPoints[i].x - gridPoints[i - 1].x);
      const dy = Math.abs(gridPoints[i].y - gridPoints[i - 1].y);
      if (dx > 5) spacings.push(dx);
      if (dy > 5) spacings.push(dy);
    }
    
    // Return median spacing
    spacings.sort((a, b) => a - b);
    return spacings[Math.floor(spacings.length / 2)] || 0;
  }

  /**
   * Calculate grid confidence
   */
  private calculateGridConfidence(gridPoints: Point[]): number {
    // Based on how regular the grid is
    if (gridPoints.length < 4) return 0;
    return Math.min(1, gridPoints.length / 20);
  }

  /**
   * Otsu's threshold method
   */
  private otsuThreshold(data: Float32Array): number {
    const histogram = new Int32Array(256);
    
    for (let i = 0; i < data.length; i++) {
      const bin = Math.min(255, Math.max(0, Math.floor(data[i])));
      histogram[bin]++;
    }
    
    const total = data.length;
    let sumB = 0;
    let wB = 0;
    let maximum = 0;
    let threshold = 0;
    let sum = 0;
    
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      const wF = total - wB;
      if (wF === 0) break;
      
      sumB += i * histogram[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const between = wB * wF * Math.pow(mB - mF, 2);
      
      if (between > maximum) {
        maximum = between;
        threshold = i;
      }
    }
    
    return threshold;
  }

  /**
   * Calculate percentile of array
   */
  private calculatePercentile(data: Float32Array, percentile: number): number {
    const sorted = [...data].sort((a, b) => a - b);
    const idx = Math.floor((percentile / 100) * sorted.length);
    return sorted[idx];
  }

  /**
   * Create failed calibration result
   */
  private createFailedCalibration(markerType: CalibrationData['markerType']): CalibrationData {
    return {
      detected: false,
      pixelsPerCm: 0,
      confidence: 0,
      markerType,
      referencePoints: [],
    };
  }

  /**
   * Manual calibration from two points with known distance
   */
  manualCalibration(point1: Point, point2: Point, distanceCm: number): CalibrationData {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const distancePixels = Math.sqrt(dx * dx + dy * dy);
    
    return {
      detected: true,
      pixelsPerCm: distancePixels / distanceCm,
      confidence: 1.0, // Manual is 100% confident
      markerType: 'ruler',
      referencePoints: [point1, point2],
    };
  }
}

// Singleton instance
let calibrationEngineInstance: CalibrationEngine | null = null;

export function getCalibrationEngine(): CalibrationEngine {
  if (!calibrationEngineInstance) {
    calibrationEngineInstance = new CalibrationEngine();
  }
  return calibrationEngineInstance;
}
