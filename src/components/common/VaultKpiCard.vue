<template>
  <div class="kpi-card">
    <span class="kpi-card__label">{{ label }}</span>
    <strong>{{ value }}</strong>
    <span v-if="trend" class="kpi-card__trend" :class="{ negative: !trendPositive }">
      {{ trendPositive ? '↑' : '↓' }} {{ trend }}
    </span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string | number
  trend?: string
  trendPositive?: boolean
}>(), { trend: '', trendPositive: true })
</script>

<style scoped>
.kpi-card { padding: 16px; border-radius: 12px; background: #FFFFFF; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06); }
.kpi-card__label { display: block; color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0; text-transform: uppercase; }
strong { display: block; margin-top: 6px; color: #111827; font-size: 28px; font-weight: 700; letter-spacing: 0; }
.kpi-card__trend { display: block; margin-top: 5px; color: #22C55E; font-size: 13px; font-weight: 400; }
.kpi-card__trend.negative { color: #EF4444; }
</style>
