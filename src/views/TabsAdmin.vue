<template>
  <ion-tabs>
    <ion-router-outlet />
    <ion-tab-bar slot='bottom' class='vault-tab-bar'>
      <ion-tab-button tab='admin-dashboard' href='/admin/dashboard'><ion-icon :icon='isActive(`/admin/dashboard`) ? home : homeOutline' /><ion-label>Inicio</ion-label></ion-tab-button>
      <ion-tab-button tab='admin-produtos' href='/admin/produtos'><ion-icon :icon='isActive(`/admin/produtos`) ? bag : bagOutline' /><ion-label>Produtos</ion-label></ion-tab-button>
      <ion-tab-button tab='admin-estoque' href='/admin/estoque'><ion-icon :icon='isActive(`/admin/estoque`) ? cube : cubeOutline' /><ion-label>Estoque</ion-label></ion-tab-button>
      <ion-tab-button tab='admin-financeiro' href='/admin/financeiro'><ion-icon :icon='isActive(`/admin/financeiro`) ? card : cardOutline' /><ion-label>Financeiro</ion-label></ion-tab-button>
      <ion-tab-button tab='admin-mais' @click.prevent='showMore = true'><span class='more-icon'><ion-icon :icon='ellipsisHorizontal' /><i /></span><ion-label>Mais</ion-label></ion-tab-button>
    </ion-tab-bar>
    <ion-modal :is-open='showMore' :initial-breakpoint='0.55' :breakpoints='[0, 0.55]' @did-dismiss='showMore = false'>
      <ion-content class='more-sheet'>
        <div class='sheet-handle' />
        <nav class='sheet-list'>
          <button v-for='item in menuItems' :key='item.path' type='button' :class='{ settings: item.path === `/admin/configuracoes` }' @click='navigate(item.path)'>
            <ion-icon :icon='item.icon' /><span>{{ item.label }}</span><i v-if='item.path === `/admin/configuracoes`' class='settings-dot' /><ion-icon v-else class='chevron' :icon='chevronForwardOutline' />
          </button>
        </nav>
        <button class='logout-item' type='button' @click='confirmLogout'><ion-icon :icon='logOutOutline' /><span>Sair</span></button>
      </ion-content>
    </ion-modal>
  </ion-tabs>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonLabel, IonModal, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, alertController } from '@ionic/vue'
import { bag, bagOutline, barChartOutline, businessOutline, card, cardOutline, chevronForwardOutline, cube, cubeOutline, ellipsisHorizontal, home, homeOutline, logOutOutline, peopleOutline, settingsOutline } from 'ionicons/icons'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const showMore = ref(false)
const menuItems = [{ label: 'Relatórios', path: '/admin/relatorios', icon: barChartOutline }, { label: 'Usuários', path: '/admin/usuarios', icon: peopleOutline }, { label: 'Empresa', path: '/admin/empresa', icon: businessOutline }, { label: 'Configurações', path: '/admin/configuracoes', icon: settingsOutline }]
function isActive(path: string) { return route.path === path }
function navigate(path: string) { showMore.value = false; void router.push(path) }
async function logout() { showMore.value = false; await authStore.logout(); userStore.clear(); window.location.replace('/login') }
async function confirmLogout() { const alert = await alertController.create({ cssClass: 'vault-logout-alert', header: 'Encerrar sessão?', message: 'Você poderá entrar novamente a qualquer momento.', buttons: [{ text: 'Continuar no app', role: 'cancel', cssClass: 'vault-alert-cancel' }, { text: 'Sair', role: 'destructive', cssClass: 'vault-alert-confirm', handler: logout }] }); await alert.present() }
</script>

<style scoped>
.vault-tab-bar{height:calc(70px + env(safe-area-inset-bottom));contain:none;overflow:visible;border-top:1px solid var(--vault-color-surface-muted);background:var(--vault-color-surface);box-shadow:none;--background:var(--vault-color-surface)}ion-tab-button{overflow:visible;--background:var(--vault-color-surface);--color:var(--vault-color-text-3);--color-selected:#991B1B;font-family:var(--vault-font-family)}ion-tab-button ion-icon{font-size:22px}ion-tab-button ion-label{margin-top:3px;font-size:11px;font-weight:400}ion-tab-button.tab-selected ion-label{font-weight:600}.more-icon{position:relative;display:inline-flex}.more-icon i{position:absolute;top:-2px;right:-5px;width:6px;height:6px;border-radius:50%;background:#EF4444}.more-sheet{--background:var(--vault-color-surface);--color:var(--vault-color-text-1)}.sheet-handle{width:32px;height:4px;margin:12px auto 16px;border-radius:2px;background:var(--vault-color-border)}.sheet-list{overflow:hidden;margin:0 20px;border-radius:12px;background:var(--vault-color-surface);box-shadow:0 1px 4px rgba(0,0,0,.06)}.sheet-list button,.logout-item{display:flex;width:100%;height:56px;align-items:center;border:0;border-bottom:1px solid var(--vault-color-surface-subtle);padding:0 16px;background:var(--vault-color-surface);color:var(--vault-color-text-1);font-family:inherit}.sheet-list button:last-child{border-bottom:0}.sheet-list ion-icon,.logout-item ion-icon{flex:0 0 auto;color:var(--vault-color-text-2);font-size:22px}.sheet-list span,.logout-item span{flex:1;margin-left:12px;font-size:15px;font-weight:600;text-align:left}.sheet-list .chevron{color:var(--vault-color-placeholder);font-size:16px}.sheet-list button.settings span{color:#991B1B}.settings-dot{width:8px;height:8px;border-radius:50%;background:#EF4444}.logout-item{width:calc(100% - 40px);margin:8px 20px 0;border-radius:12px;color:#EF4444}.logout-item ion-icon{color:#EF4444}
</style>
