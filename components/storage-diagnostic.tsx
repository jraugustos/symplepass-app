'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DiagnosticResult {
  timestamp: string;
  test: string;
  status: 'success' | 'error' | 'info';
  message: string;
  details?: any;
}

export function StorageDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const supabase = createClient();

  const addResult = (test: string, status: DiagnosticResult['status'], message: string, details?: any) => {
    setResults(prev => [...prev, {
      timestamp: new Date().toISOString(),
      test,
      status,
      message,
      details
    }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runDiagnostics = async () => {
    clearResults();
    setIsRunning(true);

    try {
      // Test 1: Check authentication
      addResult('Auth Check', 'info', 'Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        addResult('Auth Check', 'error', 'No authenticated user', { error: authError?.message });
        setIsRunning(false);
        return;
      }

      addResult('Auth Check', 'success', `Authenticated as ${user.email}`, { userId: user.id });

      // Test 2: Check user profile and role
      addResult('Profile Check', 'info', 'Checking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        addResult('Profile Check', 'error', 'Profile not found', { error: profileError?.message });
      } else {
        const hasCorrectRole = profile.role === 'admin' || profile.role === 'organizer';
        addResult(
          'Profile Check',
          hasCorrectRole ? 'success' : 'error',
          `Role: ${profile.role}`,
          {
            fullName: profile.full_name,
            role: profile.role,
            hasUploadPermission: hasCorrectRole
          }
        );

        if (!hasCorrectRole) {
          addResult(
            'Profile Check',
            'error',
            'User does not have admin or organizer role - uploads will fail'
          );
        }
      }

      // Test 3: Check bucket access (list files)
      addResult('Bucket Access', 'info', 'Testing read access to event-banners bucket...');
      const { data: files, error: listError } = await supabase.storage
        .from('event-banners')
        .list('', { limit: 1 });

      if (listError) {
        addResult('Bucket Access', 'error', 'Cannot list bucket files', { error: listError.message });
      } else {
        addResult('Bucket Access', 'success', 'Read access OK', { fileCount: files?.length || 0 });
      }

      // Test 4: Test upload permission (if file selected)
      if (selectedFile) {
        addResult('Upload Test', 'info', `Testing upload with ${selectedFile.name}...`);
        const fileName = `diagnostic-test-${Date.now()}-${selectedFile.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-banners')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          addResult('Upload Test', 'error', 'Upload failed', {
            error: uploadError.message,
            fileName,
            fileSize: selectedFile.size,
            fileType: selectedFile.type
          });

          if (uploadError.message.includes('row-level security')) {
            addResult(
              'Upload Test',
              'error',
              '⚠️ RLS POLICY ERROR: Storage policies are not configured correctly'
            );
            addResult(
              'Fix Instructions',
              'info',
              'Run scripts/fix-storage-policies-now.sql in Supabase SQL Editor'
            );
          }
        } else {
          addResult('Upload Test', 'success', 'Upload successful!', {
            path: uploadData.path,
            fileName
          });

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('event-banners')
            .getPublicUrl(uploadData.path);

          addResult('Public URL', 'success', 'Public URL generated', {
            url: urlData.publicUrl
          });

          // Clean up - delete test file
          addResult('Cleanup', 'info', 'Deleting test file...');
          const { error: deleteError } = await supabase.storage
            .from('event-banners')
            .remove([fileName]);

          if (deleteError) {
            addResult('Cleanup', 'error', 'Could not delete test file', {
              error: deleteError.message
            });
          } else {
            addResult('Cleanup', 'success', 'Test file deleted');
          }
        }
      } else {
        addResult('Upload Test', 'info', 'No file selected - skipping upload test');
      }

      // Test 5: Check Supabase environment
      addResult('Environment', 'info', 'Checking configuration...', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
      });

    } catch (error) {
      addResult('Fatal Error', 'error', 'Unexpected error occurred', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Storage Upload Diagnostic Tool</h1>
        <p className="text-gray-600 mb-6">
          This tool helps diagnose issues with Supabase Storage uploads.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a test image (optional for upload test)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-colors"
          >
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </button>

          {results.length > 0 && (
            <button
              onClick={clearResults}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg
                hover:bg-gray-300 transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Diagnostic Results</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.status === 'success' ? 'bg-green-50 border-green-500' :
                  result.status === 'error' ? 'bg-red-50 border-red-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${getStatusColor(result.status)}`}>
                        {result.test}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{result.message}</p>
                    {result.details && (
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">Common Issues & Solutions</h3>
        <ul className="space-y-2 text-sm text-yellow-900">
          <li>
            <strong>❌ RLS Policy Error:</strong> Run the SQL script at{' '}
            <code className="bg-yellow-100 px-1 py-0.5 rounded">
              scripts/fix-storage-policies-now.sql
            </code>{' '}
            in Supabase SQL Editor
          </li>
          <li>
            <strong>❌ Wrong Role:</strong> Update user role to 'admin' or 'organizer' in profiles table
          </li>
          <li>
            <strong>❌ Not Authenticated:</strong> Make sure you're logged in before running this test
          </li>
          <li>
            <strong>❌ Bucket Not Found:</strong> Ensure storage buckets are created (run setup-storage-buckets.ts)
          </li>
        </ul>
      </div>
    </div>
  );
}
