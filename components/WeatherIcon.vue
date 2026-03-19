<template>
  <TapTooltip :text="tooltipText">
    <img :src="src" :alt="label" :class="imgClass" />
  </TapTooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TapTooltip from '~/components/TapTooltip.vue'

const props = defineProps<{
  src: string
  label: string
  date?: string
  imgClass?: string
}>()

const tooltipText = computed(() =>
  props.date ? `${props.label} – ${props.date}` : props.label
)
</script>
