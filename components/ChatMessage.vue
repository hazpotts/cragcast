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
      <!-- Thinking / loading phrase -->
      <div
        v-if="msg.streaming && !msg.content && msg.thinkingPhrase"
        class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 italic"
      >
        <span class="thinking-dots flex gap-0.5">
          <span class="dot" />
          <span class="dot" />
          <span class="dot" />
        </span>
        <span class="transition-opacity duration-300">{{ msg.thinkingPhrase }}</span>
      </div>

      <!-- Tool call indicators -->
      <div v-if="msg.toolCalls?.length" class="space-y-1" :class="{ 'mb-2': msg.content }">
        <div
          v-for="(tool, i) in msg.toolCalls"
          :key="i"
          class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
        >
          <span class="inline-block h-2.5 w-2.5 rounded-full bg-sky-400 dark:bg-sky-500" :class="{ 'animate-pulse': msg.streaming }" />
          {{ tool }}
        </div>
      </div>

      <!-- Message content -->
      <div v-if="msg.content" class="whitespace-pre-wrap break-words">{{ msg.content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMsg } from '~/composables/useChat'
defineProps<{ msg: ChatMsg }>()
</script>

<style scoped>
.thinking-dots .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
  animation: bounce 1.4s ease-in-out infinite;
}
.thinking-dots .dot:nth-child(2) { animation-delay: 0.16s; }
.thinking-dots .dot:nth-child(3) { animation-delay: 0.32s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-4px); opacity: 1; }
}
</style>
