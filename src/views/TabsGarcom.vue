<template>
  <ion-tabs>
    <ion-router-outlet />

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

      <ion-tab-button class="new-order-slot" tab="garcom-nova" @click.prevent="openNewOrder">
        <ion-fab-button aria-label="Abrir nova comanda">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-tab-button>

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
  height: calc(56px + env(safe-area-inset-bottom));
  border-top: 1px solid #F3F4F6;
  background: #FFFFFF;
  box-shadow: none;
  --background: #FFFFFF;
}

ion-tab-button {
  --background: #FFFFFF;
  --color: #9CA3AF;
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
  overflow: visible;
  --color: #FFFFFF;
}

.new-order-slot ion-fab-button {
  width: 56px;
  height: 56px;
  margin-top: -16px;
  --background: #991B1B;
  --background-activated: #7F1D1D;
  --box-shadow: 0 4px 12px rgba(153, 27, 27, 0.4);
}

.new-order-slot ion-icon { color: #FFFFFF; font-size: 28px; }
</style>
