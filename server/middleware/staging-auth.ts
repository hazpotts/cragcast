export default defineEventHandler((event) => {
  // Only enforce basic auth on the staging site
  const host = getRequestHeader(event, 'host') || ''
  const isStaging = host.includes('cragcast-staging.pages.dev')

  if (!isStaging) return

  const auth = getRequestHeader(event, 'authorization')
  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded)
      const [user, pass] = decoded.split(':')
      if (user === 'cragcast' && pass === 'climbingweather') return
    }
  }

  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="CragCast Staging"')
  throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
})
