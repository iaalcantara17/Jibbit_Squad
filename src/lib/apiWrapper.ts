// UC-117: Shared API wrapper that logs all external API calls
import { supabase } from '@/integrations/supabase/client';

interface ApiCallOptions {
  serviceName: string;
  endpoint: string;
  method?: string;
  timeout?: number;
}

interface ApiCallResult<T> {
  data: T | null;
  error: string | null;
  responseTime: number;
  status: number;
}

// Rate limit thresholds (our own limits, not provider limits)
const SERVICE_LIMITS: Record<string, number> = {
  github: 60,
  gmail: 100,
  geocoding: 500,
  salary: 200,
  ai: 1000,
};

export async function logApiCall(
  serviceName: string,
  endpoint: string,
  responseStatus: number,
  responseTimeMs: number,
  errorMessage?: string
) {
  try {
    await supabase.from('api_usage_logs').insert({
      api_name: serviceName,
      endpoint,
      response_status: responseStatus,
      response_time_ms: responseTimeMs,
      error_message: errorMessage || null,
    });

    // Update rate limit tracking
    const { data: rateLimit } = await supabase
      .from('api_rate_limits')
      .select('*')
      .eq('api_name', serviceName)
      .single();

    if (rateLimit) {
      await supabase
        .from('api_rate_limits')
        .update({
          current_usage: rateLimit.current_usage + 1,
          average_response_ms: Math.round(
            ((rateLimit.average_response_ms || 0) + responseTimeMs) / 2
          ),
          last_error: errorMessage || rateLimit.last_error,
          last_error_at: errorMessage ? new Date().toISOString() : rateLimit.last_error_at,
        })
        .eq('api_name', serviceName);
    }
  } catch (err) {
    console.warn('Failed to log API call:', err);
  }
}

export async function wrappedFetch<T>(
  url: string,
  options: RequestInit & ApiCallOptions
): Promise<ApiCallResult<T>> {
  const { serviceName, endpoint, timeout = 30000, ...fetchOptions } = options;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    let data: T | null = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    const errorMessage = response.ok ? undefined : `HTTP ${response.status}`;

    await logApiCall(serviceName, endpoint, response.status, responseTime, errorMessage);

    return {
      data,
      error: response.ok ? null : errorMessage || 'Request failed',
      responseTime,
      status: response.status,
    };
  } catch (err) {
    const responseTime = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    await logApiCall(serviceName, endpoint, 0, responseTime, errorMessage);

    return {
      data: null,
      error: errorMessage,
      responseTime,
      status: 0,
    };
  }
}

export async function checkRateLimit(serviceName: string): Promise<{
  allowed: boolean;
  usage: number;
  limit: number;
  percentUsed: number;
}> {
  const limit = SERVICE_LIMITS[serviceName] || 100;

  try {
    const { data: rateLimit } = await supabase
      .from('api_rate_limits')
      .select('current_usage')
      .eq('api_name', serviceName)
      .single();

    const usage = rateLimit?.current_usage || 0;
    const percentUsed = (usage / limit) * 100;

    return {
      allowed: usage < limit,
      usage,
      limit,
      percentUsed,
    };
  } catch {
    return { allowed: true, usage: 0, limit, percentUsed: 0 };
  }
}

export async function initializeRateLimits() {
  const services = Object.keys(SERVICE_LIMITS);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  for (const service of services) {
    const { data } = await supabase
      .from('api_rate_limits')
      .select('id')
      .eq('api_name', service)
      .single();

    if (!data) {
      await supabase.from('api_rate_limits').insert({
        api_name: service,
        daily_limit: SERVICE_LIMITS[service],
        current_usage: 0,
        reset_at: tomorrow.toISOString(),
      });
    }
  }
}
