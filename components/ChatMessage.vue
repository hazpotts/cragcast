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

      <!-- Message content (rendered as markdown for assistant messages) -->
      <div v-if="msg.content && msg.role === 'assistant'" class="prose-chat break-words" v-html="renderMarkdown(msg.content)" />
      <div v-else-if="msg.content" class="whitespace-pre-wrap break-words">{{ msg.content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMsg } from '~/composables/useChat'
defineProps<{ msg: ChatMsg }>()

/**
 * Lightweight markdown renderer for chat messages.
 * Handles: **bold**, *italic*, `code`, line breaks, bullet lists, headings.
 * No external dependencies.
 */
function renderMarkdown(text: string): string {
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headings (### or ##) — only at start of line
  html = html.replace(/^### (.+)$/gm, '<h4 class="font-semibold mt-3 mb-1">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic *text* (but not list markers like "* item")
  html = html.replace(/(?<!\n)\*([^\n*]+?)\*/g, '<em>$1</em>')

  // Inline code `text`
  html = html.replace(/`(.+?)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">$1</code>')

  // Bullet lists (- item at start of line)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="my-2 ml-4 list-disc space-y-1">$1</ul>')

  // Paragraphs: convert double newlines to paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p class="mt-2">')

  // Single newlines to <br> (within paragraphs)
  html = html.replace(/\n/g, '<br>')

  // Wrap in paragraph
  html = `<p>${html}</p>`

  // Clean up empty paragraphs and whitespace-only paragraphs
  html = html.replace(/<p>(\s|<br>)*<\/p>/g, '')

  return html
}
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
