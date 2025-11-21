/**
 * Structured logging utility with optional Axiom integration
 * Falls back to console logging if Axiom is not configured
 */

interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: string
  [key: string]: any
}

async function sendToAxiom(event: any, logEvent: LogEvent) {
  const env = event?.platform?.env || event?.context?.cloudflare?.env || {}
  const token = env.AXIOM_TOKEN
  const dataset = env.AXIOM_DATASET || 'cragcast-logs'

  if (!token) {
    // No Axiom configured, skip
    return
  }

  try {
    await fetch(`https://api.axiom.co/v1/datasets/${dataset}/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([logEvent])
    })
  } catch (err) {
    // Don't throw - logging failures shouldn't break the app
    console.error('[logger] Failed to send to Axiom:', err)
  }
}

export function createLogger(event: any, context: Record<string, any> = {}) {
  const log = async (level: LogEvent['level'], message: string, data: Record<string, any> = {}) => {
    const logEvent: LogEvent = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
      ...data
    }

    // Always log to console
    const consoleMethod = level === 'debug' ? console.debug : console[level]
    consoleMethod(`[${context.service || 'app'}] ${message}`, data)

    // Also send to Axiom if configured (non-blocking)
    if (level !== 'debug') {
      // Skip debug logs for Axiom to save quota
      sendToAxiom(event, logEvent).catch(() => {}) // Fire and forget
    }
  }

  return {
    debug: (message: string, data?: Record<string, any>) => log('debug', message, data),
    info: (message: string, data?: Record<string, any>) => log('info', message, data),
    warn: (message: string, data?: Record<string, any>) => log('warn', message, data),
    error: (message: string, data?: Record<string, any>) => log('error', message, data)
  }
}
