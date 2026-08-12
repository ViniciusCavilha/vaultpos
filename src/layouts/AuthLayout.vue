<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="true">
      <slot />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue'
</script>

<style scoped>
ion-content { --background: #FFFFFF; }
</style>
