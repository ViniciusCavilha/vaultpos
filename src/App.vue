<template>
  <transition name="splash-fade">
    <div v-if="showSplash" class="splash">
      <div class="splash-content">
        <span class="splash-v" :class="{ visible: step >= 1 }">V</span>
        <span class="splash-name" :class="{ visible: step >= 2 }">VAULTPOS</span>
        <div class="splash-line" :class="{ visible: step >= 3 }" />
        <span class="splash-sub" :class="{ visible: step >= 4 }">GESTÃO COMERCIAL</span>
      </div>
      <span class="splash-version" :class="{ visible: step >= 5 }">v1.0.0</span>
    </div>
  </transition>

  <ion-app v-if="!showSplash">
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const showSplash = ref(true)
const step = ref(0)
const timers: number[] = []

function schedule(callback: () => void, delay: number) {
  timers.push(window.setTimeout(callback, delay))
}

onMounted(() => {
  const authStore = useAuthStore()

  schedule(() => { step.value = 1 }, 0)
  schedule(() => { step.value = 2 }, 200)
  schedule(() => { step.value = 3 }, 400)
  schedule(() => { step.value = 4 }, 600)
  schedule(() => { step.value = 5 }, 700)
  schedule(() => { showSplash.value = false }, 3000)

  void authStore.init().catch((error) => {
    console.error('Erro ao inicializar autenticação:', error)
  })
})

onBeforeUnmount(() => {
  timers.forEach(window.clearTimeout)
})
</script>

<style scoped>
.splash {
  position: fixed;
  z-index: 9999;
  inset: 0;
  display: flex;
  width: 100vw;
  height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #991B1B;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.splash-v,
.splash-name,
.splash-line,
.splash-sub,
.splash-version {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 500ms ease-out, transform 500ms ease-out;
}

.splash-v.visible,
.splash-name.visible,
.splash-line.visible,
.splash-sub.visible,
.splash-version.visible {
  opacity: 1;
  transform: translateY(0);
}

.splash-v {
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
}

.splash-name {
  margin-top: 8px;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 6px;
}

.splash-line {
  width: 40px;
  height: 1.5px;
  margin: 14px auto;
  background: rgba(255, 255, 255, 0.5);
  transition-duration: 400ms;
}

.splash-sub {
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 3px;
  text-transform: uppercase;
  transition-duration: 400ms;
}

.splash-version {
  position: fixed;
  bottom: 32px;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  transition-duration: 300ms;
}

.splash-fade-leave-active { transition: opacity 400ms ease-in; }
.splash-fade-leave-to { opacity: 0; }
</style>
