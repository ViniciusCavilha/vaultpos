<template>
  <span class="vault-badge" :class="`vault-badge--${variant}`">{{ label }}</span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'sucesso' | 'atencao' | 'erro' | 'info' | 'neutro'
  label: string
}>(), {
  variant: 'neutro',
})
</script>

<style scoped>
.vault-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--vault-color-border);
  border-radius: 6px;
  padding: 3px 8px;
  background: var(--vault-color-surface-muted);
  color: var(--vault-color-text-2);
  font-family: var(--vault-font-family);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  line-height: 1.2;
  text-transform: uppercase;
}

.vault-badge--sucesso { border-color: #86EFAC; background: #DCFCE7; color: #16A34A; }
.vault-badge--atencao { border-color: #FCD34D; background: var(--vault-color-warning-soft); color: #D97706; }
.vault-badge--erro { border-color: #FCA5A5; background: var(--vault-color-error-soft); color: #DC2626; }
.vault-badge--info { border-color: #7DD3FC; background: var(--vault-color-info-soft); color: #0284C7; }
</style>
