<template>
  <div :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        msg.role === 'user'
          ? 'bg-sky-700 text-white dark:bg-sky-600'
          : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
      ]"
    >
      <!-- Tool call indicators -->
      <div v-if="msg.toolCalls?.length" class="mb-2 space-y-1">
        <div
          v-for="(tool, i) in msg.toolCalls"
          :key="i"
          class="flex items-center gap-1.5 text-xs opacity-70"
        >
          <span class="inline-block h-3 w-3 animate-pulse rounded-full bg-current opacity-50" />
          {{ tool }}…
        </div>
      </div>

      <!-- Message content -->
      <div v-if="msg.content" class="whitespace-pre-wrap break-words">{{ msg.content }}</div>

      <!-- Streaming indicator -->
      <span
        v-if="msg.streaming && !msg.content"
        class="inline-block h-4 w-1.5 animate-pulse rounded bg-current opacity-40"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMsg } from '~/composables/useChat'
defineProps<{ msg: ChatMsg }>()
</script>
