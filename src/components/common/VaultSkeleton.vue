<template>
  <div class="vault-skeleton" :class="`vault-skeleton--${variant}`" aria-label="Carregando">
    <template v-if="variant === 'avatar'">
      <span class="skeleton-block skeleton-avatar" />
      <span class="skeleton-copy">
        <span class="skeleton-block line avatar-line-one" />
        <span class="skeleton-block line avatar-line-two" />
      </span>
    </template>

    <template v-else-if="variant === 'list'">
      <span v-for="index in 3" :key="index" class="skeleton-list-row">
        <span class="skeleton-block skeleton-square" />
        <span class="skeleton-copy">
          <span class="skeleton-block line list-line-one" />
          <span class="skeleton-block line list-line-two" />
        </span>
        <span class="skeleton-block skeleton-badge" />
      </span>
    </template>

    <template v-else-if="variant === 'kpi'">
      <span class="skeleton-block line kpi-label" />
      <span class="skeleton-block line kpi-value" />
      <span class="skeleton-block line kpi-trend" />
    </template>

    <template v-else>
      <span class="skeleton-block line card-line-one" />
      <span class="skeleton-block line card-line-two" />
      <span class="skeleton-block line card-line-three" />
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'avatar' | 'list' | 'kpi' | 'card'
}>(), {
  variant: 'card',
})
</script>

<style scoped>
.vault-skeleton {
  width: 100%;
  border-radius: 12px;
  padding: 16px;
  background: var(--vault-color-surface);
}

.skeleton-block {
  display: block;
  flex: 0 0 auto;
  border-radius: 4px;
  background: var(--vault-color-border);
  animation: vault-pulse 1.5s ease-in-out infinite;
}

.vault-skeleton--avatar {
  display: flex;
  align-items: center;
}

.skeleton-avatar { width: 48px; height: 48px; border-radius: 50%; }
.skeleton-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; margin-left: 12px; }
.line { height: 12px; }
.avatar-line-one { width: min(200px, 100%); height: 14px; }
.avatar-line-two { width: min(140px, 75%); margin-top: 8px; }

.vault-skeleton--list { display: flex; flex-direction: column; }
.skeleton-list-row { display: flex; align-items: center; margin-bottom: 16px; }
.skeleton-list-row:last-child { margin-bottom: 0; }
.skeleton-square { width: 48px; height: 48px; border-radius: 8px; }
.list-line-one { width: min(160px, 100%); height: 14px; }
.list-line-two { width: min(100px, 70%); margin-top: 6px; }
.skeleton-badge { width: 60px; height: 20px; margin-left: 10px; }

.vault-skeleton--kpi,
.vault-skeleton--card { display: flex; flex-direction: column; }
.kpi-label { width: 80px; height: 11px; }
.kpi-value { width: 120px; height: 28px; margin-top: 8px; }
.kpi-trend { width: 60px; height: 13px; margin-top: 6px; }
.card-line-one { width: 100%; height: 14px; }
.card-line-two { width: 80%; margin-top: 8px; }
.card-line-three { width: 60%; margin-top: 6px; }

@keyframes vault-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
