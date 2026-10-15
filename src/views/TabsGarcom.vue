<template>
  <ion-tabs>
    <ion-router-outlet />

    <button class="center-new-order-button" type="button" aria-label="Abrir nova comanda" @click="openNewOrder">
      <ion-icon :icon="add" />
    </button>

    <ion-tab-bar slot="bottom" class="vault-tab-bar">
      <ion-tab-button tab="garcom-dashboard" href="/garcom/dashboard">
        <ion-icon :icon="isActive('/garcom/dashboard') ? home : homeOutline" />
        <ion-label>Inicio</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="garcom-comandas" href="/garcom/comandas">
        <span class="tab-icon-wrap">
          <ion-icon :icon="isActive('/garcom/comandas') ? receipt : receiptOutline" />
          <ion-badge v-if="comandasStore.totalComandasAbertas > 0">
            {{ comandasStore.totalComandasAbertas }}
          </ion-badge>
        </span>
        <ion-label>Comandas</ion-label>
      </ion-tab-button>

      <ion-tab-button class="new-order-slot" tab="garcom-nova" aria-label="Abrir nova comanda" @click.prevent="openNewOrder" />

      <ion-tab-button tab="garcom-estoque" href="/garcom/estoque">
        <ion-icon :icon="isActive('/garcom/estoque') ? cube : cubeOutline" />
        <ion-label>Estoque</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="garcom-perfil" href="/garcom/perfil">
        <ion-icon :icon="isActive('/garcom/perfil') ? person : personOutline" />
        <ion-label>Perfil</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>
</template>

<script setup lang="ts">
import {
  IonBadge,
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
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useComandasStore } from '@/stores/comandas.store'

const route = useRoute()
const router = useRouter()
const comandasStore = useComandasStore()

function isActive(path: string) {
  if (path === '/garcom/comandas') {
    return route.path === path || (/^\/garcom\/comandas\/[^/]+$/.test(route.path) && !route.path.endsWith('/nova'))
  }
  return route.path === path
}

function openNewOrder() {
  void router.push('/garcom/comandas/nova')
}

onMounted(() => {
  if (!comandasStore.comandas.length) void comandasStore.fetchComandas('aberta')
})
</script>

<style scoped>
.vault-tab-bar {
  height: calc(76px + env(safe-area-inset-bottom));
  contain: none;
  overflow: visible;
  border-top: 1px solid var(--vault-color-surface-muted);
  background: var(--vault-color-surface);
  box-shadow: none;
  --background: var(--vault-color-surface);
}

ion-tab-button {
  overflow: visible;
  --background: var(--vault-color-surface);
  --color: var(--vault-color-text-3);
  --color-selected: #991B1B;
  font-family: var(--vault-font-family);
}

ion-tab-button ion-icon { font-size: 22px; }
ion-tab-button ion-label { margin-top: 3px; font-size: 11px; font-weight: 400; }
ion-tab-button.tab-selected ion-label { font-weight: 600; }

.tab-icon-wrap { position: relative; display: inline-flex; }
.tab-icon-wrap ion-badge {
  position: absolute;
  top: -7px;
  right: -11px;
  min-width: 17px;
  height: 17px;
  border-radius: 9px;
  padding: 2px 5px;
  background: #EF4444;
  color: #FFFFFF;
  font-size: 9px;
  line-height: 13px;
}

.new-order-slot {
  --padding-start: 0;
  --padding-end: 0;
  --color: #FFFFFF;
}

.center-new-order-button {
  position: fixed !important;
  z-index: 20;
  bottom: calc(10px + env(safe-area-inset-bottom));
  left: 50%;
  display: grid;
  width: 56px;
  height: 56px;
  margin: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  padding: 0;
  transform: translateX(-50%);
  background: #991B1B;
  box-shadow: 0 8px 18px rgba(153, 27, 27, 0.32);
}

.center-new-order-button:active { background: #7F1D1D; }

.center-new-order-button ion-icon { color: #FFFFFF; font-size: 28px; }
</style>
