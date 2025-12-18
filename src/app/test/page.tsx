'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
  timestamp?: string;
}

export default function TestPage() {
  const [supabaseResult, setSupabaseResult] = useState<TestResult | null>(null);
  const [apiKeyResult, setApiKeyResult] = useState<TestResult | null>(null);
  const [statusResult, setStatusResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState({
    supabase: false,
    apiKey: false,
    status: false,
  });

  const testSupabase = async () => {
    setLoading((prev) => ({ ...prev, supabase: true }));
    setSupabaseResult(null);
    try {
      const res = await fetch('/api/test/supabase');
      const data = await res.json();
      setSupabaseResult(data);
    } catch (error: any) {
      setSupabaseResult({
        success: false,
        error: error.message || '테스트 실패',
      });
    } finally {
      setLoading((prev) => ({ ...prev, supabase: false }));
    }
  };

  const testApiKey = async () => {
    setLoading((prev) => ({ ...prev, apiKey: true }));
    setApiKeyResult(null);
    try {
      const res = await fetch('/api/test/api-key');
      const data = await res.json();
      setApiKeyResult(data);
    } catch (error: any) {
      setApiKeyResult({
        success: false,
        error: error.message || '테스트 실패',
      });
    } finally {
      setLoading((prev) => ({ ...prev, apiKey: false }));
    }
  };

  const testStatus = async () => {
    setLoading((prev) => ({ ...prev, status: true }));
    setStatusResult(null);
    try {
      const res = await fetch('/api/test/status');
      const data = await res.json();
      setStatusResult(data);
    } catch (error: any) {
      setStatusResult({
        success: false,
        error: error.message || '테스트 실패',
      });
    } finally {
      setLoading((prev) => ({ ...prev, status: false }));
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">연결 테스트</h1>
      <p className="mb-8 text-muted-foreground">
        Supabase와 API 키 연결 상태를 확인합니다.
      </p>

      {/* Supabase 테스트 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>1. Supabase 연결 테스트</CardTitle>
          <CardDescription>
            Supabase 클라이언트가 정상적으로 연결되는지 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testSupabase}
            disabled={loading.supabase}
            className="mb-4"
          >
            {loading.supabase ? '테스트 중...' : 'Supabase 테스트'}
          </Button>
          {supabaseResult && (
            <Alert variant={supabaseResult.success ? 'default' : 'destructive'}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {supabaseResult.success ? '✅ 성공' : '❌ 실패'}
                  </p>
                  {supabaseResult.message && <p>{supabaseResult.message}</p>}
                  {supabaseResult.error && (
                    <p className="text-red-600">{supabaseResult.error}</p>
                  )}
                  {supabaseResult.details && (
                    <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(supabaseResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* API 키 테스트 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>2. 식품안전나라 API 키 테스트</CardTitle>
          <CardDescription>
            식품안전나라 API가 정상적으로 작동하는지 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testApiKey}
            disabled={loading.apiKey}
            className="mb-4"
          >
            {loading.apiKey ? '테스트 중...' : 'API 키 테스트'}
          </Button>
          {apiKeyResult && (
            <Alert variant={apiKeyResult.success ? 'default' : 'destructive'}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {apiKeyResult.success ? '✅ 성공' : '❌ 실패'}
                  </p>
                  {apiKeyResult.message && <p>{apiKeyResult.message}</p>}
                  {apiKeyResult.error && (
                    <p className="text-red-600">{apiKeyResult.error}</p>
                  )}
                  {apiKeyResult.details && (
                    <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(apiKeyResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 전체 상태 확인 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>3. 전체 상태 확인</CardTitle>
          <CardDescription>
            Supabase와 API 키 모두의 상태를 한 번에 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testStatus}
            disabled={loading.status}
            className="mb-4"
          >
            {loading.status ? '테스트 중...' : '전체 상태 확인'}
          </Button>
          {statusResult && (
            <Alert
              variant={
                statusResult.summary?.allGood ? 'default' : 'destructive'
              }
            >
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    {statusResult.summary?.message}
                  </p>
                  {statusResult.details && (
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold">Supabase:</p>
                        <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                          {JSON.stringify(statusResult.supabase, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="font-semibold">API 키:</p>
                        <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                          {JSON.stringify(statusResult.apiKey, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
