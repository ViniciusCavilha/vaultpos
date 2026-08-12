<template>
  <div class="skeleton" :class="'skeleton--' + variant" aria-label="Carregando">
    <template v-if="variant === 'avatar'">
      <span class="shape avatar"></span>
      <span class="lines"><span class="shape line long"></span><span class="shape line medium"></span></span>
    </template>
    <template v-else-if="variant === 'list'">
      <span v-for="item in 3" :key="item" class="list-item">
        <span class="shape square"></span>
        <span class="lines"><span class="shape line list-long"></span><span class="shape line short"></span></span>
        <span class="shape badge"></span>
      </span>
    </template>
    <template v-else-if="variant === 'kpi'">
      <span class="shape line label"></span><span class="shape line value"></span><span class="shape line trend"></span>
    </template>
    <template v-else>
      <span class="shape line full"></span><span class="shape line eighty"></span><span class="shape line sixty"></span>
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'avatar' | 'list' | 'kpi' | 'card' }>(), { variant: 'card' })
</script>

<style scoped>
.skeleton, .list-item, .lines { display: flex; }
.skeleton--avatar, .list-item { align-items: center; gap: 12px; }
.skeleton--list, .skeleton--kpi, .skeleton--card, .lines { flex-direction: column; }
.shape { display: block; flex: 0 0 auto; border-radius: 4px; background: #E5E7EB; animation: pulse 1.5s ease-in-out infinite; }
.avatar { width: 48px; height: 48px; border-radius: 50%; }
.lines { flex: 1; gap: 8px; }
.line { height: 12px; }
.long { width: min(200px, 100%); height: 14px; }
.medium { width: min(140px, 75%); }
.list-item { width: 100%; margin-bottom: 16px; }
.square { width: 48px; height: 48px; border-radius: 8px; }
.list-long { width: min(160px, 100%); height: 14px; }
.short { width: min(100px, 70%); }
.badge { width: 60px; height: 20px; }
.label { width: 80px; height: 11px; }
.value { width: 120px; height: 28px; margin-top: 8px; }
.trend { width: 60px; height: 13px; margin-top: 6px; }
.full { width: 100%; height: 14px; }
.eighty { width: 80%; margin-top: 8px; }
.sixty { width: 60%; margin-top: 6px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
