<template>
  <ion-tabs>
    <ion-router-outlet />
    <ion-tab-bar slot="bottom" class="tab-bar">
      <ion-tab-button v-for="tab in tabs" :key="tab.key" :tab="tab.key" :href="tab.path" :class="{ active: isActive(tab.path) }">
        <ion-icon :icon="isActive(tab.path) ? tab.icon : tab.outline" />
        <ion-label>{{ tab.label }}</ion-label>
      </ion-tab-button>
      <ion-tab-button tab="admin-more" class="more-tab" @click.prevent="moreOpen = true">
        <span class="more-icon"><ion-icon :icon="ellipsisHorizontal" /><i></i></span>
        <ion-label>Mais</ion-label>
      </ion-tab-button>
    </ion-tab-bar>

    <ion-modal :is-open="moreOpen" :initial-breakpoint="0.58" :breakpoints="[0, 0.58]" @did-dismiss="moreOpen = false">
      <div class="more-sheet">
        <div class="handle"></div>
        <button v-for="item in moreItems" :key="item.path" type="button" :class="{ settings: item.path.includes('configuracoes') }" @click="navigate(item.path)">
          <ion-icon :icon="item.icon" /><span>{{ item.label }}</span>
          <i v-if="item.path.includes('configuracoes')" class="settings-dot"></i>
          <ion-icon v-else :icon="chevronForward" />
        </button>
        <button class="logout" type="button" @click="logoutAlertOpen = true">
          <ion-icon :icon="logOutOutline" /><span>Sair</span>
        </button>
      </div>
    </ion-modal>
    <ion-alert :is-open="logoutAlertOpen" header="Sair?" message="Deseja encerrar sua sessão?" :buttons="logoutButtons" @did-dismiss="logoutAlertOpen = false" />
  </ion-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonAlert, IonIcon, IonLabel, IonModal, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import {
  bag, bagOutline, barChartOutline, businessOutline, card, cardOutline, chevronForward,
  cube, cubeOutline, ellipsisHorizontal, home, homeOutline, logOutOutline, peopleOutline, settingsOutline,
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const moreOpen = ref(false)
const logoutAlertOpen = ref(false)
const tabs = [
  { key: 'admin-dashboard', path: '/admin/dashboard', label: 'Inicio', icon: home, outline: homeOutline },
  { key: 'admin-produtos', path: '/admin/produtos', label: 'Produtos', icon: bag, outline: bagOutline },
  { key: 'admin-estoque', path: '/admin/estoque', label: 'Estoque', icon: cube, outline: cubeOutline },
  { key: 'admin-financeiro', path: '/admin/financeiro', label: 'Financeiro', icon: card, outline: cardOutline },
]
const moreItems = [
  { path: '/admin/relatorios', label: 'Relatórios', icon: barChartOutline },
  { path: '/admin/usuarios', label: 'Usuários', icon: peopleOutline },
  { path: '/admin/empresa', label: 'Empresa', icon: businessOutline },
  { path: '/admin/configuracoes', label: 'Configurações', icon: settingsOutline },
]
const logoutButtons = [
  { text: 'Cancelar', role: 'cancel' },
  { text: 'Sim, sair', role: 'destructive', handler: () => logout() },
]
function isActive(path: string) { return route.path === path }
async function navigate(path: string) { moreOpen.value = false; await router.push(path) }
async function logout() { moreOpen.value = false; await authStore.logout(); userStore.clear(); await router.replace('/login') }
</script>

<style scoped>
.tab-bar { height: calc(56px + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); border-top: 1px solid #F3F4F6; background: #FFFFFF; box-shadow: none; --background: #FFFFFF; --border: 0; }
ion-tab-button { min-height: 56px; --background: #FFFFFF; --color: #9CA3AF; --color-selected: #991B1B; --ripple-color: #FEF2F2; }
ion-tab-button.active { --color: #991B1B; color: #991B1B; }
ion-tab-button ion-icon, .more-icon { width: 22px; height: 22px; }
ion-tab-button ion-label { margin-top: 3px; font: 400 11px 'Inter', sans-serif; letter-spacing: 0; }
ion-tab-button.active ion-label { font-weight: 600; }
.more-icon { position: relative; display: inline-flex; }
.more-icon i { position: absolute; top: -2px; right: -4px; width: 6px; height: 6px; border-radius: 50%; background: #991B1B; }
.more-sheet { min-height: 100%; padding: 0 20px calc(20px + env(safe-area-inset-bottom)); background: #FFFFFF; font-family: 'Inter', sans-serif; }
.handle { width: 32px; height: 4px; margin: 12px auto 16px; border-radius: 2px; background: #E5E7EB; }
.more-sheet button { display: flex; width: 100%; height: 56px; align-items: center; gap: 14px; padding: 0 8px; border: 0; border-bottom: 1px solid #F9FAFB; background: transparent; color: #111827; font: 600 15px 'Inter', sans-serif; }
.more-sheet button ion-icon { width: 22px; height: 22px; color: #6B7280; }
.more-sheet button span { flex: 1; text-align: left; }
.more-sheet button ion-icon:last-child { width: 16px; height: 16px; color: #D1D5DB; }
.more-sheet button.settings span { color: #991B1B; }
.settings-dot { width: 8px; height: 8px; border-radius: 50%; background: #991B1B; }
.more-sheet button.logout { margin-top: 8px; color: #EF4444; }
.more-sheet button.logout ion-icon { color: #EF4444; }
</style>
