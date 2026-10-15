<template>
  <ion-page>
    <ion-content fullscreen class='stock-page'>
      <ion-refresher slot='fixed' @ion-refresh='refresh'><ion-refresher-content /></ion-refresher>
      <main class='page-shell'>
        <header><h1>Estoque</h1><div><button class='movement-button' type='button' @click='openMovement()'>Movimentação</button><button class='add-button' type='button' aria-label='Nova movimentação' @click='openMovement()'><ion-icon :icon='add' /></button></div></header>
        <div class='segments'><button type='button' :class='{ active: tab === `products` }' @click='tab = `products`'>Produtos</button><button type='button' :class='{ active: tab === `movements` }' @click='tab = `movements`'>Movimentações</button></div>

        <template v-if='tab === `products`'>
          <div class='summary-cards'><article><strong>{{ estoqueStore.totalProdutos }}</strong><span>Total</span></article><article><strong class='danger'>{{ outOfStock }}</strong><span>Em falta</span></article><article><strong class='warning'>{{ estoqueStore.totalEstoqueBaixo }}</strong><span>Estoque baixo</span></article></div>
          <label class='search-box'><ion-icon :icon='searchOutline' /><input v-model='search' type='search' placeholder='Buscar produto...' /></label>
          <div class='categories'><button type='button' :class='{ active: category === `all` }' @click='category = `all`'>Todos</button><button v-for='item in estoqueStore.categorias' :key='item.id' type='button' :class='{ active: category === item.id }' @click='category = item.id'>{{ item.nome }}</button></div>
          <vault-skeleton v-if='estoqueStore.loading' variant='list' />
          <vault-error-state v-else-if='estoqueStore.error' :message='estoqueStore.error' @retry='loadData' />
          <vault-empty-state v-else-if='!filteredProducts.length' icon='cube-outline' title='Sem produtos' message='Nenhum produto disponível no estoque.' />
          <section v-else class='stock-list'><article v-for='product in filteredProducts' :key='product.id' class='stock-item'>
            <div class='stock-heading'><span><strong>{{ product.nome }}</strong><small>{{ product.categorias?.nome || 'Sem categoria' }} · {{ formatCurrency(product.preco) }}</small></span><div><button type='button' aria-label='Movimentar' @click='openMovement(product)'><ion-icon :icon='reloadOutline' /></button><button type='button' aria-label='Editar' @click='openEdit(product)'><ion-icon :icon='pencilOutline' /></button><button class='delete' type='button' aria-label='Excluir' @click='confirmDelete(product)'><ion-icon :icon='trashOutline' /></button></div></div>
            <div class='stock-status'><b :class='stockClass(product)'>{{ stockLabel(product) }}</b><span>Min: {{ product.estoque_minimo }}</span></div>
            <div class='progress'><i :class='stockClass(product)' :style='{ width: progressWidth(product) }' /></div>
            <div class='quantity'><button type='button' :disabled='product.estoque <= 0' @click='quickMove(product, `saida`)'>−</button><strong>{{ product.estoque }}</strong><button class='plus' type='button' @click='quickMove(product, `entrada`)'>+</button></div>
          </article></section>
        </template>

        <template v-else>
          <vault-skeleton v-if='estoqueStore.loading' variant='list' />
          <vault-error-state v-else-if='estoqueStore.error' :message='estoqueStore.error' @retry='loadData' />
          <vault-empty-state v-else-if='!estoqueStore.movimentacoes.length' icon='swap-horizontal-outline' title='Sem movimentações' message='Nenhuma movimentação registrada ainda.' button-text='Registrar Movimentação' @action='openMovement()' />
          <section v-else class='movement-list'><article v-for='movement in estoqueStore.movimentacoes' :key='movement.id'><span class='movement-icon' :class='movement.tipo'><ion-icon :icon='movementIcon(movement.tipo)' /></span><span class='movement-copy'><strong>{{ movement.produtos?.nome || 'Produto' }}</strong><small>por {{ movement.usuarios?.nome || 'Usuário' }} · {{ formatDateTime(movement.data) }}</small></span><span class='movement-value' :class='movement.tipo'><strong>{{ movement.tipo === 'entrada' ? '+' : movement.tipo === 'saida' ? '-' : '' }}{{ movement.quantidade }}</strong><small>{{ movement.motivo || 'Sem motivo' }}</small></span></article></section>
        </template>
      </main>

      <ion-modal :is-open='movementOpen' :initial-breakpoint='0.8' :breakpoints='[0, 0.8, 1]' @did-dismiss='movementOpen = false'>
        <ion-content class='movement-modal'><div class='modal-handle' /><header><h2>Registrar Movimentação</h2><button type='button' @click='movementOpen = false'><ion-icon :icon='closeOutline' /></button></header>
          <form @submit.prevent='registerMovement'><label><span>Produto</span><ion-select v-model='movementForm.productId' interface='popover' placeholder='Selecione'><ion-select-option v-for='product in estoqueStore.produtos' :key='product.id' :value='product.id'>{{ product.nome }}</ion-select-option></ion-select></label>
            <div class='type-buttons'><button v-for='type in movementTypes' :key='type.value' type='button' :class='[type.value, { active: movementForm.type === type.value }]' @click='movementForm.type = type.value'>{{ type.label }}</button></div>
            <label class='quantity-field'><span>Quantidade</span><input v-model.number='movementForm.quantity' type='number' min='1' inputmode='numeric' /></label>
            <label><span>Motivo</span><textarea v-model='movementForm.reason' placeholder='Opcional' /></label>
            <vault-button label='Registrar' loading-label='Registrando...' :loading='registering' :disabled='!movementForm.productId || movementForm.quantity <= 0' @click='registerMovement' />
          </form>
        </ion-content>
      </ion-modal>
      <produto-form-modal :is-open='editOpen' :produto='selectedProduct' :categorias='estoqueStore.categorias' @close='editOpen = false' @saved='loadData' />
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonModal, IonPage, IonRefresher, IonRefresherContent, IonSelect, IonSelectOption, alertController } from '@ionic/vue'
import { add, arrowDownCircleOutline, arrowUpCircleOutline, closeOutline, pencilOutline, reloadOutline, searchOutline, swapHorizontalOutline, trashOutline } from 'ionicons/icons'
import { computed, onMounted, reactive, ref } from 'vue'
import ProdutoFormModal from '@/components/ProdutoFormModal.vue'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { useEstoqueStore } from '@/stores/estoque.store'
import type { ProdutoComCategoria, TipoMovimentacao } from '@/types/database.types'

const estoqueStore = useEstoqueStore()
const { showToast } = useVaultToast()
const tab = ref<'products' | 'movements'>('products')
const search = ref('')
const category = ref('all')
const movementOpen = ref(false)
const editOpen = ref(false)
const registering = ref(false)
const selectedProduct = ref<ProdutoComCategoria | null>(null)
const movementForm = reactive({ productId: '', type: 'entrada' as TipoMovimentacao, quantity: 1, reason: '' })
const movementTypes = [{ value: 'entrada' as const, label: 'Entrada' }, { value: 'saida' as const, label: 'Saída' }, { value: 'ajuste' as const, label: 'Ajuste' }]
const outOfStock = computed(() => estoqueStore.produtos.filter((item) => item.estoque === 0).length)
const filteredProducts = computed(() => { const term = search.value.trim().toLocaleLowerCase('pt-BR'); return estoqueStore.produtos.filter((item) => (!term || item.nome.toLocaleLowerCase('pt-BR').includes(term)) && (category.value === 'all' || item.categoria_id === category.value)) })
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
function formatDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : dateTime.format(date) }
function stockClass(product: ProdutoComCategoria) { return product.estoque === 0 ? 'empty' : product.estoque <= product.estoque_minimo ? 'low' : 'ok' }
function stockLabel(product: ProdutoComCategoria) { return product.estoque === 0 ? 'Sem estoque' : product.estoque <= product.estoque_minimo ? 'Estoque baixo' : 'Em estoque' }
function progressWidth(product: ProdutoComCategoria) { return `${Math.min(100, product.estoque / Math.max(product.estoque_minimo * 3, 1) * 100)}%` }
function movementIcon(type: TipoMovimentacao) { return type === 'entrada' ? arrowDownCircleOutline : type === 'saida' ? arrowUpCircleOutline : swapHorizontalOutline }
function openMovement(product?: ProdutoComCategoria) { movementForm.productId = product?.id || ''; movementForm.type = 'entrada'; movementForm.quantity = 1; movementForm.reason = ''; movementOpen.value = true }
function openEdit(product: ProdutoComCategoria) { selectedProduct.value = product; editOpen.value = true }
async function loadData() { await Promise.all([estoqueStore.fetchProdutos(), estoqueStore.fetchCategorias(), estoqueStore.fetchMovimentacoes()]) }
async function quickMove(product: ProdutoComCategoria, type: 'entrada' | 'saida') { const old = product.estoque; product.estoque += type === 'entrada' ? 1 : -1; try { await estoqueStore.registrarMovimentacao({ produto_id: product.id, tipo: type, quantidade: 1, motivo: 'Ajuste rápido' }); await showToast('Movimentação registrada!', 'success') } catch (error) { product.estoque = old; await showToast(estoqueStore.error || (error instanceof Error ? error.message : 'Erro na movimentação.'), 'error') } }
async function registerMovement() { if (!movementForm.productId || movementForm.quantity <= 0 || registering.value) return; registering.value = true; try { await estoqueStore.registrarMovimentacao({ produto_id: movementForm.productId, tipo: movementForm.type, quantidade: movementForm.quantity, motivo: movementForm.reason.trim() || undefined }); await showToast('Movimentação registrada!', 'success'); movementOpen.value = false } catch (error) { await showToast(estoqueStore.error || (error instanceof Error ? error.message : 'Erro ao registrar movimentação.'), 'error') } finally { registering.value = false } }
async function confirmDelete(product: ProdutoComCategoria) { const alert = await alertController.create({ header: 'Excluir produto?', message: `O produto ${product.nome} será removido.`, buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Excluir', role: 'destructive', handler: async () => { try { await estoqueStore.desativarProduto(product.id); await showToast('Produto excluído!', 'success') } catch { await showToast(estoqueStore.error || 'Erro ao excluir produto.', 'error') } } }] }); await alert.present() }
async function refresh(event: CustomEvent) { await loadData(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadData)
</script>

<style scoped>
.stock-page{--background:var(--vault-color-bg);--color:var(--vault-color-text-1)}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(92px + env(safe-area-inset-bottom))}header{display:flex;align-items:center;justify-content:space-between}header h1{margin:0;font-size:24px;font-weight:700}header>div{display:flex;align-items:center;gap:8px}.movement-button{border:1px solid #991B1B;border-radius:8px;padding:6px 12px;background:var(--vault-color-surface);color:#991B1B;font:600 13px Inter}.add-button{display:grid;width:36px;height:36px;place-items:center;border:0;border-radius:50%;background:#991B1B;color:#FFFFFF}.segments{display:grid;grid-template-columns:repeat(2,1fr);margin-top:16px;border-radius:10px;padding:3px;background:var(--vault-color-surface-muted)}.segments button{height:36px;border:0;border-radius:8px;background:transparent;color:var(--vault-color-text-3);font:400 13px Inter}.segments button.active{background:var(--vault-color-surface);color:var(--vault-color-text-1);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.08)}.summary-cards{display:flex;gap:8px;margin-top:16px}.summary-cards article{display:flex;min-width:0;flex:1;flex-direction:column;align-items:center;border-radius:10px;padding:12px;background:var(--vault-color-surface);box-shadow:0 1px 3px rgba(0,0,0,.06)}.summary-cards strong{font-size:26px}.summary-cards strong.danger{color:#EF4444}.summary-cards strong.warning{color:#F59E0B}.summary-cards span{margin-top:2px;color:var(--vault-color-text-3);font-size:11px;text-align:center}.search-box{position:relative;display:block;margin-top:16px}.search-box ion-icon{position:absolute;top:13px;left:12px;color:var(--vault-color-text-3);font-size:18px}.search-box input{width:100%;height:44px;border:0;border-radius:10px;outline:0;padding:0 14px 0 40px;background:var(--vault-color-surface-muted);color:var(--vault-color-text-1);font:400 14px Inter}.categories{display:flex;gap:8px;margin:12px -20px 0;padding:0 20px;overflow-x:auto;scrollbar-width:none}.categories button{flex:0 0 auto;border:0;border-radius:20px;padding:8px 16px;background:var(--vault-color-surface-muted);color:var(--vault-color-text-2);font:400 13px Inter}.categories button.active{background:#111827;color:#FFFFFF;font-weight:600}.stock-list{margin-top:8px}.stock-item{border-bottom:1px solid var(--vault-color-surface-muted);padding:16px 0}.stock-heading{display:flex;align-items:flex-start;justify-content:space-between}.stock-heading>span{display:flex;min-width:0;flex-direction:column}.stock-heading strong{font-size:14px;font-weight:600}.stock-heading small{margin-top:2px;color:var(--vault-color-text-3);font-size:12px}.stock-heading>div{display:flex}.stock-heading button{border:0;padding:3px 6px;background:transparent;color:var(--vault-color-text-3)}.stock-heading button.delete{color:#EF4444}.stock-heading ion-icon{font-size:18px}.stock-status{display:flex;justify-content:space-between;margin-top:10px}.stock-status b{font-size:11px;font-weight:600}.stock-status span{color:var(--vault-color-text-3);font-size:11px}.ok{color:#22C55E}.low{color:#F59E0B}.empty{color:#EF4444}.progress{height:4px;margin-top:6px;border-radius:2px;background:var(--vault-color-surface-muted)}.progress i{display:block;height:4px;border-radius:2px}.progress i.ok{background:#22C55E}.progress i.low{background:#F59E0B}.progress i.empty{background:#EF4444}.quantity{display:flex;align-items:center;justify-content:flex-end;margin-top:12px}.quantity button{width:32px;height:32px;border:1px solid var(--vault-color-border);border-radius:50%;background:var(--vault-color-surface);color:var(--vault-color-text-1);font:700 18px Inter}.quantity button.plus{border:0;background:#991B1B;color:#FFFFFF}.quantity strong{padding:0 12px;font-size:18px}.movement-list{margin-top:14px}.movement-list article{display:flex;align-items:center;border-bottom:1px solid var(--vault-color-surface-muted);padding:16px 0}.movement-icon{display:grid;width:40px;height:40px;flex:0 0 auto;place-items:center;border-radius:50%}.movement-icon.entrada{background:var(--vault-color-success-soft);color:#22C55E}.movement-icon.saida{background:var(--vault-color-error-soft);color:#EF4444}.movement-icon.ajuste{background:var(--vault-color-info-soft);color:#0EA5E9}.movement-icon ion-icon{font-size:22px}.movement-copy{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.movement-copy strong{font-size:14px}.movement-copy small{margin-top:3px;color:var(--vault-color-text-3);font-size:12px}.movement-value{display:flex;max-width:90px;flex-direction:column;align-items:flex-end}.movement-value strong{font-size:16px}.movement-value small{overflow:hidden;margin-top:3px;color:var(--vault-color-text-3);font-size:11px;text-overflow:ellipsis;white-space:nowrap}.movement-modal{--background:var(--vault-color-surface);--color:var(--vault-color-text-1)}.modal-handle{width:32px;height:4px;margin:12px auto;border-radius:2px;background:var(--vault-color-border)}.movement-modal header{padding:0 20px}.movement-modal header h2{font-size:18px}.movement-modal header button{display:grid;width:28px;height:28px;place-items:center;border:0;border-radius:50%;background:var(--vault-color-surface-muted)}.movement-modal form{display:grid;gap:16px;padding:16px 20px}.movement-modal label{color:var(--vault-color-text-2);font-size:13px}.movement-modal label>span{display:block;margin-bottom:6px}.movement-modal ion-select,.movement-modal input,.movement-modal textarea{width:100%;border:1px solid var(--vault-color-border);border-radius:10px;outline:0;background:var(--vault-color-surface-subtle);color:var(--vault-color-text-1);font:400 14px Inter}.movement-modal ion-select,.movement-modal input{height:52px;padding:0 16px}.movement-modal textarea{height:80px;resize:none;padding:12px 16px}.type-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.type-buttons button{height:42px;border:0;border-radius:10px;background:var(--vault-color-surface-muted);color:var(--vault-color-text-2);font:600 13px Inter}.type-buttons button.entrada.active{background:#22C55E;color:#FFFFFF}.type-buttons button.saida.active{background:#EF4444;color:#FFFFFF}.type-buttons button.ajuste.active{background:#0EA5E9;color:#FFFFFF}.quantity-field input{font-size:24px;font-weight:700;text-align:center}
</style>
