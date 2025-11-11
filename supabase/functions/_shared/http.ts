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
