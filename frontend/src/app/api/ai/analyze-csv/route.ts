import { NextResponse } from 'next/server';
import { parseAndAnalyzeBankCSV } from '@/lib/finance-engine';
import {
  archiveArtifactToS3,
  invokeBedrockModel,
  type AwsCloudConfig,
} from '@/lib/aws-cloud';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const csvText: string = body?.csvText || '';
    const fileName: string = body?.fileName || `statement-${Date.now()}.csv`;
    const awsConfig: Partial<AwsCloudConfig> | undefined = body?.awsConfig;

    if (!csvText.trim()) {
      return NextResponse.json(
        { error: 'CSV content is empty. Provide a valid bank statement CSV.' },
        { status: 400 }
      );
    }

    // 1. Run deterministic ML Shield & Z-score categorization engine
    const report = parseAndAnalyzeBankCSV(csvText);

    // 2. Archive raw statement to AWS S3 (or Hybrid Vault fallback)
    const s3Result = await archiveArtifactToS3(
      `csv-statements/${fileName}`,
      csvText,
      'text/csv',
      awsConfig
    );

    // 3. Query AWS Bedrock (Claude 3.5 Haiku / Nova) for executive insight enhancement
    const prompt = `Analyze this Indian bank statement summary (${report.detectedBankFormat}):
Total Inflow: INR ${report.totalCredits}
Total Outflow: INR ${report.totalDebits}
Net Cashflow: INR ${report.netCashflow}
Flagged Anomalies (>2.5 sigma): ${report.flaggedAnomalies.length}
Discovered Recurring Commitments: ${report.discoveredCommitments.map((c) => `${c.name} (${c.kind}: INR ${c.amount})`).join(', ')}
Provide a concise 3-bullet executive financial audit in plain text.`;

    const bedrockResult = await invokeBedrockModel(prompt, awsConfig);

    if (bedrockResult.mode === 'AWS_CLOUD' && bedrockResult.completion) {
      report.aiExecutiveSummary = [
        ...bedrockResult.completion
          .split('\n')
          .map((l) => l.replace(/^[-*•]\s*/, '').trim())
          .filter(Boolean)
          .slice(0, 4),
      ];
    }

    return NextResponse.json({
      report,
      cloudArchive: s3Result,
      aiEngine: {
        mode: bedrockResult.mode,
        modelId: bedrockResult.modelId,
        latencyMs: bedrockResult.latencyMs,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to analyze CSV statement',
      },
      { status: 500 }
    );
  }
}
