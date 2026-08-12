<template>
  <ion-page>
    <ion-content :fullscreen="true" class="page-content">
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <main class="page-shell">
        <VaultSkeleton v-if="comandasStore.loading && !order" variant="list" />
        <VaultErrorState
          v-else-if="comandasStore.error && !order"
          :message="comandasStore.error"
          @retry="load"
        />
        <template v-else-if="order">
          <header class="page-header">
            <button type="button" aria-label="Voltar" @click="router.back()">
              <ion-icon :icon="chevronBack" />
            </button>
            <div>
              <h1>Mesa {{ order.mesa ?? '-' }}</h1>
              <p>{{ order.usuarios?.nome ?? 'Garçom' }} · Aberta às {{ formatTime(order.criada_em) }}</p>
            </div>
            <span class="open-status"><i></i>Aberta</span>
          </header>

          <section class="items-card">
            <article v-for="item in order.itens_comanda" :key="item.id" class="item-row">
              <div class="item-info">
                <strong>{{ item.produtos?.nome ?? 'Produto' }}</strong>
                <span>{{ formatMoney(item.valor_unitario) }} /un</span>
              </div>
              <div class="quantity">
                <button type="button" @click="decrease(item)">−</button>
                <strong>{{ item.quantidade }}</strong>
                <button class="add" type="button" @click="increase(item)">+</button>
              </div>
              <div class="item-total">
                <strong>{{ formatMoney(item.subtotal) }}</strong>
                <button type="button" aria-label="Remover item" @click="askRemove(item.id)">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </article>
            <p v-if="!order.itens_comanda.length" class="empty-items">Nenhum item adicionado.</p>
          </section>

          <VaultButton class="add-item-button" variant="outline" label="+ Adicionar item" @click="productModalOpen = true" />
        </template>
      </main>

      <footer v-if="order" class="summary-footer">
        <div><span>Subtotal</span><span>{{ formatMoney(order.subtotal) }}</span></div>
        <div><span>Taxa de serviço (10%)</span><span>{{ formatMoney(order.taxa_servico) }}</span></div>
        <hr />
        <div class="total"><strong>Total</strong><strong>{{ formatMoney(order.total) }}</strong></div>
        <VaultButton label="Fechar Comanda" @click="paymentModalOpen = true" />
        <button class="cancel-button" type="button" @click="cancelAlertOpen = true">Cancelar Comanda</button>
      </footer>

      <ion-modal :is-open="paymentModalOpen" :initial-breakpoint="0.85" :breakpoints="[0, 0.85, 1]" @did-dismiss="paymentModalOpen = false">
        <PagamentosPage
          v-if="order"
          :comanda-id="order.id"
          :total="order.total"
          :mesa="order.mesa"
          :total-itens="totalItems"
          @close="paymentModalOpen = false"
        />
      </ion-modal>

      <ion-modal :is-open="productModalOpen" :initial-breakpoint="0.75" :breakpoints="[0, 0.75, 1]" @did-dismiss="productModalOpen = false">
        <ion-content class="product-modal">
          <div class="modal-handle"></div>
          <header><h2>Adicionar item</h2><button type="button" @click="productModalOpen = false">×</button></header>
          <VaultSkeleton v-if="estoqueStore.loading" variant="list" />
          <div v-else class="modal-products">
            <button v-for="product in estoqueStore.produtosAtivos" :key="product.id" type="button" @click="addProduct(product)">
              <span><strong>{{ product.nome }}</strong><small>{{ formatMoney(product.preco) }}</small></span>
              <i>+</i>
            </button>
          </div>
        </ion-content>
      </ion-modal>

      <ion-alert
        :is-open="removeAlertOpen"
        header="Remover item?"
        message="O item será removido da comanda."
        :buttons="removeButtons"
        @did-dismiss="removeAlertOpen = false"
      />
      <ion-alert
        :is-open="cancelAlertOpen"
        header="Cancelar comanda?"
        message="Esta ação não poderá ser desfeita."
        :buttons="cancelButtons"
        @did-dismiss="cancelAlertOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonAlert,
  IonContent,
  IonIcon,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue'
import { chevronBack, trashOutline } from 'ionicons/icons'
import PagamentosPage from '@/pages/garcom/PagamentosPage.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { useComandasStore } from '@/stores/comandas.store'
import { useEstoqueStore } from '@/stores/estoque.store'
import { useUserStore } from '@/stores/user.store'

const route = useRoute()
const router = useRouter()
const { showToast } = useVaultToast()
const userStore = useUserStore()
const comandasStore = useComandasStore()
const estoqueStore = useEstoqueStore()
const paymentModalOpen = ref(false)
const productModalOpen = ref(false)
const removeAlertOpen = ref(false)
const cancelAlertOpen = ref(false)
const pendingRemoval = ref('')
const order = computed(() => comandasStore.comandaAtiva)
const totalItems = computed(() => order.value?.itens_comanda.reduce((sum: number, item: any) => sum + item.quantidade, 0) ?? 0)
const removeButtons = [
  { text: 'Voltar', role: 'cancel' },
  { text: 'Remover', role: 'destructive', handler: () => removeItem() },
]
const cancelButtons = [
  { text: 'Voltar', role: 'cancel' },
  { text: 'Sim, cancelar', role: 'destructive', handler: () => cancelOrder() },
]

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
async function load() {
  await comandasStore.fetchComandaById(String(route.params.id))
}
async function refresh(event: CustomEvent) {
  await load()
  ;(event.target as HTMLIonRefresherElement).complete()
}
async function increase(item: any) {
  await comandasStore.atualizarQuantidade(item.id, item.quantidade + 1, item.valor_unitario)
}
async function decrease(item: any) {
  if (item.quantidade <= 1) askRemove(item.id)
  else await comandasStore.atualizarQuantidade(item.id, item.quantidade - 1, item.valor_unitario)
}
function askRemove(id: string) {
  pendingRemoval.value = id
  removeAlertOpen.value = true
}
async function removeItem() {
  if (pendingRemoval.value) await comandasStore.removerItem(pendingRemoval.value)
}
async function cancelOrder() {
  if (!order.value) return
  try {
    await comandasStore.cancelar(order.value.id)
    await showToast('Comanda cancelada.', 'success')
    router.back()
  } catch (error) {
    await showToast(error instanceof Error ? error.message : 'Erro ao cancelar a comanda.', 'error')
  }
}
async function addProduct(product: any) {
  try {
    await comandasStore.adicionarItem({ produto_id: product.id, quantidade: 1, valor_unitario: product.preco })
    await showToast('Item adicionado.', 'success')
    productModalOpen.value = false
  } catch (error) {
    await showToast(error instanceof Error ? error.message : 'Erro ao adicionar item.', 'error')
  }
}
onMounted(async () => {
  if (!userStore.usuario) await userStore.fetchUsuarioLogado()
  await Promise.all([load(), estoqueStore.fetchProdutos()])
})
</script>

<style scoped>
.page-content { --background: #F8FAFC; }
.page-shell { min-height: 100%; padding: calc(52px + env(safe-area-inset-top)) 20px 300px; font-family: 'Inter', sans-serif; }
.page-header { display: grid; grid-template-columns: 36px 1fr auto; align-items: center; gap: 8px; }
.page-header > button { display: grid; width: 36px; height: 36px; padding: 0; place-items: center; border: 0; background: transparent; color: #111827; }
.page-header h1 { margin: 0; color: #111827; font-size: 22px; font-weight: 700; letter-spacing: 0; }
.page-header p { margin: 3px 0 0; color: #9CA3AF; font-size: 13px; }
.open-status { display: flex; align-items: center; gap: 6px; color: #22C55E; font-size: 13px; font-weight: 600; }
.open-status i { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; }
.items-card { margin-top: 16px; padding: 0 16px; border-radius: 12px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.item-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid #F9FAFB; }
.item-row:last-child { border-bottom: 0; }
.item-info { display: flex; min-width: 0; flex-direction: column; }
.item-info strong { overflow: hidden; color: #111827; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.item-info span { margin-top: 2px; color: #9CA3AF; font-size: 12px; }
.quantity { display: flex; align-items: center; gap: 7px; }
.quantity button { display: grid; width: 28px; height: 28px; padding: 0; place-items: center; border: 1px solid #E5E7EB; border-radius: 50%; background: #FFFFFF; color: #111827; font: 700 16px 'Inter', sans-serif; }
.quantity button.add { border-color: #991B1B; background: #991B1B; color: #FFFFFF; }
.quantity strong { min-width: 16px; color: #111827; font-size: 15px; text-align: center; }
.item-total { display: flex; align-items: flex-end; flex-direction: column; gap: 4px; }
.item-total > strong { color: #111827; font-size: 14px; font-weight: 600; white-space: nowrap; }
.item-total button { padding: 0; border: 0; background: transparent; color: #D1D5DB; }
.item-total ion-icon { width: 20px; height: 20px; }
.empty-items { padding: 24px 0; color: #9CA3AF; font-size: 14px; text-align: center; }
.add-item-button { margin-top: 8px; }
.summary-footer { position: fixed; right: 0; bottom: calc(56px + env(safe-area-inset-bottom)); left: 0; z-index: 10; padding: 14px 20px 10px; border-top: 1px solid #E5E7EB; background: #FFFFFF; font-family: 'Inter', sans-serif; }
.summary-footer > div { display: flex; justify-content: space-between; margin-bottom: 6px; color: #6B7280; font-size: 14px; }
.summary-footer > div span:last-child { color: #111827; }
.summary-footer hr { height: 1px; margin: 10px 0; border: 0; background: #F3F4F6; }
.summary-footer .total { align-items: center; margin-bottom: 12px; color: #111827; font-size: 16px; }
.summary-footer .total strong:last-child { font-size: 22px; }
.cancel-button { display: block; margin: 8px auto 0; border: 0; background: transparent; color: #EF4444; font: 600 14px 'Inter', sans-serif; }
.product-modal { --background: #FFFFFF; }
.modal-handle { width: 32px; height: 4px; margin: 12px auto; border-radius: 2px; background: #E5E7EB; }
.product-modal header { display: flex; align-items: center; justify-content: space-between; padding: 0 20px 12px; }
.product-modal h2 { margin: 0; color: #111827; font-size: 18px; }
.product-modal header button { width: 32px; height: 32px; border: 0; border-radius: 50%; background: #F3F4F6; color: #6B7280; font-size: 22px; }
.modal-products { padding: 0 20px 24px; }
.modal-products > button { display: flex; width: 100%; align-items: center; justify-content: space-between; padding: 14px 0; border: 0; border-bottom: 1px solid #F3F4F6; background: transparent; text-align: left; }
.modal-products span { display: flex; flex-direction: column; gap: 3px; }
.modal-products strong { color: #111827; font-size: 14px; }
.modal-products small { color: #6B7280; font-size: 13px; }
.modal-products i { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 50%; background: #991B1B; color: #FFFFFF; font-size: 20px; font-style: normal; }
</style>
