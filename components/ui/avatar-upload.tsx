'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, Loader2, Check, AlertCircle, User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { uploadService } from '@/lib/storage/upload-service';
import { validateFileForBucket } from '@/lib/storage/file-validators';
import { compressImage, needsCompression } from '@/lib/storage/image-utils';
import type { UploadStatus } from '@/lib/storage/upload-types';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  /**
   * The user ID - REQUIRED for security.
   * Files will be uploaded to {userId}/ folder in user-avatars bucket.
   * This ensures RLS policies work correctly.
   */
  userId: string;
  value?: string | null;
  onChange?: (url: string | null) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

/**
 * Avatar upload component that enforces user-specific paths.
 * This component ensures files are uploaded to the correct folder
 * based on the user's ID, which is required for RLS policies.
 */
export function AvatarUpload({
  userId,
  value,
  onChange,
  onError,
  className,
  disabled = false,
  size = 'md',
}: AvatarUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!userId) {
    console.error('AvatarUpload: userId is required for security');
    return null;
  }

  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        setStatus('validating');
        setError(null);

        // Validate file
        const validation = validateFileForBucket(file, 'user-avatars');
        if (!validation.valid) {
          throw new Error(validation.errors.join('; '));
        }

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Compress image if needed
        let fileToUpload = file;
        if (needsCompression(file, 500 * 1024)) {
          setStatus('validating');
          try {
            fileToUpload = await compressImage(file, {
              maxWidth: 400,
              maxHeight: 400,
              quality: 0.85,
            });
          } catch (compressError) {
            console.error('Error compressing avatar:', compressError);
            fileToUpload = file;
          }
        }

        setStatus('uploading');

        // SECURITY: Always use userId as folder to comply with RLS policies
        // The RLS policy requires: (storage.foldername(name))[1] = auth.uid()::text
        const result = await uploadService.uploadFile(fileToUpload, {
          bucket: 'user-avatars',
          folder: userId,
          fileName: `avatar.${file.name.split('.').pop()}`,
          public: true,
        });

        setStatus('success');
        setPreview(result.url);
        onChange?.(result.url);

        // Cleanup preview URL
        URL.revokeObjectURL(previewUrl);

        setTimeout(() => {
          setStatus('idle');
        }, 2000);
      } catch (err) {
        console.error('Avatar upload error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload do avatar';
        setError(errorMessage);
        setStatus('error');
        setPreview(value || null);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    },
    [userId, value, onChange, onError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    setStatus('idle');
    onChange?.(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={cn('relative inline-block', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled || status === 'uploading'}
        className="sr-only"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || status === 'uploading'}
        className={cn(
          'relative rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-primary/50 transition-all',
          disabled && 'opacity-50 cursor-not-allowed',
          sizeClass
        )}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Avatar"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <User className="h-1/2 w-1/2 text-gray-400" />
          </div>
        )}

        {/* Upload overlay */}
        {!disabled && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            {status === 'uploading' ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : status === 'success' ? (
              <Check className="h-6 w-6 text-white" />
            ) : (
              <Upload className="h-6 w-6 text-white" />
            )}
          </div>
        )}
      </button>

      {/* Remove button */}
      {preview && !disabled && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0"
          onClick={handleRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs text-red-500 flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
