<template>
  <ion-page>
    <ion-content fullscreen class="new-order-page">
      <main class="page-shell" :class="{ 'with-cart': step === 2 }">
        <header><button type="button" aria-label="Voltar" @click="goBack"><ion-icon :icon="chevronBackOutline" /></button><h1>Nova Comanda</h1></header>
        <div class="stepper"><span :class="{ active: step === 1 }">1 Dados</span><i /><span :class="{ active: step === 2 }">2 Produtos</span></div>

        <section v-if="step === 1" class="data-step">
          <label class="section-label">NÚMERO DA MESA</label>
          <div class="table-input"><input v-model.number="tableNumber" type="number" min="1" inputmode="numeric" aria-label="Número da mesa" /><i v-if="!tableNumber" /></div>
          <div class="identified-row"><strong>Cliente identificado</strong><ion-toggle v-model="identified" /></div>
          <div v-if="identified" class="client-picker">
            <input v-model="clientSearch" type="search" placeholder="Buscar cliente..." />
            <button v-for="client in filteredClients" :key="client.id" type="button" :class="{ selected: selectedClient?.id === client.id }" @click="selectedClient = client">{{ client.nome }}</button>
            <small v-if="!clients.length">Nenhum cliente disponível.</small>
          </div>
          <label class="notes-field"><span>Observações</span><textarea v-model="notes" placeholder="Alguma observação especial?" /></label>
          <vault-button class="next-button" label="Próximo: Escolher produtos" :disabled="!tableNumber" @click="step = 2" />
        </section>

        <section v-else class="products-step">
          <ion-searchbar v-model="search" placeholder="Buscar produto..." :debounce="150" />
          <div class="categories"><button type="button" :class="{ active: !category }" @click="category = ''">Todos</button><button v-for="item in estoqueStore.categorias" :key="item.id" type="button" :class="{ active: category === item.id }" @click="category = item.id">{{ item.nome }}</button></div>
          <vault-skeleton v-if="estoqueStore.loading" variant="list" />
          <vault-error-state v-else-if="estoqueStore.error" :message="estoqueStore.error" @retry="loadProducts" />
          <vault-empty-state v-else-if="!filteredProducts.length" icon="bag-outline" title="Sem produtos" message="Nenhum produto encontrado para os filtros selecionados." />
          <div v-else class="products-list">
            <article v-for="product in filteredProducts" :key="product.id" class="product-row">
              <div class="product-image"><img v-if="product.imagem" :src="product.imagem" :alt="product.nome" /><ion-icon v-else :icon="cubeOutline" /></div>
              <div class="product-copy"><strong>{{ product.nome }}</strong><span>{{ formatCurrency(product.preco) }}</span></div>
              <div v-if="quantity(product.id)" class="quantity-control"><button type="button" @click="decrement(product)">−</button><b>{{ quantity(product.id) }}</b><button class="add" type="button" @click="increment(product)">+</button></div>
              <button v-else class="add-single" type="button" aria-label="Adicionar produto" @click="increment(product)">+</button>
            </article>
          </div>
        </section>
      </main>

      <footer v-if="step === 2" class="cart-bar"><strong>{{ totalItems }} itens • {{ formatCurrency(totalValue) }}</strong><button type="button" :disabled="!totalItems || submitting" @click="submitOrder">{{ submitting ? 'Abrindo...' : 'Abrir Comanda' }}</button></footer>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonPage, IonSearchbar, IonToggle } from '@ionic/vue'
import { chevronBackOutline, cubeOutline } from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { getClientes } from '@/supabase/queries/clientes'
import { useComandasStore } from '@/stores/comandas.store'
import { useEstoqueStore } from '@/stores/estoque.store'
import { useUserStore } from '@/stores/user.store'
import type { Cliente, ProdutoComCategoria } from '@/types/database.types'

type CartEntry = { product: ProdutoComCategoria; quantity: number }
const router = useRouter()
const estoqueStore = useEstoqueStore()
const comandasStore = useComandasStore()
const userStore = useUserStore()
const { showToast } = useVaultToast()
const step = ref(1)
const tableNumber = ref<number | null>(null)
const identified = ref(false)
const clientSearch = ref('')
const selectedClient = ref<Cliente | null>(null)
const clients = ref<Cliente[]>([])
const notes = ref('')
const search = ref('')
const category = ref('')
const cart = ref<Record<string, CartEntry>>({})
const submitting = ref(false)
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const filteredClients = computed(() => clients.value.filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(clientSearch.value.toLocaleLowerCase('pt-BR'))).slice(0, 5))
const filteredProducts = computed(() => estoqueStore.produtos.filter((item) => (!category.value || item.categoria_id === category.value) && item.nome.toLocaleLowerCase('pt-BR').includes(search.value.toLocaleLowerCase('pt-BR'))))
const totalItems = computed(() => Object.values(cart.value).reduce((sum, item) => sum + item.quantity, 0))
const totalValue = computed(() => Object.values(cart.value).reduce((sum, item) => sum + item.quantity * Number(item.product.preco), 0))
function formatCurrency(value: number) { return currency.format(Number(value) || 0) }
function quantity(id: string) { return cart.value[id]?.quantity || 0 }
function increment(product: ProdutoComCategoria) { const current = cart.value[product.id]; cart.value = { ...cart.value, [product.id]: { product, quantity: (current?.quantity || 0) + 1 } } }
function decrement(product: ProdutoComCategoria) { const current = cart.value[product.id]; if (!current) return; const next = { ...cart.value }; if (current.quantity <= 1) delete next[product.id]; else next[product.id] = { product, quantity: current.quantity - 1 }; cart.value = next }
function goBack() { if (step.value === 2) step.value = 1; else router.back() }
async function loadProducts() { await Promise.all([estoqueStore.fetchProdutos(), estoqueStore.fetchCategorias()]) }
async function submitOrder() {
  if (!tableNumber.value || !totalItems.value || submitting.value) return
  submitting.value = true
  try {
    const order = await comandasStore.abrirComanda({ mesa: tableNumber.value, cliente_id: identified.value ? selectedClient.value?.id : undefined, observacoes: notes.value.trim() || undefined })
    if (!order) throw new Error('Não foi possível criar a comanda. Verifique o usuário e a empresa vinculados.')
    await comandasStore.fetchComandaById(order.id)
    for (const entry of Object.values(cart.value)) await comandasStore.adicionarItem({ produto_id: entry.product.id, quantidade: entry.quantity, valor_unitario: Number(entry.product.preco) })
    await showToast('Comanda aberta!', 'success')
    await router.replace('/garcom/comandas')
  } catch (error) { await showToast(comandasStore.error || (error instanceof Error ? error.message : 'Erro ao abrir comanda.'), 'error') } finally { submitting.value = false }
}
onMounted(async () => { await loadProducts(); if (userStore.empresaId) { try { clients.value = await getClientes(userStore.empresaId) } catch { clients.value = [] } } })
</script>

<style scoped>
.new-order-page{--background:var(--vault-color-bg);--color:var(--vault-color-text-1)}.page-shell{min-height:100%;padding:calc(56px + env(safe-area-inset-top)) 20px calc(104px + env(safe-area-inset-bottom))}.page-shell.with-cart{padding-bottom:96px}header{display:flex;align-items:center}header button{display:grid;width:36px;height:36px;place-items:center;border:0;background:transparent;color:var(--vault-color-text-1)}header ion-icon{font-size:22px}header h1{margin:0 0 0 4px;font-size:20px;font-weight:700}.stepper{display:flex;align-items:center;justify-content:center;margin-top:16px;color:var(--vault-color-text-3);font-size:13px}.stepper span{font-weight:400}.stepper span.active{color:#991B1B;font-weight:600}.stepper i{width:40px;margin:0 12px;border-top:1px dashed var(--vault-color-border)}.section-label{display:block;margin-top:32px;color:var(--vault-color-text-3);font-size:11px;font-weight:600;letter-spacing:.5px}.table-input{position:relative;display:grid;height:96px;margin-top:8px;place-items:center;border-radius:12px;background:var(--vault-color-bg)}.table-input input{width:100%;height:100%;border:0;outline:0;background:transparent;color:var(--vault-color-text-1);font:700 48px Inter;text-align:center}.table-input input::-webkit-inner-spin-button{display:none}.table-input i{position:absolute;width:40px;height:2px;background:var(--vault-color-placeholder)}.identified-row{display:flex;align-items:center;justify-content:space-between;margin-top:24px}.identified-row strong{font-size:14px;font-weight:600}.identified-row ion-toggle{--track-background-checked:#991B1B}.client-picker{display:flex;flex-direction:column;margin-top:10px}.client-picker input,.notes-field textarea{border:1px solid var(--vault-color-border);border-radius:10px;outline:0;background:var(--vault-color-bg);color:var(--vault-color-text-1);font:400 14px Inter}.client-picker input{height:48px;padding:0 16px}.client-picker>button{border:0;border-bottom:1px solid var(--vault-color-surface-muted);padding:10px 12px;background:var(--vault-color-surface);color:var(--vault-color-text-1);text-align:left}.client-picker>button.selected{background:var(--vault-color-primary-soft);color:#991B1B;font-weight:600}.client-picker small{padding:8px;color:var(--vault-color-text-3)}.notes-field{display:block;margin-top:20px;color:var(--vault-color-text-2);font-size:13px}.notes-field span{display:block;margin-bottom:6px}.notes-field textarea{width:100%;height:80px;resize:none;padding:12px 16px}.next-button{margin-top:32px}.products-step ion-searchbar{margin-top:20px;padding:0;--background:var(--vault-color-surface-muted);--border-radius:10px;--box-shadow:none;--color:var(--vault-color-text-1);--placeholder-color:var(--vault-color-text-3)}.categories{display:flex;gap:8px;margin:12px -20px 16px;padding:0 20px;overflow-x:auto;scrollbar-width:none}.categories button{flex:0 0 auto;border:0;border-radius:20px;padding:8px 16px;background:var(--vault-color-surface-muted);color:var(--vault-color-text-2);font:400 13px Inter}.categories button.active{background:#111827;color:#FFFFFF;font-weight:600}.products-list{overflow:hidden;border-radius:12px;background:var(--vault-color-surface)}.product-row{display:flex;align-items:center;border-bottom:1px solid var(--vault-color-surface-muted);padding:12px}.product-row:last-child{border:0}.product-image{display:grid;width:56px;height:56px;flex:0 0 auto;overflow:hidden;place-items:center;border-radius:8px;background:var(--vault-color-surface-subtle);color:var(--vault-color-text-3)}.product-image img{width:100%;height:100%;object-fit:cover}.product-image ion-icon{font-size:24px}.product-copy{display:flex;min-width:0;flex:1;flex-direction:column;margin-left:12px}.product-copy strong{overflow:hidden;color:var(--vault-color-text-1);font-size:14px;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.product-copy span{margin-top:3px;color:var(--vault-color-text-2);font-size:13px}.add-single,.quantity-control button{width:32px;height:32px;border:0;border-radius:50%;font:700 18px Inter}.add-single,.quantity-control .add{background:#991B1B;color:#FFFFFF}.quantity-control{display:flex;align-items:center;gap:8px}.quantity-control button{border:1px solid var(--vault-color-border);background:var(--vault-color-surface);color:var(--vault-color-text-1)}.quantity-control b{min-width:14px;color:var(--vault-color-text-1);font-size:15px;text-align:center}.cart-bar{position:fixed;z-index:5;right:0;bottom:calc(56px + env(safe-area-inset-bottom));left:0;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--vault-color-border);padding:12px 20px;background:var(--vault-color-surface)}.cart-bar strong{color:var(--vault-color-text-1);font-size:14px;font-weight:600}.cart-bar button{border:0;border-radius:10px;padding:10px 20px;background:#991B1B;color:#FFFFFF;font:600 14px Inter}.cart-bar button:disabled{background:var(--vault-color-border);color:var(--vault-color-text-3)}
</style>
