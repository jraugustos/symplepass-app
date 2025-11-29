'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle2, XCircle, Upload, Loader2 } from 'lucide-react'

export function UploadDiagnostic() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [results, setResults] = useState<any[]>([])
  const [uploadUrl, setUploadUrl] = useState<string>('')

  const addResult = (test: string, success: boolean, details: string) => {
    setResults(prev => [...prev, { test, success, details }])
  }

  const runDiagnostic = async () => {
    setStatus('testing')
    setResults([])
    setUploadUrl('')

    const supabase = createClient()

    try {
      // Test 1: Check authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session) {
        addResult('Authentication', false, authError?.message || 'No active session')
        setStatus('error')
        return
      }
      addResult('Authentication', true, `Logged in as: ${session.user.email}`)

      // Test 2: Check user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile) {
        addResult('User Role', false, profileError?.message || 'Could not fetch profile')
        setStatus('error')
        return
      }
      addResult('User Role', true, `Role: ${profile.role}`)

      // Test 3: Check if role allows upload
      const canUpload = profile.role === 'admin' || profile.role === 'organizer'
      if (!canUpload) {
        addResult('Upload Permission', false, `Role '${profile.role}' cannot upload. Need 'admin' or 'organizer'`)
        setStatus('error')
        return
      }
      addResult('Upload Permission', true, 'User has upload permissions')

      // Test 4: Test actual upload
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const fileName = `test-${Date.now()}.txt`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-banners')
        .upload(fileName, testFile)

      if (uploadError) {
        addResult('File Upload', false, `Upload failed: ${uploadError.message}`)

        // Check if it's a policy error
        if (uploadError.message.includes('policy')) {
          addResult('Storage Policy', false, 'RLS policies not configured correctly')
        }

        setStatus('error')
        return
      }

      addResult('File Upload', true, `Uploaded: ${uploadData.path}`)

      // Test 5: Get public URL
      const { data: urlData } = supabase.storage
        .from('event-banners')
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        setUploadUrl(urlData.publicUrl)
        addResult('Public URL', true, 'URL generated successfully')
      }

      // Test 6: Clean up - delete test file
      const { error: deleteError } = await supabase.storage
        .from('event-banners')
        .remove([fileName])

      if (deleteError) {
        addResult('Cleanup', false, `Could not delete test file: ${deleteError.message}`)
      } else {
        addResult('Cleanup', true, 'Test file deleted')
      }

      setStatus('success')

    } catch (error) {
      addResult('Unexpected Error', false, error instanceof Error ? error.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upload System Diagnostic</h3>
        <Button
          onClick={runDiagnostic}
          disabled={status === 'testing'}
          size="sm"
        >
          {status === 'testing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Run Test
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium">{result.test}</div>
                <div className="text-gray-600">{result.details}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All tests passed! Upload system is working correctly.
            {uploadUrl && (
              <div className="mt-2 text-xs">
                Test URL: <a href={uploadUrl} target="_blank" rel="noopener noreferrer" className="underline">{uploadUrl}</a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Upload system has issues. Please run the SQL fix script in Supabase Dashboard.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  )
}