<template>
  <ion-page>
    <ion-content fullscreen class="home-page">
      <div class="home-shell">
        <section class="home-hero">
          <div class="brand-mark">
            <span class="brand-dot" />
            <span>VaultPOS</span>
          </div>

          <h1 v-if="isAdmin">Bem-vindo ao painel administrativo</h1>
          <h1 v-else>Bem-vindo ao seu centro de operação</h1>
          <p v-if="isAdmin">
            Gerencie produtos, estoque, financeiro, usuários e relatórios com um ambiente exclusivo para administração.
          </p>
          <p v-else>
            Acompanhe pedidos, estoque e gestão em uma única experiência, com acesso rápido às áreas de atendimento.
          </p>

          <div class="hero-pills">
            <span>Pedidos</span>
            <span>Estoque</span>
            <span>Pagamentos</span>
          </div>
        </section>

        <div class="home-grid">
          <ion-card v-if="isAdmin" class="feature-card" @click="goToAdmin">
            <ion-card-header>
              <ion-card-title>Painel Admin</ion-card-title>
              <ion-card-subtitle>Gestão completa do negócio</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <p>Produtos, estoque, financeiro, relatórios e usuários em um só lugar.</p>
              <ion-button expand="block">Entrar</ion-button>
            </ion-card-content>
          </ion-card>

          <ion-card class="feature-card" @click="goToGarcom">
            <ion-card-header>
              <ion-card-title>Painel do Usuário</ion-card-title>
              <ion-card-subtitle>Atendimento ágil e organizado</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <p>Comandas, pagamentos e perfil do atendente com fluxo rápido e intuitivo.</p>
              <ion-button expand="block">Entrar</ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <div class="home-actions">
          <ion-button fill="outline" @click="handleLogout">Sair</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonPage,
} from '@ionic/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const isAdmin = computed(() => auth.isAdmin)

const goToAdmin = () => router.push('/admin/dashboard')
const goToGarcom = () => router.push('/garcom/dashboard')

const handleLogout = async () => {
  await auth.logout()
  router.replace('/login')
}
</script>

<style scoped>
.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.home-shell {
  width: min(1180px, 100%);
  display: grid;
  gap: 1.5rem;
}

.home-hero {
  padding: 2rem;
  border-radius: 32px;
  background: linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(8, 8, 8, 0.92) 100%);
  border: 1px solid rgba(255, 122, 26, 0.2);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 122, 26, 0.12);
  color: var(--ion-color-primary);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.82rem;
}

.brand-dot {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
  box-shadow: 0 0 16px rgba(255, 122, 26, 0.6);
}

.home-hero h1 {
  margin: 1.1rem 0 0.7rem;
  font-size: clamp(2rem, 3.5vw, 2.9rem);
  line-height: 1.05;
}

.home-hero p {
  color: #d1d5db;
  max-width: 44rem;
  line-height: 1.7;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.1rem;
}

.hero-pills span {
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 122, 26, 0.12);
  color: var(--ion-color-primary);
  border: 1px solid rgba(255, 122, 26, 0.2);
  font-size: 0.86rem;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  justify-items: center;
  gap: 1.25rem;
}

.feature-card {
  cursor: pointer;
  border-radius: 24px;
  padding: 0.2rem;
  max-width: 420px;
  width: 100%;
}

.feature-card p {
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.home-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .home-page {
    padding: 1rem;
  }

  .home-grid {
    grid-template-columns: 1fr;
  }
}
</style>
