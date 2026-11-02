import { NextResponse } from 'next/server';
import { syncEntityToDynamoDB, type AwsCloudConfig } from '@/lib/aws-cloud';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entityType: string = body?.entityType || 'VAULT_SNAPSHOT';
    const entityId: string = body?.entityId || 'primary';
    const payload: Record<string, unknown> = body?.payload || {};
    const awsConfig: Partial<AwsCloudConfig> | undefined = body?.awsConfig;

    const result = await syncEntityToDynamoDB(
      entityType,
      entityId,
      payload,
      awsConfig
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        synced: false,
        mode: 'HYBRID_LOCAL',
        error: err instanceof Error ? err.message : 'DynamoDB sync failed',
      },
      { status: 500 }
    );
  }
}
