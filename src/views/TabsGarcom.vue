<template>
  <ion-tabs>
    <ion-router-outlet />

    <ion-tab-bar slot="bottom" class="vault-tab-bar">
      <ion-tab-button
        tab="garcom-dashboard"
        href="/garcom/dashboard"
        class="tab-button"
        :class="{ active: isDashboardActive }"
      >
        <ion-icon :icon="isDashboardActive ? home : homeOutline" />
        <ion-label>Inicio</ion-label>
      </ion-tab-button>

      <ion-tab-button
        tab="garcom-comandas"
        href="/garcom/comandas"
        class="tab-button"
        :class="{ active: isComandasActive }"
      >
        <span class="tab-icon-wrapper">
          <ion-icon :icon="isComandasActive ? receipt : receiptOutline" />
          <ion-badge
            v-if="isComandasActive && comandasStore.totalComandasAbertas > 0"
            class="open-orders-badge"
          >
            {{ comandasStore.totalComandasAbertas }}
          </ion-badge>
        </span>
        <ion-label>Comandas</ion-label>
      </ion-tab-button>

      <div class="new-order-slot">
        <ion-fab-button
          class="new-order-button"
          aria-label="Abrir nova comanda"
          @click="openNewOrder"
        >
          <ion-icon :icon="add" />
        </ion-fab-button>
      </div>

      <ion-tab-button
        tab="garcom-estoque"
        href="/garcom/estoque"
        class="tab-button"
        :class="{ active: isStockActive }"
      >
        <ion-icon :icon="isStockActive ? cube : cubeOutline" />
        <ion-label>Estoque</ion-label>
      </ion-tab-button>

      <ion-tab-button
        tab="garcom-perfil"
        href="/garcom/perfil"
        class="tab-button"
        :class="{ active: isProfileActive }"
      >
        <ion-icon :icon="isProfileActive ? person : personOutline" />
        <ion-label>Perfil</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonBadge,
  IonFabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue'
import {
  add,
  cube,
  cubeOutline,
  home,
  homeOutline,
  person,
  personOutline,
  receipt,
  receiptOutline,
} from 'ionicons/icons'
import { useComandasStore } from '@/stores/comandas.store'

const route = useRoute()
const router = useRouter()
const comandasStore = useComandasStore()

const isDashboardActive = computed(() => route.path === '/garcom/dashboard')
const isComandasActive = computed(() => route.path.startsWith('/garcom/comandas'))
const isStockActive = computed(() => route.path === '/garcom/estoque')
const isProfileActive = computed(() => route.path === '/garcom/perfil')

function openNewOrder() {
  void router.push('/garcom/comandas/nova')
}
</script>

<style scoped>
.vault-tab-bar {
  contain: none;
  overflow: visible;
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: #FFFFFF;
  border-top: 1px solid #F3F4F6;
  box-shadow: none;
  --background: #FFFFFF;
  --border: 0;
}

.tab-button {
  width: 20%;
  max-width: none;
  min-height: 56px;
  color: #9CA3AF;
  --background: #FFFFFF;
  --color: #9CA3AF;
  --color-selected: #991B1B;
  --padding-end: 0;
  --padding-start: 0;
  --ripple-color: #FEF2F2;
}

.tab-button.active {
  color: #991B1B;
  --color: #991B1B;
}

.tab-button ion-icon,
.tab-icon-wrapper {
  width: 22px;
  height: 22px;
}

.tab-button ion-label {
  margin-top: 3px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
}

.tab-button.active ion-label {
  font-weight: 600;
}

.tab-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.open-orders-badge {
  position: absolute;
  top: -7px;
  right: -12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border: 2px solid #FFFFFF;
  border-radius: 9px;
  background: #991B1B;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.new-order-slot {
  display: flex;
  flex: 1 1 20%;
  align-items: flex-start;
  justify-content: center;
  width: 20%;
  height: 56px;
  pointer-events: none;
}

.new-order-button {
  width: 56px;
  height: 56px;
  margin: 0;
  transform: translateY(-16px);
  pointer-events: auto;
  --background: #991B1B;
  --background-activated: #7F1D1D;
  --background-hover: #991B1B;
  --border-radius: 50%;
  --box-shadow: 0 4px 12px rgba(153, 27, 27, 0.4);
  --color: #FFFFFF;
}

.new-order-button ion-icon {
  width: 28px;
  height: 28px;
}
</style>
