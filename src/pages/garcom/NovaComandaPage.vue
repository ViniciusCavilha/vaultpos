<template>
  <ion-page>
    <ion-content :fullscreen="true" class="page-content">
      <main class="page-shell" :class="{ 'with-cart': step === 2 }">
        <header class="page-header">
          <button type="button" aria-label="Voltar" @click="goBack">
            <ion-icon :icon="chevronBack" />
          </button>
          <h1>Nova Comanda</h1>
        </header>

        <div class="stepper">
          <span :class="{ active: step === 1 }">1 Dados</span>
          <span class="stepper-line"></span>
          <span :class="{ active: step === 2 }">2 Produtos</span>
        </div>

        <section v-if="step === 1" class="data-step">
          <label class="table-label" for="table-number">Número da mesa</label>
          <div class="table-input">
            <input
              id="table-number"
              v-model.number="tableNumber"
              type="number"
              min="1"
              inputmode="numeric"
              aria-label="Número da mesa"
            />
            <span v-if="!tableNumber" class="table-placeholder"></span>
          </div>

          <div class="toggle-row">
            <span>Cliente identificado</span>
            <ion-toggle v-model="identifiedCustomer" aria-label="Cliente identificado" />
          </div>

          <div v-if="identifiedCustomer" class="customer-search">
            <input v-model="customerSearch" type="search" placeholder="Buscar cliente..." />
            <div v-if="filteredCustomers.length" class="customer-results">
              <button
                v-for="customer in filteredCustomers"
                :key="customer.id"
                type="button"
                :class="{ selected: selectedCustomer?.id === customer.id }"
                @click="selectedCustomer = customer"
              >
                {{ customer.nome }}
              </button>
            </div>
            <p v-else-if="customerSearch">Nenhum cliente encontrado.</p>
          </div>

          <label class="notes-field">
            <span>Observações</span>
            <textarea v-model="notes" placeholder="Alguma observação especial?"></textarea>
          </label>

          <VaultButton
            class="next-button"
            label="Próximo: Escolher produtos"
            :disabled="!tableNumber"
            @click="step = 2"
          />
        </section>

        <section v-else class="products-step">
          <div class="search-field">
            <ion-icon :icon="searchOutline" />
            <input v-model="productSearch" type="search" placeholder="Buscar produto..." />
          </div>

          <div class="category-chips">
            <button
              type="button"
              :class="{ active: !selectedCategory }"
              @click="selectedCategory = ''"
            >
              Todos
            </button>
            <button
              v-for="category in estoqueStore.categorias"
              :key="category.id"
              type="button"
              :class="{ active: selectedCategory === category.id }"
              @click="selectedCategory = category.id"
            >
              {{ category.nome }}
            </button>
          </div>

          <VaultSkeleton v-if="estoqueStore.loading" variant="list" />
          <VaultErrorState
            v-else-if="estoqueStore.error"
            :message="estoqueStore.error"
            @retry="loadProducts"
          />
          <VaultEmptyState
            v-else-if="!filteredProducts.length"
            icon="bag-outline"
            title="Sem produtos"
            message="Nenhum produto disponível para esta seleção."
          />
          <div v-else class="product-list">
            <article v-for="product in filteredProducts" :key="product.id" class="product-row">
              <div class="product-image">
                <img v-if="product.imagem" :src="product.imagem" :alt="product.nome" />
                <ion-icon v-else :icon="bagOutline" />
              </div>
              <div class="product-info">
                <strong>{{ product.nome }}</strong>
                <span>{{ formatMoney(product.preco) }}</span>
              </div>
              <div v-if="quantityOf(product.id)" class="quantity-control">
                <button type="button" @click="decrement(product.id)">−</button>
                <strong>{{ quantityOf(product.id) }}</strong>
                <button class="add" type="button" @click="increment(product)">+</button>
              </div>
              <button v-else class="single-add" type="button" aria-label="Adicionar produto" @click="increment(product)">+</button>
            </article>
          </div>
        </section>
      </main>

      <footer v-if="step === 2" class="cart-bar">
        <strong>{{ cartCount }} {{ cartCount === 1 ? 'item' : 'itens' }} · {{ formatMoney(cartTotal) }}</strong>
        <button type="button" :disabled="!cartCount || submitting" @click="openOrder">
          {{ submitting ? 'Abrindo...' : 'Abrir Comanda' }}
        </button>
      </footer>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage, IonToggle } from '@ionic/vue'
import { bagOutline, chevronBack, searchOutline } from 'ionicons/icons'
import VaultButton from '@/components/common/VaultButton.vue'
import VaultEmptyState from '@/components/common/VaultEmptyState.vue'
import VaultErrorState from '@/components/common/VaultErrorState.vue'
import VaultSkeleton from '@/components/common/VaultSkeleton.vue'
import { useVaultToast } from '@/composables/useVaultToast'
import { getClientes } from '@/supabase/queries/clientes'
import { useComandasStore } from '@/stores/comandas.store'
import { useEstoqueStore } from '@/stores/estoque.store'
import { useUserStore } from '@/stores/user.store'

type CartItem = { product: any; quantity: number }

const router = useRouter()
const { showToast } = useVaultToast()
const userStore = useUserStore()
const estoqueStore = useEstoqueStore()
const comandasStore = useComandasStore()
const step = ref(1)
const tableNumber = ref<number | null>(null)
const identifiedCustomer = ref(false)
const customers = ref<any[]>([])
const customerSearch = ref('')
const selectedCustomer = ref<any | null>(null)
const notes = ref('')
const productSearch = ref('')
const selectedCategory = ref('')
const cart = ref<Record<string, CartItem>>({})
const submitting = ref(false)

const filteredCustomers = computed(() => customers.value.filter((customer) =>
  customer.nome.toLocaleLowerCase('pt-BR').includes(customerSearch.value.toLocaleLowerCase('pt-BR')),
).slice(0, 5))
const filteredProducts = computed(() => estoqueStore.produtosAtivos.filter((product) => {
  const matchesSearch = product.nome.toLocaleLowerCase('pt-BR').includes(productSearch.value.toLocaleLowerCase('pt-BR'))
  return matchesSearch && (!selectedCategory.value || product.categoria_id === selectedCategory.value)
}))
const cartCount = computed(() => Object.values(cart.value).reduce((total, item) => total + item.quantity, 0))
const cartTotal = computed(() => Object.values(cart.value).reduce(
  (total, item) => total + item.product.preco * item.quantity,
  0,
))

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}
function quantityOf(productId: string) {
  return cart.value[productId]?.quantity ?? 0
}
function increment(product: any) {
  const existing = cart.value[product.id]
  cart.value = { ...cart.value, [product.id]: { product, quantity: (existing?.quantity ?? 0) + 1 } }
}
function decrement(productId: string) {
  const existing = cart.value[productId]
  if (!existing) return
  const next = { ...cart.value }
  if (existing.quantity <= 1) delete next[productId]
  else next[productId] = { ...existing, quantity: existing.quantity - 1 }
  cart.value = next
}
function goBack() {
  if (step.value === 2) step.value = 1
  else router.back()
}
async function loadProducts() {
  if (!userStore.usuario) await userStore.fetchUsuarioLogado()
  await Promise.all([estoqueStore.fetchProdutos(), estoqueStore.fetchCategorias()])
}
async function openOrder() {
  if (!tableNumber.value || !cartCount.value || submitting.value) return
  submitting.value = true
  try {
    const order = await comandasStore.abrirComanda({
      mesa: tableNumber.value,
      cliente_id: selectedCustomer.value?.id,
      observacoes: notes.value.trim() || undefined,
    })
    if (!order) throw new Error('Não foi possível abrir a comanda.')
    await comandasStore.fetchComandaById(order.id)
    for (const item of Object.values(cart.value)) {
      await comandasStore.adicionarItem({
        produto_id: item.product.id,
        quantidade: item.quantity,
        valor_unitario: item.product.preco,
      })
    }
    await showToast('Comanda aberta!', 'success')
    await router.replace('/garcom/comandas')
  } catch (error) {
    await showToast(error instanceof Error ? error.message : 'Erro ao abrir a comanda.', 'error')
  } finally {
    submitting.value = false
  }
}
onMounted(async () => {
  await loadProducts()
  if (userStore.empresaId) {
    try { customers.value = await getClientes(userStore.empresaId) } catch { customers.value = [] }
  }
})
</script>

<style scoped>
.page-content { --background: #F8FAFC; }
.page-shell { min-height: 100%; padding: calc(52px + env(safe-area-inset-top)) 20px 36px; font-family: 'Inter', sans-serif; }
.page-shell.with-cart { padding-bottom: 104px; }
.page-header { display: flex; align-items: center; gap: 10px; }
.page-header button { display: grid; width: 36px; height: 36px; padding: 0; place-items: center; border: 0; background: transparent; color: #111827; }
.page-header ion-icon { width: 24px; height: 24px; }
h1 { margin: 0; color: #111827; font-size: 20px; font-weight: 700; letter-spacing: 0; }
.stepper { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 16px; color: #9CA3AF; font-size: 13px; }
.stepper span { font-weight: 400; }
.stepper span.active { color: #991B1B; font-weight: 600; }
.stepper-line { width: 40px; border-top: 1px dashed #E5E7EB; }
.table-label { display: block; margin-top: 32px; color: #9CA3AF; font-size: 11px; font-weight: 600; text-align: center; text-transform: uppercase; }
.table-input { position: relative; height: 96px; margin-top: 8px; border-radius: 12px; background: #F8FAFC; }
.table-input input { width: 100%; height: 100%; border: 0; outline: 0; background: transparent; color: #111827; font: 700 48px 'Inter', sans-serif; text-align: center; }
.table-input input::-webkit-inner-spin-button { appearance: none; }
.table-placeholder { position: absolute; bottom: 20px; left: 50%; width: 40px; height: 2px; transform: translateX(-50%); background: #D1D5DB; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; color: #111827; font-size: 14px; font-weight: 600; }
.toggle-row ion-toggle { --track-background-checked: #991B1B; }
.customer-search { margin-top: 12px; }
.customer-search > input, .search-field input { width: 100%; height: 48px; padding: 0 16px; border: 1px solid #E5E7EB; border-radius: 10px; outline: 0; background: #F8FAFC; color: #111827; font: 400 14px 'Inter', sans-serif; }
.customer-results { display: grid; gap: 4px; margin-top: 6px; }
.customer-results button { padding: 10px 12px; border: 1px solid #E5E7EB; border-radius: 8px; background: #FFFFFF; color: #111827; text-align: left; }
.customer-results button.selected { border-color: #991B1B; color: #991B1B; }
.customer-search p { color: #9CA3AF; font-size: 13px; }
.notes-field { display: block; margin-top: 20px; color: #6B7280; font-size: 13px; }
.notes-field span { display: block; margin-bottom: 6px; }
.notes-field textarea { width: 100%; height: 80px; padding: 12px 16px; resize: none; border: 1px solid #E5E7EB; border-radius: 10px; outline: 0; background: #F8FAFC; color: #111827; font: 400 14px 'Inter', sans-serif; }
.next-button { margin-top: 32px; }
.search-field { position: relative; margin-top: 24px; }
.search-field ion-icon { position: absolute; top: 50%; left: 14px; z-index: 1; width: 18px; height: 18px; transform: translateY(-50%); color: #9CA3AF; }
.search-field input { padding-left: 42px; border: 0; background: #F3F4F6; }
.category-chips { display: flex; gap: 8px; margin: 12px -20px 16px; padding: 0 20px; overflow-x: auto; scrollbar-width: none; }
.category-chips button { flex: 0 0 auto; padding: 8px 16px; border: 0; border-radius: 20px; background: #F3F4F6; color: #6B7280; font: 400 13px 'Inter', sans-serif; }
.category-chips button.active { background: #111827; color: #FFFFFF; font-weight: 600; }
.product-list { border-radius: 12px; background: #FFFFFF; }
.product-row { display: flex; align-items: center; gap: 12px; padding: 14px 12px; border-bottom: 1px solid #F3F4F6; }
.product-row:last-child { border-bottom: 0; }
.product-image { display: grid; width: 56px; height: 56px; flex: 0 0 auto; overflow: hidden; place-items: center; border-radius: 8px; background: #F9FAFB; color: #9CA3AF; }
.product-image img { width: 100%; height: 100%; object-fit: cover; }
.product-image ion-icon { width: 24px; height: 24px; }
.product-info { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
.product-info strong { overflow: hidden; color: #111827; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.product-info span { color: #6B7280; font-size: 13px; }
.single-add, .quantity-control button { display: grid; width: 32px; height: 32px; padding: 0; place-items: center; border: 0; border-radius: 50%; background: #991B1B; color: #FFFFFF; font: 600 20px 'Inter', sans-serif; }
.quantity-control { display: flex; align-items: center; gap: 8px; }
.quantity-control button:first-child { border: 1px solid #E5E7EB; background: #FFFFFF; color: #111827; }
.quantity-control strong { min-width: 16px; color: #111827; font-size: 15px; text-align: center; }
.cart-bar { position: fixed; right: 0; bottom: calc(56px + env(safe-area-inset-bottom)); left: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid #E5E7EB; background: #FFFFFF; font-family: 'Inter', sans-serif; }
.cart-bar strong { color: #111827; font-size: 14px; font-weight: 600; }
.cart-bar button { padding: 10px 20px; border: 0; border-radius: 10px; background: #991B1B; color: #FFFFFF; font: 600 14px 'Inter', sans-serif; }
.cart-bar button:disabled { background: #E5E7EB; color: #9CA3AF; }
</style>
