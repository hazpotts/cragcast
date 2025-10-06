<template>
  <div class="flex items-center gap-2">
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CragCast">
      <defs>
        <linearGradient id="skyGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7dd3fc"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
      <!-- Sky band -->
      <rect x="4" y="8" width="56" height="20" rx="6" fill="url(#skyGrad2)"/>
      <!-- Sun peeking over ridge -->
      <circle cx="48" cy="22" r="6" fill="#facc15"/>
      <!-- Ridge / crag -->
      <path d="M10 44l10-12 6 7 6-11 10 16H10z" fill="#0f172a"/>
      <!-- Cloud in front -->
      <path d="M24 40c-3.5 0-6.5-2.6-6.5-5.8S20.5 28.5 24 28.5c2.39 0 4.47 1.2 5.41 2.93.57-.08 1.17-.13 1.79-.13 3.5 0 6.5 2.6 6.5 5.8S34.7 43.9 31.2 43.9H24z" fill="#e2f2fb"/>
      <!-- Cast arcs -->
      <path d="M8 26c0-5 4.2-9 9.4-9" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 26c0-7.5 6.3-13.5 14-13.5" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <span class="font-semibold text-lg">CragCast</span>
  </div>
</template>
<script setup lang="ts">
// Logo only
</script>
