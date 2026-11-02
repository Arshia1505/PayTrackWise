import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Re-import or test compiled/source functions via dynamic TS loader or direct verification
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = '/home/akinchan/Documents/Projects/FinProj';

test('FinShield Project Structure & All 15+ Route Files Exist', () => {
  const requiredFiles = [
    'src/lib/finance-engine.ts',
    'src/lib/aws-cloud.ts',
    'src/components/primitives/index.tsx',
    'src/context/FinShieldContext.tsx',
    'src/components/AppShell.tsx',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/analytics/page.tsx',
    'src/app/transactions/page.tsx',
    'src/app/ocr/page.tsx',
    'src/app/budgets/page.tsx',
    'src/app/goals/page.tsx',
    'src/app/calculators/page.tsx',
    'src/app/split/page.tsx',
    'src/app/subscriptions/page.tsx',
    'src/app/import-csv/page.tsx',
    'src/app/crypto/page.tsx',
    'src/app/ml-shield/page.tsx',
    'src/app/notifications/page.tsx',
    'src/app/login/page.tsx',
    'src/app/settings/page.tsx',
    'src/app/api/ai/analyze-csv/route.ts',
    'src/app/api/ocr/scan/route.ts',
    'src/app/api/aws/sync/route.ts',
  ];

  for (const relPath of requiredFiles) {
    const absPath = path.join(projectRoot, relPath);
    assert.equal(fs.existsSync(absPath), true, `Missing required file: ${relPath}`);
  }
});

test('Node v24 TypeScript Native Stripping - finance-engine.ts Edge Cases', async () => {
  const engine = await import('../src/lib/finance-engine.ts');

  // 1. Indian Currency Formatting & Edge Cases (NaN, 0, negative, compact Lakhs/Crores)
  assert.equal(engine.formatINR(0), '₹0');
  assert.equal(engine.formatINR(Number.NaN), '₹0');
  assert.equal(engine.formatINR(184500), '₹1,84,500');
  assert.equal(engine.formatINR(184500, { compact: true }), '₹1.85L');
  assert.equal(engine.formatINR(25000000, { compact: true }), '₹2.50Cr');

  // 2. NPCI UPI 2.0 URI Builder (locks exact split amount & sanitizes parameters)
  const upiUri = engine.buildUpiUri({
    pa: 'arjun@okicici',
    pn: 'Arjun Mehta',
    am: 1416.666,
    cu: 'INR',
    tn: 'Split Church Street Social',
  });
  assert.match(upiUri, /^upi:\/\/pay\?/);
  assert.equal(upiUri.includes('pa=arjun%40okicici'), true);
  assert.equal(upiUri.includes('am=1416.67'), true);
  assert.equal(upiUri.includes('cu=INR'), true);

  // Boundary: negative amount clamped to 0.00, empty VPA falls back safely
  const fallbackUpi = engine.buildUpiUri({
    pa: '   ',
    pn: '',
    am: -500,
  });
  assert.equal(fallbackUpi.includes('am=0.00'), true);
  assert.equal(fallbackUpi.includes('pa=user%40okaxis'), true);

  // 3. WhatsApp Deep-Link Generator
  const waLink = engine.buildWhatsAppSplitLink({
    phone: '9845011223', // 10-digit Indian mobile auto-prefixed with 91
    friendName: 'Rohan',
    merchantName: 'Church Street Social',
    totalBill: 4250,
    shareAmount: 1417,
    upiUri,
  });
  assert.match(waLink, /^https:\/\/wa\.me\/919845011223\?text=/);

  // 4. ISO/IEC 18004 Reed-Solomon QR Matrix (Version 1 21x21 & Auto-Sized Full URI)
  const matrix = engine.generateQrMatrix(upiUri, 21);
  assert.equal(matrix.length, 21);
  assert.equal(matrix[0].length, 21);
  assert.equal(matrix[0][0], true); // Top-left finder corner
  assert.equal(matrix[0][20], true); // Top-right finder corner
  assert.equal(matrix[20][0], true); // Bottom-left finder corner
  assert.equal(matrix[21 - 8][8], true); // ISO/IEC 18004 dark module at (4*V + 9, 8)

  const fullQrMatrix = engine.generateQrMatrix(upiUri);
  assert.equal(fullQrMatrix.length >= 33, true); // Full ~90-byte UPI URI uses Version 4/5 (33x33 or 37x37)
  assert.equal(fullQrMatrix[0][0], true);
  assert.equal(fullQrMatrix[0][fullQrMatrix.length - 1], true);
  assert.equal(fullQrMatrix[fullQrMatrix.length - 1][0], true);

  // 5. EMI Calculator (Scene 8 Stitch benchmark: ₹25,00,000 @ 8.5% for 120 mos = ₹30,996/mo)
  const emi = engine.calculateEMI(2500000, 8.5, 120);
  assert.equal(emi.monthlyEMI, 30996);
  assert.equal(emi.yearlySchedule.length, 5);
  assert.equal(emi.principalSharePct + emi.interestSharePct, 100);

  // Zero-interest boundary test
  const zeroRateEmi = engine.calculateEMI(120000, 0, 12);
  assert.equal(zeroRateEmi.monthlyEMI, 10000);
  assert.equal(zeroRateEmi.totalInterest, 0);

  // 6. Loan Prepayment Calculator
  const prepay = engine.calculateLoanPrepayment(2500000, 8.5, 120, 5000);
  assert.equal(prepay.monthsSaved > 15, true);
  assert.equal(prepay.interestSaved > 200000, true);

  // 7. SIP Wealth Calculator
  const sip = engine.calculateSIP(25000, 12, 10);
  assert.equal(sip.totalInvested, 3000000);
  assert.equal(sip.futureValue > sip.totalInvested, true);

  // 8. CSV Bank Statement Parser & Z-Score Anomaly Sentinel (HDFC, ICICI, SBI, Axis/Kotak, Quoted Commas)
  const emptyReport = engine.parseAndAnalyzeBankCSV('   ');
  assert.equal(emptyReport.rows.length, 0);

  const hdfcReport = engine.parseAndAnalyzeBankCSV(engine.SAMPLE_BANK_CSV);
  assert.equal(hdfcReport.detectedBankFormat, 'HDFC Bank CSV');
  assert.equal(hdfcReport.rows.length >= 15, true);
  assert.equal(hdfcReport.flaggedAnomalies.length >= 1, true);
  assert.equal(
    hdfcReport.discoveredCommitments.some((c) => c.kind === 'SUBSCRIPTION'),
    true
  );
  assert.equal(
    hdfcReport.discoveredCommitments.some((c) => c.kind === 'UTILITY_BILL'),
    true
  );

  const iciciReport = engine.parseAndAnalyzeBankCSV(engine.SAMPLE_ICICI_CSV);
  assert.equal(iciciReport.detectedBankFormat, 'ICICI Bank CSV');
  assert.equal(iciciReport.rows.length >= 7, true);

  // SBI Bank CSV with quoted Indian comma-formatted numbers & embedded commas in Description
  const sbiReport = engine.parseAndAnalyzeBankCSV(engine.SAMPLE_SBI_CSV);
  assert.equal(sbiReport.detectedBankFormat, 'SBI Bank CSV');
  assert.equal(sbiReport.rows.length, 6);
  assert.equal(sbiReport.totalCredits, 135000);
  assert.equal(sbiReport.rows[1].amount, 3120);
  assert.equal(sbiReport.rows[1].category, 'Utilities & Rent');

  // Axis / Kotak Bank CSV with Amount + Dr/Cr indicator column and quoted commas
  const axisReport = engine.parseAndAnalyzeBankCSV(engine.SAMPLE_AXIS_CSV);
  assert.equal(axisReport.detectedBankFormat, 'Axis / Kotak CSV');
  assert.equal(axisReport.rows.length, 5);
  assert.equal(axisReport.totalCredits, 95000);
  assert.equal(axisReport.rows[0].type, 'credit');
  assert.equal(axisReport.rows[1].amount, 1179);
  assert.equal(axisReport.rows[1].type, 'debit');

  // Quoted CSV fields with embedded commas edge case test
  const quotedCsv = [
    'Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance',
    '06/11/2026,"UPI, SWIGGY, BLR",431011229988,06/11/2026,"1,250.00",0.00,"241,023.00"',
  ].join('\n');
  const quotedReport = engine.parseAndAnalyzeBankCSV(quotedCsv);
  assert.equal(quotedReport.rows.length, 1);
  assert.equal(quotedReport.rows[0].amount, 1250);
  assert.equal(quotedReport.rows[0].category, 'Dining Out');

  // 9. Solana P2P Crypto Conversion & Solana Pay URI (including message= and memo=)
  const solConv = engine.convertInrToCrypto(15850, 'SOL');
  assert.equal(solConv.tokenAmount, 1);
  assert.equal(solConv.estimatedFeeInr, 0.25);

  const usdcUri = engine.buildCryptoPaymentUri({
    symbol: 'USDC',
    recipientAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    tokenAmount: 16.57,
    memo: 'Dinner Split',
  });
  assert.match(usdcUri, /^solana:7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\?amount=16\.57/);
  assert.equal(usdcUri.includes('spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), true);
  assert.equal(usdcUri.includes('message=Dinner+Split'), true);
  assert.equal(usdcUri.includes('memo=Dinner+Split'), true);
});

test('AWS SigV4 Signing (with STS SessionToken) & Hybrid Fallback Verification - aws-cloud.ts', async () => {
  const aws = await import('../src/lib/aws-cloud.ts');

  const signed = aws.signAwsV4Request({
    method: 'POST',
    service: 'dynamodb',
    region: 'ap-south-1',
    host: 'dynamodb.ap-south-1.amazonaws.com',
    path: '/',
    headers: {
      'content-type': 'application/x-amz-json-1.0',
      'x-amz-target': 'DynamoDB_20120810.PutItem',
    },
    body: JSON.stringify({ TableName: 'FinShieldLedger' }),
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    sessionToken: 'IQoJb3JpZ2luX2VjEJr//////////wEaCmFwLXNvdXRoLTE=',
  });

  assert.match(
    signed.Authorization,
    /^AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\/\d{8}\/ap-south-1\/dynamodb\/aws4_request/
  );
  assert.equal(signed.Authorization.includes('x-amz-security-token'), true);
  assert.equal(
    signed['x-amz-security-token'],
    'IQoJb3JpZ2luX2VjEJr//////////wEaCmFwLXNvdXRoLTE='
  );
  assert.equal(typeof signed['x-amz-date'], 'string');
  assert.equal(signed['x-amz-content-sha256'].length, 64);

  // Hybrid fallback when no live AWS keys are present
  const s3Fallback = await aws.archiveArtifactToS3(
    'test/statement.csv',
    'Date,Amount\n2026-11-01,500',
    'text/csv'
  );
  assert.equal(s3Fallback.mode, 'HYBRID_LOCAL');
  assert.equal(s3Fallback.archived, true);
  assert.equal(s3Fallback.sha256.length, 64);

  const ocrBescom = await aws.analyzeReceiptWithTextract('bescom-electricity-bill.jpg');
  assert.equal(ocrBescom.merchant, 'BESCOM Electricity Board');
  assert.equal(ocrBescom.category, 'Utilities & Rent');
  assert.equal(ocrBescom.lineItems.length, 3);

  const dynamoSync = await aws.syncEntityToDynamoDB('VAULT_SNAPSHOT', 'arjun@finshield.in', {
    balance: 184500,
  });
  assert.equal(dynamoSync.synced, true);
  assert.equal(dynamoSync.mode, 'HYBRID_LOCAL');

  const bedrockRes = await aws.invokeBedrockModel('Audit statement');
  assert.equal(bedrockRes.mode, 'HYBRID_LOCAL');
});
