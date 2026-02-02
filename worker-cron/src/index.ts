/**
 * CragCast Cache Warmer - Cloudflare Worker with Cron Trigger
 * 
 * Runs every 2 hours to keep the weather cache warm.
 * Deployed alongside the main Pages app via GitHub Actions.
 */

export interface Env {
  CRAGCAST_URL: string;
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
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json() as { ok: boolean; elapsed: number; success: number; failed: number };
      console.log(`[cron] Cache warmed: ${result.success} regions in ${result.elapsed}ms, ${result.failed} failed`);
    } catch (error) {
      console.error(`[cron] Cache warming failed:`, error);
      throw error;
    }
  },

  // Allow manual trigger via HTTP for testing
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('POST to trigger cache warming', { status: 405 });
    }
    
    const url = `${env.CRAGCAST_URL}/api/warm`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const result = await response.json();
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
