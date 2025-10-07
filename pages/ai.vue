<template>
  <div class="container max-w-3xl mx-auto p-4 space-y-4">
    <h1 class="text-2xl font-semibold">AI climbing suggestions</h1>

    <p class="text-sm text-gray-600 dark:text-gray-400">Ask for climbing spot suggestions based on your preferences and the forecast. Kept strictly to climbing and weather for safety.</p>

    <div class="space-y-3">
      <label class="block text-sm font-medium">Prompt</label>
      <UTextarea v-model="prompt" :rows="4" placeholder="E.g. Recommend the best sport crags for Saturday around the Peak with low rain and light winds" />
      <div class="flex items-center gap-2 text-sm">
        <UToggle v-model="useFilters" />
        <span>Use my current filters (dates, location, max drive)</span>
      </div>
      <div class="flex items-center gap-2">
        <UButton :loading="pending" :disabled="!canSubmit" @click="onAsk"
          class="px-6 py-2 bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400">
          Suggest
        </UButton>
        <span v-if="error" class="text-sm text-red-500">{{ error }}</span>
      </div>
    </div>

    <div v-if="pending" class="space-y-3">
      <div class="skeleton h-5 w-40 rounded" />
      <div class="skeleton h-3 w-4/5 rounded" />
      <div class="skeleton h-3 w-2/3 rounded" />
    </div>

    <div v-if="result" class="space-y-4">
      <h2 class="text-xl font-semibold">Suggestions</h2>
      <div class="prose dark:prose-invert max-w-none" v-html="result.html"></div>
      <div class="text-xs text-gray-500">Sources: BBC/Met Office/Windy, MWIS, UKC</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useAISuggest } from '~/composables/useAI'

const prefs = usePrefs()
const prompt = ref('')
const useFilters = ref(true)
const pending = ref(false)
const error = ref('')
const result = ref<{ html: string } | null>(null)

const canSubmit = computed(() => prompt.value.trim().length >= 8 && !pending.value)

async function onAsk() {
  error.value = ''
  result.value = null
  if (!canSubmit.value) return
  pending.value = true
  try {
    const payload: any = { prompt: prompt.value }
    if (useFilters.value) {
      payload.prefs = {
        dates: (prefs.dates.value || []),
        where: prefs.where.value || null,
        maxDriveMins: prefs.maxDriveMins.value
      }
    }
    const out = await useAISuggest(payload)
    result.value = out
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Something went wrong'
  } finally {
    pending.value = false
  }
}
</script>

<style scoped>
.skeleton { position: relative; overflow: hidden; background-color: rgba(107,114,128,.2); }
.dark .skeleton { background-color: rgba(55,65,81,.5); }
.skeleton::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.4) 50%, rgba(255,255,255,0) 100%); animation: shimmer 1.4s infinite; }
.dark .skeleton::after { background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.15) 50%, rgba(255,255,255,0) 100%); }
@keyframes shimmer { 100% { transform: translateX(100%); } }
</style>
