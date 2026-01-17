/**
 * AstroWound-MEASURE AI Segmentation Engine
 * Lightweight U-Net with TensorFlow.js for browser-based wound segmentation
 */

import * as tf from '@tensorflow/tfjs';
import type { 
  ModelConfig, 
  InferenceResult,
  Point,
  BoundingBox 
} from '@/types';

// Model configuration - optimized for browser performance
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  name: 'AstroWound-UNet-Lite',
  version: '2.0.0',
  inputSize: [128, 128], // Smaller input for faster processing
  outputChannels: 1,
  backend: 'webgl',
  quantized: false,
};

/**
 * Wound Segmentation Engine using lightweight U-Net architecture
 * Optimized for browser performance with TensorFlow.js
 */
export class WoundSegmentationEngine {
  private model: tf.LayersModel | null = null;
  private config: ModelConfig;
  private isLoading = false;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: Partial<ModelConfig> = {}) {
    this.config = { ...DEFAULT_MODEL_CONFIG, ...config };
  }

  /**
   * Initialize TensorFlow.js and build model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isLoading = true;

    try {
      console.log('[SegmentationEngine] Starting initialization...');
      
      // Set backend with fallbacks
      await this.setupBackend();
      
      console.log(`[SegmentationEngine] Backend: ${tf.getBackend()}`);

      // Build lightweight model
      this.model = await this.buildLightweightUNet();
      
      // Warm up with dummy inference
      await this.warmUp();

      this.isInitialized = true;
      console.log('[SegmentationEngine] Model ready!');
    } catch (error) {
      console.error('[SegmentationEngine] Init failed:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Setup TensorFlow.js backend with fallbacks
   */
  private async setupBackend(): Promise<void> {
    const backends = ['webgl', 'wasm', 'cpu'];
    
    for (const backend of backends) {
      try {
        await tf.setBackend(backend);
        await tf.ready();
        console.log(`[SegmentationEngine] Using ${backend} backend`);
        return;
      } catch (e) {
        console.warn(`[SegmentationEngine] ${backend} backend failed, trying next...`);
      }
    }
    
    throw new Error('No TensorFlow.js backend available');
  }

  /**
   * Build lightweight U-Net model optimized for browser
   * Uses fewer filters and layers for fast inference
   */
  private async buildLightweightUNet(): Promise<tf.LayersModel> {
    const [inputHeight, inputWidth] = this.config.inputSize;
    
    // Allow UI to update
    await new Promise(r => setTimeout(r, 0));

    const input = tf.input({ shape: [inputHeight, inputWidth, 3], name: 'input' });

    // Encoder (downsampling path) - reduced filter counts
    const enc1 = this.convBlock(input, 16, 'enc1');
    const pool1 = tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'pool1' }).apply(enc1) as tf.SymbolicTensor;
    
    await new Promise(r => setTimeout(r, 0));

    const enc2 = this.convBlock(pool1, 32, 'enc2');
    const pool2 = tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'pool2' }).apply(enc2) as tf.SymbolicTensor;

    await new Promise(r => setTimeout(r, 0));

    const enc3 = this.convBlock(pool2, 64, 'enc3');
    const pool3 = tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'pool3' }).apply(enc3) as tf.SymbolicTensor;

    await new Promise(r => setTimeout(r, 0));

    // Bridge
    const bridge = this.convBlock(pool3, 128, 'bridge');

    await new Promise(r => setTimeout(r, 0));

    // Decoder (upsampling path)
    const up3 = tf.layers.upSampling2d({ size: [2, 2], name: 'up3' }).apply(bridge) as tf.SymbolicTensor;
    const concat3 = tf.layers.concatenate({ name: 'concat3' }).apply([up3, enc3]) as tf.SymbolicTensor;
    const dec3 = this.convBlock(concat3, 64, 'dec3');

    await new Promise(r => setTimeout(r, 0));

    const up2 = tf.layers.upSampling2d({ size: [2, 2], name: 'up2' }).apply(dec3) as tf.SymbolicTensor;
    const concat2 = tf.layers.concatenate({ name: 'concat2' }).apply([up2, enc2]) as tf.SymbolicTensor;
    const dec2 = this.convBlock(concat2, 32, 'dec2');

    await new Promise(r => setTimeout(r, 0));

    const up1 = tf.layers.upSampling2d({ size: [2, 2], name: 'up1' }).apply(dec2) as tf.SymbolicTensor;
    const concat1 = tf.layers.concatenate({ name: 'concat1' }).apply([up1, enc1]) as tf.SymbolicTensor;
    const dec1 = this.convBlock(concat1, 16, 'dec1');

    // Output layer
    const output = tf.layers.conv2d({
      filters: 1,
      kernelSize: 1,
      activation: 'sigmoid',
      padding: 'same',
      name: 'output'
    }).apply(dec1) as tf.SymbolicTensor;

    const model = tf.model({ inputs: input, outputs: output, name: 'AstroWound-UNet-Lite' });
    
    console.log('[SegmentationEngine] Model architecture:');
    model.summary();

    return model;
  }

  /**
   * Convolutional block: Conv2D -> BatchNorm -> ReLU -> Conv2D -> BatchNorm -> ReLU
   */
  private convBlock(input: tf.SymbolicTensor, filters: number, name: string): tf.SymbolicTensor {
    let x = tf.layers.conv2d({
      filters,
      kernelSize: 3,
      padding: 'same',
      kernelInitializer: 'heNormal',
      name: `${name}_conv1`
    }).apply(input) as tf.SymbolicTensor;

    x = tf.layers.batchNormalization({ name: `${name}_bn1` }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.activation({ activation: 'relu', name: `${name}_relu1` }).apply(x) as tf.SymbolicTensor;

    x = tf.layers.conv2d({
      filters,
      kernelSize: 3,
      padding: 'same',
      kernelInitializer: 'heNormal',
      name: `${name}_conv2`
    }).apply(x) as tf.SymbolicTensor;

    x = tf.layers.batchNormalization({ name: `${name}_bn2` }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.activation({ activation: 'relu', name: `${name}_relu2` }).apply(x) as tf.SymbolicTensor;

    return x;
  }

  /**
   * Warm up model with dummy inference
   */
  private async warmUp(): Promise<void> {
    if (!this.model) return;

    const [h, w] = this.config.inputSize;
    const dummyInput = tf.zeros([1, h, w, 3]);
    
    try {
      const output = this.model.predict(dummyInput) as tf.Tensor;
      output.dispose();
    } finally {
      dummyInput.dispose();
    }
    
    console.log('[SegmentationEngine] Warm-up complete');
  }

  /**
   * Segment wound in image
   */
  async segment(imageData: ImageData): Promise<InferenceResult> {
    if (!this.isInitialized || !this.model) {
      await this.initialize();
    }

    const startTime = performance.now();
    const originalSize: [number, number] = [imageData.height, imageData.width];

    // Preprocess
    const inputTensor = this.preprocess(imageData);

    // Run inference
    const outputTensor = this.model!.predict(inputTensor) as tf.Tensor;
    inputTensor.dispose();

    // Postprocess
    const mask = await this.postprocess(outputTensor, originalSize);
    outputTensor.dispose();

    // Extract contour and bounding box
    const contour = this.extractContour(mask);
    const boundingBox = this.calculateBoundingBox(contour);
    const area = this.calculateMaskArea(mask);

    const inferenceTime = performance.now() - startTime;
    console.log(`[SegmentationEngine] Inference: ${inferenceTime.toFixed(0)}ms`);

    return {
      segmentation: {
        mask,
        confidence: this.estimateConfidence(mask),
        boundingBox,
        contour,
        area,
      },
      inferenceTime,
      modelVersion: this.config.version,
    };
  }

  /**
   * Preprocess image for model input
   */
  private preprocess(imageData: ImageData): tf.Tensor4D {
    const [targetH, targetW] = this.config.inputSize;

    return tf.tidy(() => {
      // Convert ImageData to tensor
      const imgTensor = tf.browser.fromPixels(imageData);
      
      // Resize to model input size
      const resized = tf.image.resizeBilinear(imgTensor, [targetH, targetW]);
      
      // Normalize to [0, 1]
      const normalized = resized.div(255.0);
      
      // Add batch dimension
      return normalized.expandDims(0) as tf.Tensor4D;
    });
  }

  /**
   * Postprocess model output to ImageData mask
   */
  private async postprocess(
    output: tf.Tensor,
    originalSize: [number, number]
  ): Promise<ImageData> {
    const [height, width] = originalSize;

    // Get mask data
    const squeezed = output.squeeze([0, 3]) as tf.Tensor2D;
    
    // Resize back to original size
    const resized = tf.image.resizeBilinear(
      squeezed.expandDims(-1) as tf.Tensor3D,
      originalSize
    );
    squeezed.dispose();

    // Threshold to binary mask
    const binary = resized.greater(0.5);
    resized.dispose();

    // Convert to image data
    const maskData = await binary.mul(255).data();
    binary.dispose();

    // Create RGBA ImageData
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const val = maskData[i];
      rgba[i * 4] = val;
      rgba[i * 4 + 1] = val;
      rgba[i * 4 + 2] = val;
      rgba[i * 4 + 3] = 255;
    }

    return new ImageData(rgba, width, height);
  }

  /**
   * Estimate segmentation confidence based on mask properties
   */
  private estimateConfidence(mask: ImageData): number {
    const { data, width, height } = mask;
    let whitePixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 127) whitePixels++;
    }

    const coverage = whitePixels / (width * height);
    
    // Good wounds typically cover 5-60% of image
    if (coverage < 0.01) return 0.3;
    if (coverage > 0.8) return 0.4;
    if (coverage >= 0.05 && coverage <= 0.5) return 0.9;
    return 0.7;
  }

  /**
   * Extract contour points from mask
   */
  private extractContour(mask: ImageData): Point[] {
    const { width, height, data } = mask;
    const contour: Point[] = [];

    // Find edge pixels using simple edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        if (data[idx] > 127) {
          // Check 4-connected neighbors
          const top = data[((y - 1) * width + x) * 4];
          const bottom = data[((y + 1) * width + x) * 4];
          const left = data[(y * width + x - 1) * 4];
          const right = data[(y * width + x + 1) * 4];
          
          // Edge pixel if any neighbor is background
          if (top < 128 || bottom < 128 || left < 128 || right < 128) {
            contour.push({ x, y });
          }
        }
      }
    }

    // Simplify contour for efficiency
    return this.simplifyContour(contour, 3);
  }

  /**
   * Simplify contour by keeping every nth point
   */
  private simplifyContour(points: Point[], step: number): Point[] {
    if (points.length <= 100) return points;
    
    const simplified: Point[] = [];
    for (let i = 0; i < points.length; i += step) {
      simplified.push(points[i]);
    }
    return simplified;
  }

  /**
   * Calculate bounding box from contour points
   */
  private calculateBoundingBox(contour: Point[]): BoundingBox {
    if (contour.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const { x, y } of contour) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Calculate total mask area in pixels
   */
  private calculateMaskArea(mask: ImageData): number {
    let area = 0;
    for (let i = 0; i < mask.data.length; i += 4) {
      if (mask.data[i] > 127) area++;
    }
    return area;
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Get loading status
   */
  getLoadingStatus(): boolean {
    return this.isLoading;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
  }
}

// Singleton instance
let segmentationEngine: WoundSegmentationEngine | null = null;

export function getSegmentationEngine(): WoundSegmentationEngine {
  if (!segmentationEngine) {
    segmentationEngine = new WoundSegmentationEngine();
  }
  return segmentationEngine;
}
