<template>
  <div class="rounded-md border border-gray-200 dark:border-gray-700 p-4 shadow bg-white dark:bg-gray-900 overflow-hidden">
    <div class="flex gap-4 items-start flex-col sm:flex-row">
      <!-- Left: content -->
      <div class="flex-1 min-w-0 space-y-3">
        <div class="flex items-center justify-between">
          <div class="skeleton h-6 w-48 rounded" />
          <div class="skeleton h-5 w-20 rounded" />
        </div>
        <div class="space-y-2">
          <div class="skeleton h-3 w-4/5 rounded" />
          <div class="skeleton h-3 w-3/4 rounded" />
          <div class="skeleton h-3 w-2/3 rounded" />
        </div>
        <div class="skeleton h-4 w-36 rounded" />
      </div>
      <!-- Right: icons + per-day stats -->
      <div class="w-full sm:w-auto sm:flex-1 flex justify-center">
        <div class="flex flex-wrap gap-2 items-start justify-center sm:justify-end">
          <div class="flex items-center sm:flex-col sm:items-center text-sm text-gray-600 dark:text-gray-300">
            <div class="skeleton h-20 w-20 sm:h-24 sm:w-24 mr-3 sm:mr-0 sm:-mt-4 sm:-mb-3 rounded" />
            <div class="mt-0 sm:mt-1 sm:mb-2 text-left sm:text-center space-y-1">
              <div class="skeleton h-3 w-16 rounded" />
              <div class="skeleton h-3 w-12 rounded" />
              <div class="skeleton h-3 w-14 rounded" />
            </div>
          </div>
          <div class="flex items-center sm:flex-col sm:items-center text-sm text-gray-600 dark:text-gray-300">
            <div class="skeleton h-20 w-20 sm:h-24 sm:w-24 mr-3 sm:mr-0 sm:-mt-4 sm:-mb-3 rounded" />
            <div class="mt-0 sm:mt-1 sm:mb-2 text-left sm:text-center space-y-1">
              <div class="skeleton h-3 w-16 rounded" />
              <div class="skeleton h-3 w-12 rounded" />
              <div class="skeleton h-3 w-14 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Footer: external links bottom-right -->
    <div class="mt-4 flex justify-end">
      <div class="flex flex-wrap items-center gap-2">
        <div class="skeleton h-8 w-16 rounded" />
        <div class="skeleton h-8 w-28 rounded" />
        <div class="skeleton h-8 w-20 rounded" />
        <div class="skeleton h-8 w-14 rounded" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Skeleton only
</script>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
  background-color: rgba(107, 114, 128, 0.2);
}
.dark .skeleton {
  background-color: rgba(55, 65, 81, 0.5);
}
.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
  animation: shimmer 1.4s infinite;
}
.dark .skeleton::after {
  background-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%);
}
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
</style>
