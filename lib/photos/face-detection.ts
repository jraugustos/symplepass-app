/**
 * Face detection and recognition module
 * Uses face-api.js for client-side face detection and embedding extraction
 */

import * as faceapi from '@vladmandic/face-api';

// ============================================================
// Types
// ============================================================

/**
 * Bounding box of a detected face
 */
export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result of face detection on a single image
 */
export interface FaceDetectionResult {
  /** 128-dimensional face embedding vector */
  embedding: number[];
  /** Bounding box of the face in the image */
  boundingBox: FaceBoundingBox;
  /** Detection confidence score (0-1) */
  confidence: number;
}

/**
 * Result of processing a photo for face detection
 */
export interface PhotoFaceProcessingResult {
  /** Whether processing was successful */
  success: boolean;
  /** Faces detected in the image */
  faces: FaceDetectionResult[];
  /** Error message if processing failed */
  error?: string;
}

/**
 * Status of model loading
 */
export interface ModelLoadingStatus {
  isLoaded: boolean;
  isLoading: boolean;
  error?: string;
}

// ============================================================
// Module state
// ============================================================

let modelsLoaded = false;
let modelsLoading = false;
let loadingError: string | undefined;

// Path to models in public folder
const MODELS_PATH = '/models';

// ============================================================
// Model loading
// ============================================================

/**
 * Load face-api.js models
 * Models should be hosted in /public/models/
 * Required models:
 * - ssd_mobilenetv1_model (face detection)
 * - face_landmark_68_model (face landmarks)
 * - face_recognition_model (face embeddings)
 */
export async function loadFaceDetectionModels(): Promise<void> {
  if (modelsLoaded) {
    console.log('[FaceDetection] Models already loaded');
    return;
  }

  if (modelsLoading) {
    console.log('[FaceDetection] Models already loading, waiting...');
    // Wait for loading to complete
    while (modelsLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (loadingError) {
      throw new Error(loadingError);
    }
    return;
  }

  modelsLoading = true;
  loadingError = undefined;

  try {
    console.log('[FaceDetection] Loading face detection models...');

    // Load all required models in parallel
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH),
    ]);

    modelsLoaded = true;
    console.log('[FaceDetection] Models loaded successfully');
  } catch (error) {
    loadingError =
      error instanceof Error ? error.message : 'Erro ao carregar modelos de detecção facial';
    console.error('[FaceDetection] Failed to load models:', error);
    throw new Error(loadingError);
  } finally {
    modelsLoading = false;
  }
}

/**
 * Get the current model loading status
 */
export function getModelLoadingStatus(): ModelLoadingStatus {
  return {
    isLoaded: modelsLoaded,
    isLoading: modelsLoading,
    error: loadingError,
  };
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

// ============================================================
// Face detection
// ============================================================

/**
 * Create an HTMLImageElement from a File or Blob
 */
async function createImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Falha ao carregar imagem'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create an HTMLImageElement from a URL
 */
async function createImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem da URL'));
    img.src = url;
  });
}

/**
 * Detect faces in an image and extract embeddings
 *
 * @param input - Image file, blob, or URL
 * @returns Array of detected faces with embeddings
 */
export async function detectFaces(input: File | Blob | string): Promise<FaceDetectionResult[]> {
  // Ensure models are loaded
  if (!modelsLoaded) {
    await loadFaceDetectionModels();
  }

  // Create image element
  const img = typeof input === 'string' ? await createImageFromUrl(input) : await createImageFromFile(input);

  try {
    // Detect all faces with landmarks and descriptors
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Transform to our format
    return detections.map((detection) => ({
      embedding: Array.from(detection.descriptor),
      boundingBox: {
        x: Math.round(detection.detection.box.x),
        y: Math.round(detection.detection.box.y),
        width: Math.round(detection.detection.box.width),
        height: Math.round(detection.detection.box.height),
      },
      confidence: detection.detection.score,
    }));
  } finally {
    // Clean up
    if (img.parentNode) {
      img.parentNode.removeChild(img);
    }
  }
}

/**
 * Detect a single face in an image (best for selfies)
 * Returns the face with highest confidence
 *
 * @param input - Image file, blob, or URL
 * @returns Single face detection result or null if no face found
 */
export async function detectSingleFace(
  input: File | Blob | string
): Promise<FaceDetectionResult | null> {
  const faces = await detectFaces(input);

  if (faces.length === 0) {
    return null;
  }

  // Return the face with highest confidence
  return faces.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );
}

/**
 * Process a photo for face detection
 * Wrapper that handles errors gracefully
 *
 * @param input - Image file, blob, or URL
 * @returns Processing result with faces or error
 */
export async function processPhotoForFaces(
  input: File | Blob | string
): Promise<PhotoFaceProcessingResult> {
  try {
    const faces = await detectFaces(input);

    return {
      success: true,
      faces,
    };
  } catch (error) {
    console.error('[FaceDetection] Error processing photo:', error);

    return {
      success: false,
      faces: [],
      error: error instanceof Error ? error.message : 'Erro ao processar imagem',
    };
  }
}

// ============================================================
// Face comparison
// ============================================================

/**
 * Calculate Euclidean distance between two face embeddings
 * Lower distance = more similar faces
 *
 * @param embedding1 - First face embedding (128 dimensions)
 * @param embedding2 - Second face embedding (128 dimensions)
 * @returns Euclidean distance between embeddings
 */
export function calculateEuclideanDistance(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== 128 || embedding2.length !== 128) {
    throw new Error('Embeddings devem ter 128 dimensões');
  }

  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = embedding1[i] - embedding2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Calculate cosine similarity between two face embeddings
 * Higher similarity = more similar faces (range: -1 to 1, typically 0 to 1 for faces)
 *
 * @param embedding1 - First face embedding (128 dimensions)
 * @param embedding2 - Second face embedding (128 dimensions)
 * @returns Cosine similarity between embeddings
 */
export function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== 128 || embedding2.length !== 128) {
    throw new Error('Embeddings devem ter 128 dimensões');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < 128; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Check if two faces match based on similarity threshold
 *
 * @param embedding1 - First face embedding
 * @param embedding2 - Second face embedding
 * @param threshold - Similarity threshold (default: 0.6)
 * @returns Whether faces match
 */
export function facesMatch(
  embedding1: number[],
  embedding2: number[],
  threshold: number = 0.6
): boolean {
  const similarity = calculateCosineSimilarity(embedding1, embedding2);
  return similarity >= threshold;
}

/**
 * Find matching faces in a collection of embeddings
 *
 * @param targetEmbedding - Embedding to search for
 * @param embeddings - Collection of embeddings to search in
 * @param threshold - Minimum similarity threshold (default: 0.6)
 * @returns Array of matches with similarity scores, sorted by similarity (highest first)
 */
export function findMatchingFaces(
  targetEmbedding: number[],
  embeddings: { id: string; embedding: number[] }[],
  threshold: number = 0.6
): { id: string; similarity: number }[] {
  const matches: { id: string; similarity: number }[] = [];

  for (const item of embeddings) {
    const similarity = calculateCosineSimilarity(targetEmbedding, item.embedding);
    if (similarity >= threshold) {
      matches.push({ id: item.id, similarity });
    }
  }

  // Sort by similarity (highest first)
  return matches.sort((a, b) => b.similarity - a.similarity);
}

// ============================================================
// Utility functions
// ============================================================

/**
 * Convert similarity score to a human-readable label
 *
 * @param similarity - Similarity score (0-1)
 * @returns Human-readable match quality label
 */
export function getSimilarityLabel(similarity: number): 'alta' | 'média' | 'baixa' {
  if (similarity >= 0.8) return 'alta';
  if (similarity >= 0.65) return 'média';
  return 'baixa';
}

/**
 * Format similarity score as percentage
 *
 * @param similarity - Similarity score (0-1)
 * @returns Formatted percentage string
 */
export function formatSimilarityAsPercentage(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

/**
 * Validate that an embedding has the correct format
 *
 * @param embedding - Embedding to validate
 * @returns Whether embedding is valid
 */
export function isValidEmbedding(embedding: unknown): embedding is number[] {
  return (
    Array.isArray(embedding) &&
    embedding.length === 128 &&
    embedding.every((v) => typeof v === 'number' && !isNaN(v))
  );
}

/**
 * Convert embedding array to string for storage/transmission
 * Uses JSON format for simplicity and compatibility
 */
export function serializeEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding);
}

/**
 * Parse embedding string back to array
 */
export function deserializeEmbedding(serialized: string): number[] {
  const parsed = JSON.parse(serialized);
  if (!isValidEmbedding(parsed)) {
    throw new Error('Invalid embedding format');
  }
  return parsed;
}
