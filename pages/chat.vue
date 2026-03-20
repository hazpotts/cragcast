<template>
  <div class="flex flex-col h-[calc(100dvh-8rem)] max-w-[640px] mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between px-2 py-3">
      <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-200">CragCast AI</h1>
      <UButton
        v-if="messages.length"
        variant="ghost"
        size="xs"
        icon="i-heroicons-arrow-path"
        label="Clear"
        @click="clearMessages"
      />
    </div>

    <!-- Messages area -->
    <div ref="scrollContainer" class="flex-1 overflow-y-auto px-2 space-y-3 pb-4">
      <!-- Empty state with suggested prompts -->
      <div v-if="!messages.length" class="flex flex-col items-center justify-center h-full text-center px-4">
        <div class="text-4xl mb-4">&#9968;</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Ask me about climbing conditions, crag recommendations, or mountain weather anywhere in the UK.
        </p>
        <div class="grid gap-2 w-full max-w-sm">
          <button
            v-for="prompt in suggestedPrompts"
            :key="prompt"
            @click="sendMessage(prompt)"
            class="text-left text-sm px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <!-- Chat messages -->
      <ChatMessage v-for="msg in messages" :key="msg.id" :msg="msg" />
    </div>

    <!-- Input -->
    <div class="px-2 py-3 border-t border-gray-200 dark:border-gray-800">
      <ChatInput :disabled="isStreaming" @send="sendMessage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChat } from '~/composables/useChat'
import ChatMessage from '~/components/ChatMessage.vue'
import ChatInput from '~/components/ChatInput.vue'

const { messages, isStreaming, sendMessage, clearMessages } = useChat()

const scrollContainer = ref<HTMLElement | null>(null)

const suggestedPrompts = [
  'Where should I climb this weekend?',
  'What are the best gritstone crags tomorrow?',
  'Is Stanage going to be dry on Saturday?',
  'What\'s the mountain weather like in Snowdonia?'
]

// Auto-scroll to bottom when messages update
watch(messages, () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>
