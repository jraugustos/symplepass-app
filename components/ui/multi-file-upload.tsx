'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, FileText, Image, Map, Loader2, Check, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadService } from '@/lib/storage/upload-service';
import { validateMultipleFiles, getFileTypeIcon } from '@/lib/storage/file-validators';
import { formatFileSize, getBucketConfig } from '@/lib/storage/storage-config';
import { compressImage, createImagePreview, revokeImagePreview, needsCompression } from '@/lib/storage/image-utils';
import type { StorageBucket, UploadOptions, UploadResult } from '@/lib/storage/upload-types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileItem {
  id: string;
  file: File;
  url?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  preview?: string;
  result?: UploadResult;
}

interface MultiFileUploadProps {
  bucket: StorageBucket;
  folder?: string;
  value?: string[];
  onChange?: (urls: string[]) => void;
  onUploadComplete?: (results: UploadResult[]) => void;
  onError?: (errors: Error[]) => void;
  className?: string;
  disabled?: boolean;
  compress?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number;
  placeholder?: string;
}

export function MultiFileUpload({
  bucket,
  folder,
  value = [],
  onChange,
  onUploadComplete,
  onError,
  className,
  disabled = false,
  compress = true,
  maxFiles = 10,
  acceptedTypes,
  maxSize,
  placeholder = 'Arraste arquivos ou clique para selecionar',
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const bucketConfig = getBucketConfig(bucket);
  const accept = acceptedTypes?.join(',') || bucketConfig?.constraints.allowedExtensions.join(',');
  const maxFileSize = maxSize || bucketConfig?.constraints.maxSize || 10 * 1024 * 1024;

  const handleFilesSelect = useCallback(
    async (selectedFiles: FileList) => {
      const fileArray = Array.from(selectedFiles);

      // Check max files limit
      if (files.length + fileArray.length > maxFiles) {
        setGlobalError(`Você pode enviar no máximo ${maxFiles} arquivos`);
        return;
      }

      // Validate files
      const validation = validateMultipleFiles(
        fileArray,
        bucketConfig?.constraints || {
          maxSize: maxFileSize,
          allowedTypes: acceptedTypes || [],
          allowedExtensions: bucketConfig?.constraints.allowedExtensions || [],
        },
        maxFiles - files.length
      );

      if (!validation.valid) {
        setGlobalError(validation.errors.join('; '));
        return;
      }

      setGlobalError(null);

      // Create file items
      const newFileItems: FileItem[] = await Promise.all(
        fileArray.map(async (file) => {
          const id = `${Date.now()}-${Math.random()}`;
          let preview: string | undefined;

          if (file.type.startsWith('image/')) {
            preview = createImagePreview(file);
          }

          return {
            id,
            file,
            status: 'pending' as const,
            progress: 0,
            preview,
          };
        })
      );

      setFiles((prev) => [...prev, ...newFileItems]);

      // Start uploading files
      for (const item of newFileItems) {
        await uploadFile(item);
      }
    },
    [files, maxFiles, bucketConfig, acceptedTypes, maxFileSize]
  );

  const uploadFile = async (item: FileItem) => {
    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'uploading', progress: 25 } : f
        )
      );

      // Compress image if needed
      let fileToUpload = item.file;
      if (compress && needsCompression(item.file, 1024 * 1024)) {
        fileToUpload = await compressImage(item.file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
        });
      }

      // Update progress
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, progress: 50 } : f
        )
      );

      // Upload file
      const uploadOptions: UploadOptions = {
        bucket,
        folder,
        public: true,
      };

      const result = await uploadService.uploadFile(fileToUpload, uploadOptions);

      // Update status to success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'success', progress: 100, url: result.url, result }
            : f
        )
      );

      // Update parent component
      updateParentValues();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload';

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );
    }
  };

  const updateParentValues = () => {
    setFiles((currentFiles) => {
      const successfulUrls = currentFiles
        .filter((f) => f.status === 'success' && f.url)
        .map((f) => f.url!);

      const successfulResults = currentFiles
        .filter((f) => f.status === 'success' && f.result)
        .map((f) => f.result!);

      onChange?.(successfulUrls);

      if (successfulResults.length > 0) {
        onUploadComplete?.(successfulResults);
      }

      return currentFiles;
    });
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== id);

      // Update parent with remaining URLs
      const urls = newFiles
        .filter((f) => f.status === 'success' && f.url)
        .map((f) => f.url!);
      onChange?.(urls);

      return newFiles;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelect(e.target.files);
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

    if (e.dataTransfer.files) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (file.file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    }
    if (file.file.name.endsWith('.gpx')) {
      return <Map className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
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

  const canAddMore = files.length < maxFiles;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      {canAddMore && (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-colors',
            isDragging && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'hover:border-primary/50',
            globalError && 'border-red-500',
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
            multiple
            onChange={handleInputChange}
            disabled={disabled}
            className="sr-only"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              'w-full p-8 flex flex-col items-center justify-center space-y-2',
              !disabled && 'cursor-pointer'
            )}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">{placeholder}</p>
              <p className="text-xs text-gray-400 mt-1">
                {`Máximo ${maxFiles} arquivos • ${formatFileSize(maxFileSize)} cada`}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <div className="flex items-start space-x-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Files list */}
      {files.length > 0 && (
        <ScrollArea className="h-64 w-full rounded-md border p-4">
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* File preview or icon */}
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center bg-gray-200 rounded">
                      {getFileIcon(file)}
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>

                    {/* Progress bar */}
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}

                    {/* Error message */}
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="ml-2">{getStatusIcon(file.status)}</div>
                </div>

                {/* Remove button */}
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => handleRemoveFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Add more button */}
      {files.length > 0 && canAddMore && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar mais arquivos
        </Button>
      )}
    </div>
  );
}