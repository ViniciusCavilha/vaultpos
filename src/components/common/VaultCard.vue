<template>
  <div
    class="vault-card"
    :class="'vault-card--' + variant"
    :style="variant === 'borda-colorida' ? { borderLeftColor: borderColor } : undefined"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'simples' | 'sombra' | 'borda-colorida'
  borderColor?: string
}>(), {
  variant: 'simples',
  borderColor: '#22C55E',
})
</script>

<style scoped>
.vault-card { padding: 16px; border-radius: 12px; background: #FFFFFF; }
.vault-card--sombra { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
.vault-card--borda-colorida { border-left: 3px solid #22C55E; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06); }
</style>
