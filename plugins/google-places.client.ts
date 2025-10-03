export default defineNuxtPlugin(() => {
  const cfg = useRuntimeConfig()
  const pub = (cfg as any).public || {}
  const enabled = !!pub.googlePlacesEnabled
  const apiKey: string = pub.googlePlacesApiKey || ''
  if (!enabled || !apiKey) return
  if (typeof window === 'undefined') return
  const id = 'google-places-script'
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`
  s.async = true
  document.head.appendChild(s)
})
