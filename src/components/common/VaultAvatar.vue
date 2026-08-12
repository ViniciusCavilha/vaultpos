<template>
  <span class="vault-avatar" :class="`vault-avatar--${size}`" :aria-label="name">
    {{ initial }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

const initial = computed(() => props.name.trim().charAt(0).toUpperCase() || 'V')
</script>

<style scoped>
.vault-avatar {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FEF2F2;
  color: #991B1B;
  font-family: var(--vault-font-family);
}

.vault-avatar--sm { width: 32px; height: 32px; font-size: 13px; font-weight: 600; }
.vault-avatar--md { width: 44px; height: 44px; font-size: 16px; font-weight: 700; }
.vault-avatar--lg { width: 80px; height: 80px; font-size: 32px; font-weight: 700; }
</style>
