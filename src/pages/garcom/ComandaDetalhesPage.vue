<template>
  <ion-page>
    <ion-content fullscreen class="details-page">
      <ion-refresher slot="fixed" @ion-refresh="refresh"><ion-refresher-content /></ion-refresher>
      <main class="page-shell" :class="{ 'has-footer': isOpen }">
        <vault-skeleton v-if="comandasStore.loading && !order" variant="list" />
        <vault-error-state v-else-if="comandasStore.error && !order" :message="comandasStore.error" @retry="loadOrder" />
        <template v-else-if="order">
          <header class="details-header"><button type="button" aria-label="Voltar" @click="router.back()"><ion-icon :icon="chevronBackOutline" /></button><h1>Mesa {{ order.mesa ?? '—' }}</h1><span :class="`status-${order.status}`"><i />{{ statusLabel }}</span></header>
          <p class="subheader">{{ order.usuarios?.nome || 'Garçom' }} • {{ statusLabel }} às {{ formatTime(order.criada_em) }}</p>
          <section v-if="order.itens_comanda?.length" class="items-card">
            <article v-for="item in order.itens_comanda" :key="item.id" class="item-row">
              <div class="item-copy"><strong>{{ item.produtos?.nome || 'Produto' }}</strong><small>{{ formatCurrency(item.valor_unitario) }} /un</small></div>
              <div v-if="isOpen" class="quantity"><button type="button" @click="decrease(item)">−</button><b>{{ item.quantidade }}</b><button class="plus" type="button" @click="increase(item)">+</button></div>
              <div class="item-total"><strong>{{ formatCurrency(item.subtotal) }}</strong><button v-if="isOpen" type="button" aria-label="Remover item" @click="confirmRemove(item.id)"><ion-icon :icon="trashOutline" /></button></div>
            </article>
          </section>
          <vault-empty-state v-else icon="bag-outline" title="Sem produtos" message="Esta comanda ainda não possui itens." />
          <button v-if="isOpen" class="add-item-button" type="button" @click="openProductPicker">+ Adicionar item</button>
        </template>
      </main>

      <footer v-if="order && isOpen" class="summary-footer">
        <div><span>Subtotal</span><b>{{ formatCurrency(subtotal) }}</b></div><div><span>Taxa de serviço (10%)</span><b>{{ formatCurrency(serviceFee) }}</b></div><hr /><div class="grand-total"><strong>Total</strong><b>{{ formatCurrency(total) }}</b></div>
        <vault-button label="Fechar Comanda" @click="paymentOpen = true" /><button class="cancel-button" type="button" @click="confirmCancel">Cancelar Comanda</button>
      </footer>

      <ion-modal :is-open="productPickerOpen" :initial-breakpoint="0.75" :breakpoints="[0, 0.75, 1]" @did-dismiss="productPickerOpen = false">
        <ion-content class="picker-content"><div class="modal-handle" /><header class="picker-header"><h2>Adicionar item</h2><button type="button" @click="productPickerOpen = false"><ion-icon :icon="closeOutline" /></button></header><ion-searchbar v-model="productSearch" placeholder="Buscar produto..." />
          <vault-skeleton v-if="estoqueStore.loading" variant="list" /><vault-empty-state v-else-if="!pickerProducts.length" icon="bag-outline" title="Sem produtos" message="Nenhum produto disponível." />
          <div v-else class="picker-list"><button v-for="product in pickerProducts" :key="product.id" type="button" @click="addProduct(product)"><span><strong>{{ product.nome }}</strong><small>{{ formatCurrency(product.preco) }}</small></span><b>+</b></button></div>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="paymentOpen" :initial-breakpoint="0.82" :breakpoints="[0, 0.82, 1]" @did-dismiss="paymentOpen = false">
        <pagamentos-page :comanda-id="String(order?.id || '')" :total="total" :mesa="order?.mesa ?? '—'" :total-itens="totalItems" @close="paymentOpen = false" @paid="handlePaid" />
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonModal, IonPage, IonRefresher, IonRefresherContent, IonSearchbar, alertController } from '@ionic/vue'
import { chevronBackOutline, closeOutline, trashOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import PagamentosPage from '@/pages/garcom/PagamentosPage.vue'
import { useComandasStore } from '@/stores/comandas.store'
import { useEstoqueStore } from '@/stores/estoque.store'
import type { ItemComandaComProduto, ProdutoComCategoria } from '@/types/database.types'

const route = useRoute()
const router = useRouter()
const comandasStore = useComandasStore()
const estoqueStore = useEstoqueStore()
const { showToast } = useVaultToast()
const productPickerOpen = ref(false)
const paymentOpen = ref(false)
const productSearch = ref('')
const order = computed(() => comandasStore.comandaAtiva)
const isOpen = computed(() => order.value?.status === 'aberta')
const subtotal = computed(() => Number(order.value?.subtotal || 0))
const serviceFee = computed(() => Number(order.value?.taxa_servico || 0))
const total = computed(() => subtotal.value + serviceFee.value - Number(order.value?.desconto || 0))
const totalItems = computed(() => order.value?.itens_comanda?.reduce((sum: number, item: ItemComandaComProduto) => sum + item.quantidade, 0) || 0)
const pickerProducts = computed(() => estoqueStore.produtos.filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(productSearch.value.toLocaleLowerCase('pt-BR'))))
const statusLabel = computed(() => ({ aberta: 'Aberta', fechada: 'Fechada', cancelada: 'Cancelada' }[order.value?.status as 'aberta' | 'fechada' | 'cancelada'] || 'Comanda'))
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
function formatTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : time.format(date) }
async function loadOrder() { await comandasStore.fetchComandaById(String(route.params.id)) }
async function refresh(event: CustomEvent) { await loadOrder(); (event.target as HTMLIonRefresherElement).complete() }
async function updateQuantity(item: ItemComandaComProduto, quantity: number) {
  try {
    await comandasStore.atualizarQuantidade(item.id, quantity, item.valor_unitario)
  } catch (error) {
    await showToast(comandasStore.error || (error instanceof Error ? error.message : 'Não foi possível atualizar o item.'), 'error')
  }
}
async function increase(item: ItemComandaComProduto) { await updateQuantity(item, item.quantidade + 1) }
async function decrease(item: ItemComandaComProduto) { if (item.quantidade <= 1) await confirmRemove(item.id); else await updateQuantity(item, item.quantidade - 1) }
async function removeItem(id: string) {
  try {
    await comandasStore.removerItem(id)
    await showToast('Item removido.', 'success')
  } catch (error) {
    await showToast(comandasStore.error || (error instanceof Error ? error.message : 'Não foi possível remover o item.'), 'error')
  }
}
async function confirmRemove(id: string) { const alert = await alertController.create({ header: 'Remover item?', message: 'Este item será removido da comanda.', buttons: [{ text: 'Voltar', role: 'cancel' }, { text: 'Remover', role: 'destructive', handler: () => removeItem(id) }] }); await alert.present() }
async function openProductPicker() { productPickerOpen.value = true; if (!estoqueStore.produtos.length) await estoqueStore.fetchProdutos() }
async function addProduct(product: ProdutoComCategoria) { try { await comandasStore.adicionarItem({ produto_id: product.id, quantidade: 1, valor_unitario: Number(product.preco) }); productPickerOpen.value = false; await showToast('Item adicionado.', 'success') } catch { await showToast(comandasStore.error || 'Não foi possível adicionar o item.', 'error') } }
async function cancelOrder() {
  try {
    await comandasStore.cancelar(String(route.params.id))
    await showToast('Comanda cancelada.', 'success')
    router.back()
  } catch (error) {
    await showToast(comandasStore.error || (error instanceof Error ? error.message : 'Não foi possível cancelar a comanda.'), 'error')
  }
}
async function confirmCancel() { const alert = await alertController.create({ header: 'Cancelar comanda?', message: 'Esta ação não poderá ser desfeita.', buttons: [{ text: 'Voltar', role: 'cancel' }, { text: 'Sim, cancelar', role: 'destructive', handler: cancelOrder }] }); await alert.present() }
function handlePaid() { paymentOpen.value = true }
onMounted(loadOrder)
</script>

<style scoped>
.details-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px 32px}.page-shell.has-footer{padding-bottom:260px}.details-header{display:flex;align-items:center}.details-header>button{display:grid;width:34px;height:34px;place-items:center;border:0;background:transparent;color:#111827}.details-header>button ion-icon{font-size:22px}.details-header h1{flex:1;margin:0 0 0 4px;font-size:22px;font-weight:700}.details-header>span{display:flex;align-items:center;font-size:13px;font-weight:600}.details-header>span i{width:8px;height:8px;margin-right:6px;border-radius:50%;background:currentColor}.status-aberta{color:#22C55E}.status-fechada{color:#9CA3AF}.status-cancelada{color:#EF4444}.subheader{margin:3px 0 0 38px;color:#9CA3AF;font-size:13px}.items-card{overflow:hidden;margin-top:16px;border-radius:12px;padding:0 16px;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.06)}.item-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center;border-bottom:1px solid #F9FAFB;padding:16px 0}.item-row:last-child{border:0}.item-copy{display:flex;min-width:0;flex-direction:column}.item-copy strong{overflow:hidden;font-size:14px;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.item-copy small{margin-top:2px;color:#9CA3AF;font-size:12px}.quantity{display:flex;align-items:center}.quantity button{width:28px;height:28px;border:1px solid #E5E7EB;border-radius:50%;background:#FFFFFF;color:#111827;font:700 16px Inter}.quantity button.plus{border:0;background:#991B1B;color:#FFFFFF}.quantity b{padding:0 8px;font-size:15px}.item-total{display:flex;min-width:72px;flex-direction:column;align-items:flex-end}.item-total strong{font-size:14px;font-weight:600}.item-total button{border:0;padding:3px 0 0;background:transparent;color:#D1D5DB}.item-total ion-icon{font-size:20px}.add-item-button{width:100%;height:48px;margin-top:8px;border:1.5px solid #991B1B;border-radius:10px;background:#FFFFFF;color:#991B1B;font:600 14px Inter}.summary-footer{position:fixed;z-index:4;right:0;bottom:calc(56px + env(safe-area-inset-bottom));left:0;border-top:1px solid #E5E7EB;padding:14px 20px 10px;background:#FFFFFF}.summary-footer>div{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}.summary-footer span{color:#6B7280;font-size:14px}.summary-footer b{font-size:14px;font-weight:400}.summary-footer hr{height:1px;margin:8px 0;border:0;background:#F3F4F6}.summary-footer .grand-total strong{font-size:16px}.summary-footer .grand-total b{font-size:22px;font-weight:700}.cancel-button{display:block;margin:8px auto 0;border:0;background:transparent;color:#EF4444;font:600 14px Inter}.modal-handle{width:32px;height:4px;margin:12px auto;border-radius:2px;background:#E5E7EB}.picker-content{--background:#FFFFFF;--padding-start:20px;--padding-end:20px}.picker-header{display:flex;align-items:center;justify-content:space-between}.picker-header h2{margin:0;font-size:18px}.picker-header button{display:grid;width:28px;height:28px;place-items:center;border:0;border-radius:50%;background:#F3F4F6;color:#6B7280}.picker-content ion-searchbar{padding:14px 0 8px;--background:#F3F4F6;--box-shadow:none;--border-radius:10px}.picker-list{overflow:hidden;border-radius:12px}.picker-list button{display:flex;width:100%;align-items:center;justify-content:space-between;border:0;border-bottom:1px solid #F3F4F6;padding:14px;background:#FFFFFF;text-align:left}.picker-list button span{display:flex;flex-direction:column}.picker-list button strong{font-size:14px}.picker-list button small{margin-top:3px;color:#6B7280;font-size:13px}.picker-list button>b{display:grid;width:32px;height:32px;place-items:center;border-radius:50%;background:#991B1B;color:#FFFFFF;font-size:18px}
</style>
