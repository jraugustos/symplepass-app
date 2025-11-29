'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Image, Map, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadService } from '@/lib/storage/upload-service';
import { validateFileForBucket, getFileTypeIcon } from '@/lib/storage/file-validators';
import { formatFileSize, getBucketConfig } from '@/lib/storage/storage-config';
import { compressImage, createImagePreview, revokeImagePreview, needsCompression } from '@/lib/storage/image-utils';
import type { StorageBucket, UploadOptions, UploadResult, UploadStatus } from '@/lib/storage/upload-types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  bucket: StorageBucket;
  folder?: string;
  value?: string;
  onChange?: (url: string | null) => void;
  onUploadComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  compress?: boolean;
  showPreview?: boolean;
  acceptedTypes?: string[];
  maxSize?: number;
  placeholder?: string;
}

export function FileUpload({
  bucket,
  folder,
  value,
  onChange,
  onUploadComplete,
  onError,
  className,
  disabled = false,
  compress = true,
  showPreview = true,
  acceptedTypes,
  maxSize,
  placeholder = 'Arraste um arquivo ou clique para selecionar',
}: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const bucketConfig = getBucketConfig(bucket);
  const accept = acceptedTypes?.join(',') || bucketConfig?.constraints.allowedExtensions.join(',');
  const maxFileSize = maxSize || bucketConfig?.constraints.maxSize || 10 * 1024 * 1024;

  useEffect(() => {
    // Update preview when value changes externally
    if (value && value !== preview) {
      setPreview(value);
    }
  }, [value]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        setStatus('validating');
        setError(null);
        setProgress(0);

        console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

        // Validate file
        const validation = validateFileForBucket(file, bucket);
        if (!validation.valid) {
          throw new Error(validation.errors.join('; '));
        }

        setFileName(file.name);

        // Create preview for images
        if (showPreview && file.type.startsWith('image/')) {
          try {
            const previewUrl = createImagePreview(file);
            setPreview(previewUrl);
          } catch (previewError) {
            console.error('Error creating preview:', previewError);
          }
        }

        // Compress image if needed
        let fileToUpload = file;
        if (compress && needsCompression(file, 1024 * 1024)) {
          setStatus('validating');
          console.log('Compressing image...');
          try {
            fileToUpload = await compressImage(file, {
              maxWidth: 1920,
              maxHeight: 1080,
              quality: 0.85,
            });
            console.log('Image compressed successfully');
          } catch (compressError) {
            console.error('Error compressing image:', compressError);
            fileToUpload = file; // Use original if compression fails
          }
        }

        setStatus('uploading');
        setProgress(25);

        // Upload file
        const uploadOptions: UploadOptions = {
          bucket,
          folder,
          public: true,
        };

        console.log('Starting upload with options:', uploadOptions);
        console.log('File to upload:', fileToUpload.name, 'Size:', fileToUpload.size);

        setProgress(50); // Update progress before upload

        const result = await uploadService.uploadFile(fileToUpload, uploadOptions);

        console.log('Upload result:', result);

        setProgress(100);
        setStatus('success');

        // Update preview with actual URL
        setPreview(result.url);

        // Call callbacks
        onChange?.(result.url);
        onUploadComplete?.(result);

        // Reset status after success
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
        }, 2000);
      } catch (err) {
        console.error('Upload error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload do arquivo';
        setError(errorMessage);
        setStatus('error');
        setPreview(null);
        onChange?.(null);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    },
    [bucket, folder, compress, showPreview, onChange, onUploadComplete, onError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    setStatus('idle');
    onChange?.(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'validating':
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-primary/50',
          error && 'border-red-500',
          'border-gray-200'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || status === 'uploading'}
          className="sr-only"
        />

        {preview && showPreview ? (
          <div className="relative p-4">
            {preview.startsWith('data:') || preview.startsWith('http') ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md"
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    iconOnly
                    className="absolute top-2 right-2"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-md">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || status === 'uploading'}
            className={cn(
              'w-full p-8 flex flex-col items-center justify-center space-y-2',
              !disabled && 'cursor-pointer'
            )}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
              {getStatusIcon() || <Upload className="h-6 w-6 text-gray-400" />}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">{placeholder}</p>
              <p className="text-xs text-gray-400 mt-1">
                {bucketConfig && `Máximo ${formatFileSize(maxFileSize)}`}
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {status === 'uploading' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Enviando {fileName}...</span>
            <span className="text-gray-500">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start space-x-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {status === 'success' && !error && (
        <div className="flex items-center space-x-2 text-sm text-green-500">
          <Check className="h-4 w-4" />
          <span>Arquivo enviado com sucesso!</span>
        </div>
      )}

      {/* File info */}
      {fileName && !preview && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 truncate">{fileName}</span>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}