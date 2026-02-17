<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  sub: string;
  iconClass?: string;
}>();
</script>

<template>
  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
    <div :class="['p-3 bg-gray-50 rounded-xl text-gray-700', iconClass]">
      <slot name="icon" />
    </div>
    <div>
      <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
        {{ label }}
      </p>
      <p class="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">
        {{ value }}
      </p>
      <p class="text-[10px] text-gray-400 font-bold italic">{{ sub }}</p>
    </div>
  </div>
</template>
