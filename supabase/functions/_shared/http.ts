// Shared HTTP utilities for edge functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const okHeaders = {
  'Content-Type': 'application/json',
  ...corsHeaders,
};

export const errHeaders = {
  'Content-Type': 'application/json',
  ...corsHeaders,
};

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export const errorJson = (e: unknown): ErrorResponse => {
  const err = e as any;
  return {
    error: {
      code: err?.code ?? err?.status ?? 'ERR',
      message: err?.message ?? String(e),
    },
  };
};

export const handleCors = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
};

/**
 * Validates webhook signature using HMAC-SHA256
 * @param payload - The raw request body
 * @param signature - The signature from X-Webhook-Signature header
 * @param secret - The webhook secret
 * @returns true if signature is valid
 */
export async function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}
