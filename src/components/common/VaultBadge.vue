<template>
  <span class="vault-badge" :class="'vault-badge--' + variant">{{ label }}</span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'sucesso' | 'atencao' | 'erro' | 'info' | 'neutro'
  label: string
}>(), { variant: 'neutro' })
</script>

<style scoped>
.vault-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0;
  text-transform: uppercase;
  white-space: nowrap;
}
.vault-badge--sucesso { border-color: #86EFAC; background: #DCFCE7; color: #16A34A; }
.vault-badge--atencao { border-color: #FCD34D; background: #FEF3C7; color: #D97706; }
.vault-badge--erro { border-color: #FCA5A5; background: #FEE2E2; color: #DC2626; }
.vault-badge--info { border-color: #7DD3FC; background: #E0F2FE; color: #0284C7; }
.vault-badge--neutro { border-color: #E5E7EB; background: #F3F4F6; color: #6B7280; }
</style>
