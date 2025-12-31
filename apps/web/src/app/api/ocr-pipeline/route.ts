import { NextRequest, NextResponse } from 'next/server';
import { cleanseOcrText } from '@/features/scan/utils/ocrCleansing';
import { normalizeMenuNames } from '@/features/scan/utils/menuNormalize';
import { translateMenuNames } from '@/features/scan/utils/menuTranslate';

export interface OcrResult {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface CleanedResult {
  original: string;
  cleansed: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface NormalizedResult {
  original: string;
  normalized: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface TranslatedResult {
  id: string;
  original: string;
  normalized: string;
  translated: string;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface PipelineRequest {
  ocrResults: OcrResult[];
  stages?: ('cleanse' | 'normalize' | 'translate')[];
}

export interface PipelineResponse {
  cleansed?: CleanedResult[];
  normalized?: NormalizedResult[];
  translated?: TranslatedResult[];
  error?: string;
}

/**
 * POST /api/ocr-pipeline
 *
 * Process OCR results through cleansing, normalization, and translation pipeline.
 *
 * @param request - JSON body with ocrResults and optional stages array
 * @returns Processed results for requested stages
 */
export async function POST(request: NextRequest): Promise<NextResponse<PipelineResponse>> {
  try {
    const body: PipelineRequest = await request.json();
    const { ocrResults, stages = ['cleanse', 'normalize', 'translate'] } = body;

    // Validate input
    if (!ocrResults || !Array.isArray(ocrResults)) {
      return NextResponse.json(
        { error: 'Invalid input: ocrResults must be an array' },
        { status: 400 }
      );
    }

    const response: PipelineResponse = {};

    // Stage 1: Cleansing
    let cleanedResults: CleanedResult[] = [];
    if (stages.includes('cleanse')) {
      cleanedResults = cleanseOcrText(ocrResults);
      response.cleansed = cleanedResults;
    }

    // Stage 2: Normalization (requires cleansing)
    let normalizedResults: NormalizedResult[] = [];
    if (stages.includes('normalize')) {
      if (cleanedResults.length === 0) {
        cleanedResults = cleanseOcrText(ocrResults);
      }
      normalizedResults = normalizeMenuNames(cleanedResults);
      response.normalized = normalizedResults;
    }

    // Stage 3: Translation (requires normalization)
    if (stages.includes('translate')) {
      if (normalizedResults.length === 0) {
        if (cleanedResults.length === 0) {
          cleanedResults = cleanseOcrText(ocrResults);
        }
        normalizedResults = normalizeMenuNames(cleanedResults);
      }
      const translatedResults = await translateMenuNames(normalizedResults);
      response.translated = translatedResults;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('OCR Pipeline error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ocr-pipeline
 *
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    availableStages: ['cleanse', 'normalize', 'translate'],
    message: 'OCR Pipeline API is running',
  });
}
