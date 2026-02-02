/**
 * CragCast Cache Warmer - Cloudflare Worker with Cron Trigger
 * 
 * Runs every 2 hours to keep the weather cache warm.
 * Deploy separately from the main Pages app.
 * 
 * Setup:
 * 1. cd worker-cron
 * 2. wrangler login
 * 3. wrangler secret put WARM_SECRET (set to match Pages env)
 * 4. wrangler deploy
 */

export interface Env {
  CRAGCAST_URL: string;
  WARM_SECRET?: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const url = `${env.CRAGCAST_URL}/api/warm`;
    
    console.log(`[cron] Warming cache at ${new Date().toISOString()}`);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (env.WARM_SECRET) {
        headers['x-warm-secret'] = env.WARM_SECRET;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json() as { ok: boolean; elapsed: number; success: number; failed: number };
      console.log(`[cron] Cache warmed: ${result.success} regions in ${result.elapsed}ms, ${result.failed} failed`);
    } catch (error) {
      console.error(`[cron] Cache warming failed:`, error);
      throw error; // Re-throw so Cloudflare marks the cron as failed
    }
  },

  // Also allow manual trigger via HTTP for testing
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('POST to trigger cache warming', { status: 405 });
    }
    
    const url = `${env.CRAGCAST_URL}/api/warm`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (env.WARM_SECRET) {
      headers['x-warm-secret'] = env.WARM_SECRET;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });
    
    const result = await response.json();
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
