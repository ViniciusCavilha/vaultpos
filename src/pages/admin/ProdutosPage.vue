<template>
  <ion-page>
    <ion-content fullscreen class='products-page'>
      <ion-refresher slot='fixed' @ion-refresh='refresh'><ion-refresher-content /></ion-refresher>
      <main class='page-shell'>
        <header><h1>Produtos</h1><button type='button' aria-label='Novo produto' @click='openCreate'><ion-icon :icon='add' /></button></header>
        <label class='search-box'><ion-icon :icon='searchOutline' /><input v-model='search' type='search' placeholder='Buscar produto...' /></label>
        <div class='categories'><button type='button' :class='{ active: category === `all` }' @click='category = `all`'>Todos</button><button v-for='item in estoqueStore.categorias' :key='item.id' type='button' :class='{ active: category === item.id }' @click='category = item.id'>{{ item.nome }}</button></div>
        <vault-skeleton v-if='estoqueStore.loading' variant='list' />
        <vault-error-state v-else-if='estoqueStore.error' :message='estoqueStore.error' @retry='loadData' />
        <vault-empty-state v-else-if='!filteredProducts.length' icon='bag-outline' title='Sem produtos' message='Seu catálogo está vazio. Adicione produtos para exibi-los aqui.' button-text='Adicionar Produto' @action='openCreate' />
        <section v-else class='product-list'>
          <button v-for='product in filteredProducts' :key='product.id' type='button' @click='openEdit(product)'>
            <span class='product-icon'><img v-if='product.imagem' :src='product.imagem' :alt='product.nome' /><ion-icon v-else :icon='bagOutline' /></span>
            <span class='product-copy'><strong>{{ product.nome }}</strong><small>{{ product.categorias?.nome || 'Sem categoria' }}</small><i v-if='product.estoque <= product.estoque_minimo' :class='{ empty: product.estoque === 0 }'>{{ product.estoque === 0 ? 'Sem estoque' : 'Estoque baixo' }}</i></span>
            <b>{{ formatCurrency(product.preco) }}</b><ion-icon class='chevron' :icon='chevronForwardOutline' />
          </button>
        </section>
      </main>
      <produto-form-modal :is-open='modalOpen' :produto='selectedProduct' :categorias='estoqueStore.categorias' @close='closeModal' @saved='loadData' />
    </ion-content>
  </ion-page>
</template>

<script setup lang='ts'>
import { IonContent, IonIcon, IonPage, IonRefresher, IonRefresherContent } from '@ionic/vue'
import { add, bagOutline, chevronForwardOutline, searchOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import ProdutoFormModal from '@/components/ProdutoFormModal.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useEstoqueStore } from '@/stores/estoque.store'
import type { ProdutoComCategoria } from '@/types/database.types'

const estoqueStore = useEstoqueStore()
const search = ref('')
const category = ref('all')
const modalOpen = ref(false)
const selectedProduct = ref<ProdutoComCategoria | null>(null)
const filteredProducts = computed(() => { const term = search.value.trim().toLocaleLowerCase('pt-BR'); return estoqueStore.produtos.filter((item) => (!term || item.nome.toLocaleLowerCase('pt-BR').includes(term)) && (category.value === 'all' || item.categoria_id === category.value)) })
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
function openCreate() { selectedProduct.value = null; modalOpen.value = true }
function openEdit(product: ProdutoComCategoria) { selectedProduct.value = product; modalOpen.value = true }
function closeModal() { modalOpen.value = false; selectedProduct.value = null }
async function loadData() { await Promise.all([estoqueStore.fetchProdutos(), estoqueStore.fetchCategorias()]) }
async function refresh(event: CustomEvent) { await loadData(); (event.target as HTMLIonRefresherElement).complete() }
onMounted(loadData)
</script>

<style scoped>
.products-page{--background:#F8FAFC;--color:#111827}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px 36px}header{display:flex;align-items:center;justify-content:space-between}header h1{margin:0;font-size:24px;font-weight:700}header button{display:grid;width:40px;height:40px;place-items:center;border:0;border-radius:50%;background:#991B1B;color:#FFFFFF}header ion-icon{font-size:22px}.search-box{position:relative;display:block;margin-top:16px}.search-box ion-icon{position:absolute;top:13px;left:12px;color:#9CA3AF;font-size:18px}.search-box input{width:100%;height:44px;border:0;border-radius:10px;outline:0;padding:0 14px 0 40px;background:#F3F4F6;color:#111827;font:400 14px Inter}.search-box input::placeholder{color:#D1D5DB}.categories{display:flex;gap:8px;margin:12px -20px 0;padding:0 20px;overflow-x:auto;scrollbar-width:none}.categories button{flex:0 0 auto;border:0;border-radius:20px;padding:8px 16px;background:#F3F4F6;color:#6B7280;font:400 13px Inter}.categories button.active{background:#111827;color:#FFFFFF;font-weight:600}.product-list{margin-top:12px}.product-list>button{display:flex;width:100%;align-items:center;border:0;border-bottom:1px solid #F3F4F6;padding:14px 0;background:transparent;text-align:left}.product-icon{display:grid;width:48px;height:48px;flex:0 0 auto;overflow:hidden;place-items:center;border-radius:8px;background:#F3F4F6;color:#9CA3AF}.product-icon img{width:100%;height:100%;object-fit:cover}.product-icon ion-icon{font-size:22px}.product-copy{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.product-copy strong{overflow:hidden;color:#111827;font-size:14px;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.product-copy small{margin-top:2px;color:#9CA3AF;font-size:12px}.product-copy i{align-self:flex-start;margin-top:4px;border-radius:4px;padding:2px 6px;background:#FEF3C7;color:#D97706;font-size:11px;font-style:normal;font-weight:600}.product-copy i.empty{background:#FEE2E2;color:#DC2626}.product-list>button>b{margin-left:8px;color:#111827;font-size:14px;font-weight:600;white-space:nowrap}.product-list .chevron{margin-left:7px;color:#D1D5DB;font-size:16px}
</style>
