# Deployment Guide — Vercel

This backend is optimized for deployment as **Vercel Serverless Functions**.

## Steps to Deploy

1.  **Install Vercel CLI** (optional, you can also connect via GitHub):
    ```bash
    npm i -g vercel
    ```

2.  **Deploy**:
    Run this in the root directory:
    ```bash
    vercel
    ```

3.  **Environment Variables**:
    You MUST add these in the Vercel Dashboard (Settings > Environment Variables):
    - `GROQ_API_KEY`
    - `OPENAI_API_KEY`
    - `TWILIO_ACCOUNT_SID`
    - `TWILIO_AUTH_TOKEN`
    - `TWILIO_WHATSAPP_NUMBER`

## Important Limits
- **Payload Limit**: Vercel has a **10MB** limit for incoming requests on the Pro plan (4.5MB on Free).
- **Timeout**: The default timeout is 10s (Free) or 60s (Pro). Since processing audio can take time, ensure you are on a plan that supports the duration of your audio.
