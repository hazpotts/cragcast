<template>
  <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:2rem;text-align:center;">
    <img :src="logoUrl" alt="CragCast" style="height:3rem;margin-bottom:1rem;" />
    <h1 style="font-size:1.5rem;font-weight:600;color:#0369a1;margin:0 0 0.5rem;">{{ error?.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}</h1>
    <p style="color:#6b7280;margin:0 0 1.5rem;">{{ error?.statusCode === 404 ? 'This page doesn\'t exist or has moved.' : 'An unexpected error occurred.' }}</p>
    <a href="/" style="display:inline-block;padding:0.5rem 1.5rem;background:#0284c7;color:#fff;border-radius:0.375rem;text-decoration:none;font-weight:500;">Go to CragCast</a>
  </div>
</template>
<script setup lang="ts">
import logoUrl from '~/assets/images/logo_64.webp?url'
const props = defineProps<{ error: { statusCode: number; message: string } | null }>()
const { error } = toRefs(props)
</script>
