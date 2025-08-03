# Edge Functions Deployment Guide

## 🚀 Available Edge Functions

### 1. **auth-sync-user** 
- **Purpose**: Sync Clerk users with Supabase database
- **Endpoint**: `/functions/v1/auth-sync-user`
- **Methods**: POST (webhook), POST (manual sync)

### 2. **profile-create**
- **Purpose**: Create detailed Islamic matrimonial profiles
- **Endpoint**: `/functions/v1/profile-create`
- **Methods**: POST

### 3. **profile-update**
- **Purpose**: Update user profile information
- **Endpoint**: `/functions/v1/profile-update`
- **Methods**: POST

### 4. **matches-generate**
- **Purpose**: AI-powered Islamic matrimonial matching
- **Endpoint**: `/functions/v1/matches-generate`
- **Methods**: POST

### 5. **messages-send**
- **Purpose**: Send messages with Islamic moderation
- **Endpoint**: `/functions/v1/messages-send`
- **Methods**: POST

## 📋 Deployment Methods

### Method A: Via Supabase Dashboard (Recommended)
1. Go to **https://supabase.com/dashboard**
2. Open your project: **`dvydbgjoagrzgpqdhqoq`**
3. Navigate to **Edge Functions** in sidebar
4. Click **"New Function"** for each function
5. Copy the TypeScript code from each `index.ts` file
6. Deploy each function

### Method B: Via Supabase CLI
```bash
# Deploy all functions at once
npx supabase functions deploy auth-sync-user
npx supabase functions deploy profile-create
npx supabase functions deploy profile-update
npx supabase functions deploy matches-generate
npx supabase functions deploy messages-send
```

### Method C: Individual Function Upload
For each function folder, upload the contents to Supabase:
- Copy `index.ts` content
- Set up the `deno.json` configuration
- Deploy via dashboard interface

## 🔧 Environment Variables Required

The edge functions need these environment variables set in Supabase:
```bash
SUPABASE_URL=https://dvydbgjoagrzgpqdhqoq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_key_here  # For AI matching
```

## 🧪 Testing Edge Functions

Once deployed, test with:
```bash
# Test auth sync
curl -X POST https://dvydbgjoagrzgpqdhqoq.supabase.co/functions/v1/auth-sync-user \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","email":"test@example.com"}'

# Test profile creation
curl -X POST https://dvydbgjoagrzgpqdhqoq.supabase.co/functions/v1/profile-create \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","basicInfo":{"age":30,"gender":"male"}}'
```

## ✅ Success Indicators
- Functions appear in Supabase dashboard
- Test calls return successful responses
- No deployment errors in logs
- API client can call functions successfully

## 🔄 Next Steps After Deployment
1. Update API client to use deployed function URLs
2. Test full authentication flow
3. Verify Clerk webhook integration
4. Test Islamic matrimonial features
5. Monitor function performance and logs