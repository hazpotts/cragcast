<template>
  <div class="flex gap-3 text-xs text-muted-500">
    <div class="flex items-end gap-0.5 h-10" aria-label="Rain mm">
      <span v-for="(v,i) in rain" :key="i" class="w-1.5 bg-sky-500/70" :style="{ height: `${Math.min(100, v*10)}%` }" />
    </div>
    <div class="flex items-end gap-0.5 h-10" aria-label="Wind mph">
      <span v-for="(v,i) in wind" :key="i" class="w-1.5 bg-emerald-500/70" :style="{ height: `${Math.min(100, v*3)}%` }" />
    </div>
    <div class="flex items-end gap-0.5 h-10" aria-label="Temp C">
      <span v-for="(v,i) in temp" :key="i" class="w-1.5 bg-amber-500/70" :style="{ height: `${Math.min(100, Math.max(0,(v-0)*5))}%` }" />
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ rain: number[]; wind: number[]; temp: number[] }>()
</script>
