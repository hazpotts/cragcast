/**
 * CragCast Worker - Cloudflare Worker with Cron Triggers
 *
 * - Cache warming: every 2 hours, keeps weather forecasts fresh
 * - Crag import: weekly, imports latest crag data from OpenBeta into D1
 *
 * Deployed alongside the main Pages app via GitHub Actions.
 */

export interface Env {
  CRAGCAST_URL: string;
  ADMIN_API_KEY?: string;
}

async function warmCache(env: Env): Promise<{ success: number; failed: number; elapsed: number }> {
  const url = `${env.CRAGCAST_URL}/api/warm`;

  console.log(`[cron] Warming cache at ${new Date().toISOString()}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json() as { success: number; failed: number; elapsed: number };
}

async function importCrags(env: Env): Promise<{ imported: number; updated: number; errors: string[] }> {
  const url = `${env.CRAGCAST_URL}/api/admin/import-crags`;

  console.log(`[cron] Starting crag import at ${new Date().toISOString()}`);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.ADMIN_API_KEY) {
    headers['Authorization'] = `Bearer ${env.ADMIN_API_KEY}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Import HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json() as { imported: number; updated: number; errors: string[] };
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Determine which task to run based on the cron schedule
    const cron = controller.cron;

    if (cron === '0 3 * * 1') {
      // Weekly import: Monday at 03:00 UTC
      try {
        const result = await importCrags(env);
        console.log(`[cron] Import complete: ${result.imported} new, ${result.updated} updated, ${result.errors.length} errors`);
      } catch (error) {
        console.error(`[cron] Crag import failed:`, error);
        throw error;
      }
    } else {
      // Default: cache warming (every 2 hours)
      try {
        const result = await warmCache(env);
        console.log(`[cron] Cache warmed: ${result.success} regions in ${result.elapsed}ms, ${result.failed} failed`);
      } catch (error) {
        console.error(`[cron] Cache warming failed:`, error);
        throw error;
      }
    }
  },

  // Allow manual trigger via HTTP for testing
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('POST to trigger cache warming or import. Use ?action=import for crag import.', { status: 405 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'import') {
      try {
        const result = await importCrags(env);
        return new Response(JSON.stringify(result, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Default: cache warming
    try {
      const result = await warmCache(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
