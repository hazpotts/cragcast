<template>
  <div class="flex flex-wrap items-center gap-3 text-xs">
    <div class="flex items-center gap-1">
      <span class="text-gray-500">Temp:</span>
      <UButtonGroup size="2xs">
        <UButton :color="units.tempUnit.value === 'C' ? 'primary' : 'gray'" label="°C" @click="units.tempUnit.value = 'C'" />
        <UButton :color="units.tempUnit.value === 'F' ? 'primary' : 'gray'" label="°F" @click="units.tempUnit.value = 'F'" />
      </UButtonGroup>
    </div>
    <div class="flex items-center gap-1">
      <span class="text-gray-500">Wind:</span>
      <UButtonGroup size="2xs">
        <UButton :color="units.windUnit.value === 'mph' ? 'primary' : 'gray'" label="mph" @click="units.windUnit.value = 'mph'" />
        <UButton :color="units.windUnit.value === 'kmh' ? 'primary' : 'gray'" label="km/h" @click="units.windUnit.value = 'kmh'" />
        <UButton :color="units.windUnit.value === 'knots' ? 'primary' : 'gray'" label="kn" @click="units.windUnit.value = 'knots'" />
      </UButtonGroup>
    </div>
    <div class="flex items-center gap-1">
      <span class="text-gray-500">Rain:</span>
      <UButtonGroup size="2xs">
        <UButton :color="units.rainUnit.value === 'mm' ? 'primary' : 'gray'" label="mm" @click="units.rainUnit.value = 'mm'" />
        <UButton :color="units.rainUnit.value === 'in' ? 'primary' : 'gray'" label="in" @click="units.rainUnit.value = 'in'" />
      </UButtonGroup>
    </div>
    <div class="flex items-center gap-1">
      <span class="text-gray-500">Dist:</span>
      <UButtonGroup size="2xs">
        <UButton :color="units.distanceUnit.value === 'mins' ? 'primary' : 'gray'" label="mins" @click="units.distanceUnit.value = 'mins'" />
        <UButton :color="units.distanceUnit.value === 'miles' ? 'primary' : 'gray'" label="mi" @click="units.distanceUnit.value = 'miles'" />
        <UButton :color="units.distanceUnit.value === 'km' ? 'primary' : 'gray'" label="km" @click="units.distanceUnit.value = 'km'" />
      </UButtonGroup>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useUnits } from '~/composables/useUnits'
const units = useUnits()
</script>
