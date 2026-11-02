import { NextResponse } from 'next/server';
import {
  analyzeReceiptWithTextract,
  archiveArtifactToS3,
  type AwsCloudConfig,
} from '@/lib/aws-cloud';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fileName: string = body?.fileName || 'thermal-receipt.jpg';
    const base64Image: string | undefined = body?.base64Image;
    const awsConfig: Partial<AwsCloudConfig> | undefined = body?.awsConfig;

    // 1. Archive receipt artifact to AWS S3 (or Hybrid Vault fallback)
    const s3Archive = await archiveArtifactToS3(
      `ocr-receipts/${Date.now()}-${fileName}`,
      base64Image || `OCR_RECEIPT_META:${fileName}`,
      'application/octet-stream',
      awsConfig
    );

    // 2. Run AWS Textract AnalyzeExpense (or deterministic high-accuracy fallback)
    const extraction = await analyzeReceiptWithTextract(
      fileName,
      base64Image,
      awsConfig
    );

    return NextResponse.json({
      extraction,
      s3Archive,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'OCR Receipt extraction failed',
      },
      { status: 500 }
    );
  }
}
