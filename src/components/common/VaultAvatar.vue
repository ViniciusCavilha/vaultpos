<template>
  <span class="vault-avatar" :class="`vault-avatar--${size}`" :aria-label="name">
    <img v-if="hasValidPhoto" :src="photo || undefined" :alt="`Foto de ${name}`" @error="handleImageError" />
    <template v-else>{{ initials }}</template>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  photo?: string | null
  size?: 'sm' | 'md' | 'lg'
}>(), {
  photo: null,
  size: 'md',
})

const imageFailed = ref(false)
const hasValidPhoto = computed(() => Boolean(props.photo?.trim()) && !imageFailed.value)
const initials = computed(() => {
  const nameParts = props.name.trim().split(/\s+/).filter(Boolean)
  if (!nameParts.length) return 'V'
  const firstInitial = nameParts[0].charAt(0)
  const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : ''
  return (firstInitial + lastInitial).toUpperCase()
})

function handleImageError() {
  imageFailed.value = true
}

watch(() => props.photo, () => {
  imageFailed.value = false
})
</script>

<style scoped>
.vault-avatar {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--vault-color-primary-soft);
  color: #991B1B;
  font-family: var(--vault-font-family);
  line-height: 1;
  text-align: center;
  overflow: hidden;
}

.vault-avatar img { width: 100%; height: 100%; object-fit: cover; }

.vault-avatar--sm { width: 32px; height: 32px; font-size: 13px; font-weight: 600; }
.vault-avatar--md { width: 44px; height: 44px; font-size: 16px; font-weight: 700; }
.vault-avatar--lg { width: 80px; height: 80px; font-size: 32px; font-weight: 700; }
</style>
