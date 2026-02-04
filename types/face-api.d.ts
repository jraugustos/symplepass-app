/**
 * Type declarations for @vladmandic/face-api
 * This provides basic type definitions for the face detection library
 */

declare module '@vladmandic/face-api' {
  export interface IRect {
    x: number
    y: number
    width: number
    height: number
  }

  export interface Box {
    x: number
    y: number
    width: number
    height: number
  }

  export interface FaceDetection {
    score: number
    box: Box
  }

  export interface FaceLandmarks68 {
    positions: { x: number; y: number }[]
  }

  export interface WithFaceDetection<T> {
    detection: FaceDetection
  }

  export interface WithFaceLandmarks<T, TLandmarks> extends WithFaceDetection<T> {
    landmarks: TLandmarks
  }

  export interface WithFaceDescriptor<T> extends WithFaceLandmarks<T, FaceLandmarks68> {
    descriptor: Float32Array
  }

  export type FaceDetectionWithLandmarksAndDescriptor = WithFaceDescriptor<{}>

  export interface SsdMobilenetv1Options {
    minConfidence?: number
    maxResults?: number
  }

  export class SsdMobilenetv1Options {
    constructor(options?: { minConfidence?: number; maxResults?: number })
  }

  export interface NeuralNetwork<T> {
    loadFromUri(uri: string): Promise<void>
    loadFromDisk(path: string): Promise<void>
  }

  export const nets: {
    ssdMobilenetv1: NeuralNetwork<unknown>
    faceLandmark68Net: NeuralNetwork<unknown>
    faceRecognitionNet: NeuralNetwork<unknown>
  }

  export function detectAllFaces(
    input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    options?: SsdMobilenetv1Options
  ): {
    withFaceLandmarks(): {
      withFaceDescriptors(): Promise<FaceDetectionWithLandmarksAndDescriptor[]>
    }
  }

  export function detectSingleFace(
    input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    options?: SsdMobilenetv1Options
  ): {
    withFaceLandmarks(): {
      withFaceDescriptor(): Promise<FaceDetectionWithLandmarksAndDescriptor | undefined>
    }
  }
}
