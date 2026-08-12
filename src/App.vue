<template>
  <transition name="splash-fade">
    <div v-if="showSplash" class="splash">
      <div class="splash-content">
        <span class="splash-v" :class="{ visible: step >= 1 }">V</span>
        <span
          class="splash-name"
          :class="{ visible: step >= 2 }"
          aria-label="VAULTPOS"
        >
          <span class="splash-letters splash-name-letters" aria-hidden="true">
            <span v-for="(character, index) in splashName" :key="index">{{ character }}</span>
          </span>
        </span>
        <div class="splash-line" :class="{ visible: step >= 3 }"></div>
        <span
          class="splash-sub"
          :class="{ visible: step >= 4 }"
          aria-label="GESTÃO COMERCIAL"
        >
          <span class="splash-letters splash-sub-letters" aria-hidden="true">
            <span v-for="(character, index) in splashSubtitle" :key="index">{{ character }}</span>
          </span>
        </span>
      </div>

      <span class="splash-version" :class="{ visible: step >= 5 }">v1.0.0</span>
    </div>
  </transition>

  <ion-app v-if="!showSplash">
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth.store'

const showSplash = ref(true)
const step = ref(0)
const splashName = [...'VAULTPOS']
const splashSubtitle = [...'GESTÃO COMERCIAL']
const timers: ReturnType<typeof setTimeout>[] = []

function schedule(callback: () => void, delay: number) {
  timers.push(setTimeout(callback, delay))
}

onMounted(async () => {
  const authStore = useAuthStore()
  const splashDuration = new Promise<void>((resolve) => {
    schedule(resolve, 3000)
  })

  schedule(() => (step.value = 1), 0)
  schedule(() => (step.value = 2), 200)
  schedule(() => (step.value = 3), 400)
  schedule(() => (step.value = 4), 600)
  schedule(() => (step.value = 5), 700)

  await Promise.all([authStore.init(), splashDuration])
  showSplash.value = false
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
})
</script>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
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
  transition-property: opacity, transform;
  transition-timing-function: ease-out;
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
  letter-spacing: 0;
  transition-duration: 500ms;
}

.splash-name {
  margin-top: 8px;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0;
  transition-duration: 500ms;
}

.splash-letters {
  display: inline-flex;
}

.splash-name-letters {
  gap: 6px;
}

.splash-line {
  width: 40px;
  height: 1.5px;
  margin: 14px auto;
  background-color: rgba(255, 255, 255, 0.5);
  transition-duration: 400ms;
}

.splash-sub {
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0;
  text-transform: uppercase;
  transition-duration: 400ms;
}

.splash-sub-letters {
  gap: 3px;
}

.splash-version {
  position: fixed;
  bottom: 32px;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0;
  transition-duration: 300ms;
}

.splash-fade-leave-active {
  transition: opacity 400ms ease-in;
}

.splash-fade-leave-to {
  opacity: 0;
}
</style>
