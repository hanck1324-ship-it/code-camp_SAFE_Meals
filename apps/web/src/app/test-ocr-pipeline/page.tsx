'use client';

import { useState } from 'react';

interface OcrResult {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

interface CleanedResult {
  original: string;
  cleansed: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

interface NormalizedResult {
  original: string;
  normalized: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

interface TranslatedResult {
  id: string;
  original: string;
  normalized: string;
  translated: string;
  bbox: { x: number; y: number; w: number; h: number };
}

export default function TestOcrPipelinePage() {
  const [ocrInput, setOcrInput] = useState<string>('');
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([]);
  const [cleanedResults, setCleanedResults] = useState<CleanedResult[]>([]);
  const [normalizedResults, setNormalizedResults] = useState<NormalizedResult[]>([]);
  const [translatedResults, setTranslatedResults] = useState<TranslatedResult[]>([]);
  const [error, setError] = useState<string>('');

  const handleInputChange = (value: string) => {
    setOcrInput(value);
    setError('');
    try {
      const parsed = JSON.parse(value);
      setOcrResults(parsed);
    } catch (e) {
      // Invalid JSON, ignore
    }
  };

  const runCleansing = async () => {
    try {
      setError('');
      const response = await fetch('/api/ocr-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrResults,
          stages: ['cleanse'],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCleanedResults(data.cleansed || []);
    } catch (e) {
      setError(`Cleansing error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const runNormalization = async () => {
    try {
      setError('');
      const response = await fetch('/api/ocr-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrResults: cleanedResults.map((r) => ({
            text: r.cleansed,
            confidence: r.confidence,
            bbox: r.bbox,
          })),
          stages: ['cleanse', 'normalize'],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setNormalizedResults(data.normalized || []);
    } catch (e) {
      setError(`Normalization error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const runTranslation = async () => {
    try {
      setError('');
      const response = await fetch('/api/ocr-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrResults: normalizedResults.map((r) => ({
            text: r.normalized,
            confidence: r.confidence,
            bbox: r.bbox,
          })),
          stages: ['cleanse', 'normalize', 'translate'],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setTranslatedResults(data.translated || []);
    } catch (e) {
      setError(`Translation error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const loadSampleData = () => {
    const sample: OcrResult[] = [
      { text: '김치찌개##', confidence: 0.95, bbox: { x: 10, y: 20, w: 100, h: 30 } },
      { text: '10,000원', confidence: 0.92, bbox: { x: 120, y: 20, w: 80, h: 30 } },
      { text: 'ㄱ치찌개', confidence: 0.87, bbox: { x: 10, y: 60, w: 100, h: 30 } },
      { text: '김치 찌개', confidence: 0.90, bbox: { x: 10, y: 100, w: 100, h: 30 } },
      { text: '삼겹', confidence: 0.88, bbox: { x: 10, y: 140, w: 80, h: 30 } },
      { text: '불고기', confidence: 0.93, bbox: { x: 10, y: 180, w: 80, h: 30 } },
    ];
    setOcrInput(JSON.stringify(sample, null, 2));
    setOcrResults(sample);
  };

  return (
    <div data-testid="ocr-pipeline-test-page" className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold">OCR Pipeline Test Harness</h1>

        {/* Error Display */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800" data-testid="error-message">
            {error}
          </div>
        )}

        {/* Sample Data Button */}
        <div className="mb-6">
          <button
            onClick={loadSampleData}
            data-testid="load-sample-data"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Load Sample Data
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Step 1: OCR Input */}
          <section data-testid="ocr-input" className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Step 1: OCR Input</h2>
            <textarea
              data-testid="ocr-input-textarea"
              value={ocrInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder='[{"text": "김치찌개##", "confidence": 0.95, "bbox": {"x": 10, "y": 20, "w": 100, "h": 30}}]'
              className="h-48 w-full rounded border p-2 font-mono text-sm"
            />
            <p className="mt-2 text-sm text-gray-600">
              Items: {ocrResults.length}
            </p>
          </section>

          {/* Step 2: Cleansed */}
          <section data-testid="cleansing-output" className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Step 2: Cleansed</h2>
              <button
                data-testid="run-cleansing"
                onClick={runCleansing}
                disabled={ocrResults.length === 0}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-300"
              >
                Run Cleansing
              </button>
            </div>
            <pre
              data-testid="cleansed-results"
              className="h-48 overflow-auto rounded bg-gray-100 p-4 text-xs"
            >
              {cleanedResults.length > 0
                ? JSON.stringify(cleanedResults, null, 2)
                : 'No results yet'}
            </pre>
            <p className="mt-2 text-sm text-gray-600">
              Items: {cleanedResults.length}
            </p>
          </section>

          {/* Step 3: Normalized */}
          <section data-testid="normalization-output" className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Step 3: Normalized</h2>
              <button
                data-testid="run-normalization"
                onClick={runNormalization}
                disabled={cleanedResults.length === 0}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-300"
              >
                Run Normalization
              </button>
            </div>
            <pre
              data-testid="normalized-results"
              className="h-48 overflow-auto rounded bg-gray-100 p-4 text-xs"
            >
              {normalizedResults.length > 0
                ? JSON.stringify(normalizedResults, null, 2)
                : 'No results yet'}
            </pre>
            <p className="mt-2 text-sm text-gray-600">
              Items: {normalizedResults.length}
            </p>
          </section>

          {/* Step 4: Translated */}
          <section data-testid="translation-output" className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Step 4: Translated</h2>
              <button
                data-testid="run-translation"
                onClick={runTranslation}
                disabled={normalizedResults.length === 0}
                className="rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:bg-gray-300"
              >
                Run Translation
              </button>
            </div>
            <pre
              data-testid="translated-results"
              className="h-48 overflow-auto rounded bg-gray-100 p-4 text-xs"
            >
              {translatedResults.length > 0
                ? JSON.stringify(translatedResults, null, 2)
                : 'No results yet'}
            </pre>
            <p className="mt-2 text-sm text-gray-600">
              Items: {translatedResults.length}
            </p>
          </section>
        </div>

        {/* Pipeline Flow Diagram */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Pipeline Flow</h2>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="rounded-lg bg-gray-200 px-4 py-2 font-semibold">OCR Input</div>
              <div className="text-sm text-gray-600">{ocrResults.length} items</div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="rounded-lg bg-green-200 px-4 py-2 font-semibold">Cleansed</div>
              <div className="text-sm text-gray-600">{cleanedResults.length} items</div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="rounded-lg bg-purple-200 px-4 py-2 font-semibold">Normalized</div>
              <div className="text-sm text-gray-600">{normalizedResults.length} items</div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="rounded-lg bg-orange-200 px-4 py-2 font-semibold">Translated</div>
              <div className="text-sm text-gray-600">{translatedResults.length} items</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
