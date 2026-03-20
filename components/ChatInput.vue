<template>
  <form @submit.prevent="submit" class="flex gap-2">
    <UInput
      ref="inputRef"
      v-model="text"
      :disabled="disabled"
      placeholder="Ask about climbing conditions…"
      class="flex-1"
      size="lg"
      autofocus
      @keydown.enter.exact.prevent="submit"
    />
    <UButton
      type="submit"
      :disabled="disabled || !text.trim()"
      icon="i-heroicons-paper-airplane"
      size="lg"
      color="sky"
      :ui="{ rounded: 'rounded-xl' }"
    />
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [text: string] }>()

const text = ref('')
const inputRef = ref<any>(null)

function submit() {
  if (!text.value.trim() || props.disabled) return
  emit('send', text.value)
  text.value = ''
}

defineExpose({ focus: () => inputRef.value?.$el?.querySelector('input')?.focus() })
</script>
