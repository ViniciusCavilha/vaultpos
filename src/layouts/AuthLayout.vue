<template>
  <ion-page>
    <ion-content :scroll-y="true" fullscreen class="auth-layout">
      <main class="auth-layout__content">
        <slot />
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue'
</script>

<style scoped>
.auth-layout {
  --background: var(--vault-color-surface);
  --color: var(--vault-color-text-1);
}

.auth-layout__content {
  position: relative;
  width: 100%;
  min-height: 100%;
  background: var(--vault-color-surface);
}
</style>
