# FinShield — AWS Cloud ($200 Credit) & Vercel Setup Guide

FinShield is built with a **Hybrid AWS Cloud + Local Fallback** architecture ([`src/lib/aws-cloud.ts`](./src/lib/aws-cloud.ts)). It works 100% out-of-the-box in **Hybrid Local Mode**, and switches automatically to **Live AWS Cloud Mode** as soon as you provide your credentials via `.env.local`, **Vercel Environment Variables**, or directly inside **Scene 12: Profile & Settings** (`/settings`).

---

## 1. Architecture Overview (How Your $200 AWS Credit Is Used)

| AWS Service | FinShield Feature | Endpoint / API Operation | Estimated Cost (on $200 Credit) |
| :--- | :--- | :--- | :--- |
| **Amazon Bedrock** | CSV Bank Statement AI Categorization, Recurring Subscription/EMI Discovery & ML Shield Insights ([`/api/ai/analyze-csv`](./src/app/api/ai/analyze-csv/route.ts)) | `POST /model/{modelId}/invoke` (`Claude 3.5 Haiku/Sonnet` or `Amazon Nova Lite/Pro`) | ~\$0.001 – \$0.005 per CSV statement |
| **Amazon Textract** | Scene 3 OCR Bill & Receipt Line-Item Scanner ([`/api/ocr/scan`](./src/app/api/ocr/scan/route.ts)) | `Textract.AnalyzeExpense` (`x-amz-target`) | Free tier: 1,000 pages/mo (then \$0.01/page) |
| **Amazon S3** | Raw CSV Statement & Receipt Image Archival with SHA-256 integrity hash | `PUT /{objectKey}` (`statements/...`, `receipts/...`) | < \$0.05/month |
| **Amazon DynamoDB** | Cloud Vault Ledger Persistence across all 16+ screens ([`/api/aws/sync`](./src/app/api/aws/sync/route.ts)) | `DynamoDB_20120810.PutItem` (Partition Key: `PK`) | On-Demand Free Tier / pennies per month |

---

## 2. Option A: One-Command AWS CLI Provisioning (Fastest)

If you have the [AWS CLI](https://aws.amazon.com/cli/) installed and authenticated (`aws configure`), run the commands below to provision your S3 bucket and DynamoDB table in **Mumbai (`ap-south-1`)** (or `us-east-1`):

```bash
# 1. Set your preferred region and unique S3 bucket name
export AWS_REGION="ap-south-1"
export FINSHIELD_BUCKET="finshield-vault-artifacts-$(whoami)-$(date +%s)"
export FINSHIELD_TABLE="FinShieldLedger"

# 2. Create the S3 Bucket for CSV Statements & OCR Receipts
aws s3api create-bucket \
  --bucket "$FINSHIELD_BUCKET" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"

# Block public access on the S3 bucket (FinShield uses signed SigV4 requests)
aws s3api put-public-access-block \
  --bucket "$FINSHIELD_BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 3. Create the Serverless DynamoDB Table (Partition Key: PK [String], PAY_PER_REQUEST)
aws dynamodb create-table \
  --table-name "$FINSHIELD_TABLE" \
  --attribute-definitions AttributeName=PK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$AWS_REGION"

echo "Provisioned S3 Bucket: $FINSHIELD_BUCKET"
echo "Provisioned DynamoDB Table: $FINSHIELD_TABLE"
```

> **Note for `us-east-1`:** If you use `AWS_REGION="us-east-1"`, omit `--create-bucket-configuration LocationConstraint="$AWS_REGION"` from the `create-bucket` command.

---

## 3. Option B: Step-by-Step AWS Console Setup

### Step 1: Enable Foundation Models in Amazon Bedrock
1. Open the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/).
2. Select your region in the top-right corner (`ap-south-1` Mumbai or `us-east-1` N. Virginia).
3. In the left sidebar, go to **Bedrock configurations → Model access** (in newer AWS accounts, serverless foundation models like **Amazon Nova Lite** `amazon.nova-lite-v1:0` and **Anthropic Claude 3.5 Haiku** `anthropic.claude-3-5-haiku-20241022-v1:0` are automatically enabled on first invocation; for Claude models, submit the quick use-case form if prompted).
4. Supported Model IDs out-of-the-box in FinShield:
   - `anthropic.claude-3-5-haiku-20241022-v1:0` *(Default — fast & cost-efficient)*
   - `anthropic.claude-3-5-sonnet-20241022-v2:0` *(Deep reasoning)*
   - `amazon.nova-lite-v1:0` *(No form required, instant activation)*
   - `amazon.nova-pro-v1:0`

### Step 2: Create the S3 Bucket
1. Open the [Amazon S3 Console](https://s3.console.aws.amazon.com/s3/) and click **Create bucket**.
2. **Bucket name**: e.g., `finshield-vault-artifacts-yourname` (must be globally unique).
3. **AWS Region**: `Asia Pacific (Mumbai) ap-south-1` (must match your `AWS_REGION`).
4. Keep **Block all public access** checked (FinShield signs every `PUT` request server-side via AWS Signature V4).
5. Click **Create bucket**.

### Step 3: Create the DynamoDB Table
1. Open the [Amazon DynamoDB Console](https://console.aws.amazon.com/dynamodbv2/) and click **Create table**.
2. **Table name**: `FinShieldLedger`
3. **Partition key**: `PK` (Type: **String**) — *Case-sensitive! Must be uppercase `PK`.*
4. **Sort key**: Leave blank.
5. **Table settings**: Select **Customize settings** → **Capacity mode: On-demand** (Pay-per-request, no idle hourly cost).
6. Click **Create table**.

### Step 4: Create a Least-Privilege IAM User & Access Keys
1. Open the [IAM Console → Users](https://console.aws.amazon.com/iam/home#/users) and click **Create user**.
2. **User name**: `finshield-vercel-runtime`
3. Choose **Attach policies directly** → **Create policy** → switch to the **JSON** editor and paste the least-privilege policy below:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FinShieldBedrockInference",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    },
    {
      "Sid": "FinShieldTextractOCR",
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeExpense",
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    },
    {
      "Sid": "FinShieldS3ArtifactVault",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::finshield-vault-artifacts*",
        "arn:aws:s3:::finshield-vault-artifacts*/*"
      ]
    },
    {
      "Sid": "FinShieldDynamoDBLedger",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/FinShieldLedger"
    }
  ]
}
```

4. Name the policy `FinShieldRuntimePolicy`, attach it to the user, then open the user's **Security credentials** tab → **Create access key** → select **Application running outside AWS** → copy your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

---

## 4. Configuring FinShield (Local `.env.local` or In-App UI)

### Method 1: Local `.env.local` File
Create a `.env.local` file in `/home/akinchan/Documents/Projects/FinProj/.env.local`:

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Optional: Only needed if using temporary AWS STS / SSO credentials
# AWS_SESSION_TOKEN=AQoDYXdzEJr...

AWS_S3_BUCKET=finshield-vault-artifacts-yourname
AWS_DYNAMODB_TABLE=FinShieldLedger
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0
```

### Method 2: In-App Live Configuration (No Restart Needed)
1. Run `npm run dev` and open `http://localhost:3000/settings` (**Scene 12: Profile & Settings**).
2. In the **AWS Cloud Stack ($200 Credit) Configurator** card:
   - Toggle **Enable Live AWS Cloud Calls** ON.
   - Enter your **Region**, **Access Key ID**, **Secret Access Key**, **S3 Bucket Name**, **DynamoDB Table (`FinShieldLedger`)**, and choose your **Bedrock Model ID**.
   - Click **Save & Test AWS Cloud Sync**.
3. The top navigation bar status pill will turn green (`AWS Cloud`) and confirm a live `PutItem` sync to DynamoDB.

---

## 5. Deploying to Vercel

FinShield's AWS client ([`src/lib/aws-cloud.ts`](./src/lib/aws-cloud.ts)) uses native Node.js `crypto` SigV4 signing and `fetch` with zero heavy SDK bundle bloat, making it ideal for Vercel Serverless Functions:

1. Push your repository to GitHub / GitLab / Bitbucket or run `npx vercel`.
2. In your **Vercel Project Dashboard → Settings → Environment Variables**, add:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET`
   - `AWS_DYNAMODB_TABLE`
   - `AWS_BEDROCK_MODEL_ID`
3. Deploy with `npx vercel --prod`.

---

## 6. Cost Protection Tip for Your $200 Credit

To guarantee you never accidentally exceed your \$200 AWS credit:
1. Open [AWS Billing & Cost Management → Budgets](https://console.aws.amazon.com/billing/home#/budgets).
2. Click **Create budget** → **Use a template (Simplified)** → **Monthly cost budget**.
3. Set your budget amount to **\$20.00/month** and enter your email to receive automatic alerts at 50%, 80%, and 100%.
