<template>
  <article class="vault-kpi">
    <span class="vault-kpi__label">{{ label }}</span>
    <strong class="vault-kpi__value">{{ value }}</strong>
    <span v-if="trend" class="vault-kpi__trend" :class="trendPositive ? 'is-positive' : 'is-negative'">
      {{ trendPositive ? '↑' : '↓' }} {{ trend }}
    </span>
  </article>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string | number
  trend?: string
  trendPositive?: boolean
}>(), {
  trend: '',
  trendPositive: true,
})
</script>

<style scoped>
.vault-kpi {
  border-radius: 12px;
  padding: 16px;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  font-family: var(--vault-font-family);
}

.vault-kpi__label {
  display: block;
  color: #9CA3AF;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.vault-kpi__value {
  display: block;
  margin-top: 4px;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
}

.vault-kpi__trend {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 400;
}

.is-positive { color: #22C55E; }
.is-negative { color: #EF4444; }
</style>
