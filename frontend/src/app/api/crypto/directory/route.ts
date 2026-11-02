import { NextResponse } from 'next/server';
import {
  DEFAULT_CRYPT_DIRECTORY,
  SOLANA_NETWORKS,
  generateDeterministicTestnetWallet,
  isValidCryptHandle,
  isValidSolanaAddress,
  normalizeCryptHandle,
  resolveCryptHandle,
  searchCryptDirectory,
  type CryptHandleProfile,
  type SolanaCluster,
} from '@/lib/finance-engine';
import { syncEntityToDynamoDB, type AwsCloudConfig } from '@/lib/aws-cloud';

declare global {
  // eslint-disable-next-line no-var
  var __finshieldCryptDirectory: CryptHandleProfile[] | undefined;
}

function getSharedDirectory(): CryptHandleProfile[] {
  if (!globalThis.__finshieldCryptDirectory) {
    globalThis.__finshieldCryptDirectory = [...DEFAULT_CRYPT_DIRECTORY];
  }
  return globalThis.__finshieldCryptDirectory;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const handleParam = searchParams.get('handle') || '';
  const clusterParam = (searchParams.get('cluster') || 'testnet') as SolanaCluster;
  const cluster: SolanaCluster = clusterParam === 'devnet' ? 'devnet' : 'testnet';

  const directory = getSharedDirectory();
  const resolved = handleParam ? resolveCryptHandle(handleParam, directory) : null;
  const results = query ? searchCryptDirectory(query, directory) : directory;

  return NextResponse.json({
    ok: true,
    network: cluster,
    rpcEndpoint: SOLANA_NETWORKS[cluster].rpcEndpoint,
    count: results.length,
    directory,
    results,
    resolved,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawName = String(body?.name || 'FinShield User').trim() || 'FinShield User';
    const rawEmail =
      String(body?.email || `${rawName.toLowerCase().replace(/\s+/g, '.')}@finshield.in`).trim();
    const rawUpi =
      String(body?.upiVpa || `${rawName.split(' ')[0].toLowerCase()}@okicici`).trim();
    const rawPhone = body?.phone ? String(body.phone).trim() : undefined;
    const rawCluster: SolanaCluster = body?.network === 'devnet' ? 'devnet' : 'testnet';

    const requestedHandleInput = String(
      body?.handle || body?.cryptHandle || body?.username || rawName.split(' ')[0]
    ).trim();
    const normalizedHandle = normalizeCryptHandle(requestedHandleInput);

    if (!isValidCryptHandle(normalizedHandle)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invalid #crypt handle format. Use 2–32 alphanumeric characters (e.g. arjun#crypt).',
        },
        { status: 400 }
      );
    }

    const directory = getSharedDirectory();
    const existingIdx = directory.findIndex(
      (item) => item.handle.toLowerCase() === normalizedHandle.toLowerCase()
    );

    if (
      existingIdx >= 0 &&
      body?.strictUnique === true &&
      directory[existingIdx].email.toLowerCase() !== rawEmail.toLowerCase()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: `Handle ${normalizedHandle} is already claimed by ${directory[existingIdx].name}.`,
          conflictHandle: normalizedHandle,
        },
        { status: 409 }
      );
    }

    const usernamePart = normalizedHandle.replace(/#crypt$/i, '');
    const providedWallet = String(body?.walletAddress || body?.solanaWallet || '').trim();
    const walletAddress = isValidSolanaAddress(providedWallet)
      ? providedWallet
      : existingIdx >= 0
      ? directory[existingIdx].walletAddress
      : generateDeterministicTestnetWallet(normalizedHandle);

    const initials = rawName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'FS';

    const profileEntry: CryptHandleProfile = {
      id: existingIdx >= 0 ? directory[existingIdx].id : `crypt-u-${Date.now()}`,
      handle: normalizedHandle,
      username: usernamePart,
      name: rawName,
      email: rawEmail,
      upiVpa: rawUpi,
      phone: rawPhone || (existingIdx >= 0 ? directory[existingIdx].phone : '919845099887'),
      walletAddress,
      snsDomain: `${usernamePart}.sol`,
      avatarInitials: initials,
      network: rawCluster,
      verified: true,
      createdAt:
        existingIdx >= 0 ? directory[existingIdx].createdAt : new Date().toISOString(),
      recentSplitNote:
        body?.recentSplitNote ||
        (existingIdx >= 0
          ? directory[existingIdx].recentSplitNote
          : 'Registered on Solana Testnet (#crypt)'),
      suggestedInr:
        typeof body?.suggestedInr === 'number' && body.suggestedInr > 0
          ? body.suggestedInr
          : existingIdx >= 0
          ? directory[existingIdx].suggestedInr || 500
          : 500,
    };

    if (existingIdx >= 0) {
      directory[existingIdx] = profileEntry;
    } else {
      directory.push(profileEntry);
    }

    const awsConfig: Partial<AwsCloudConfig> | undefined = body?.awsConfig;
    const syncResult = await syncEntityToDynamoDB(
      'CRYPT_HANDLE_DIRECTORY',
      normalizedHandle,
      profileEntry as unknown as Record<string, unknown>,
      awsConfig
    );

    return NextResponse.json({
      ok: true,
      profile: profileEntry,
      directory,
      syncResult,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to register #crypt handle',
      },
      { status: 500 }
    );
  }
}
