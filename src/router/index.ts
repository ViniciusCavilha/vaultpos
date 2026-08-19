import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';

const TabsAdmin = () => import('../views/TabsAdmin.vue')
const TabsGarcom = () => import('../views/TabsGarcom.vue')
const LoginPage = () => import('../pages/auth/LoginPage.vue')
const RegisterPage = () => import('../pages/auth/RegisterPage.vue')
const ForgotPasswordPage = () => import('../pages/auth/ForgotPasswordPage.vue')
const DashboardAdmin = () => import('../pages/admin/DashboardAdmin.vue')
const EmpresaPage = () => import('../pages/admin/EmpresaPage.vue')
const EstoqueAdminPage = () => import('../pages/admin/EstoquePage.vue')
const FinanceiroPage = () => import('../pages/admin/FinanceiroPage.vue')
const ProdutosPage = () => import('../pages/admin/ProdutosPage.vue')
const RelatoriosPage = () => import('../pages/admin/RelatoriosPage.vue')
const UsuariosPage = () => import('../pages/admin/UsuariosPage.vue')
const ConfiguracoesPage = () => import('../pages/admin/ConfiguracoesPage.vue')
const DashboardGarcom = () => import('../pages/garcom/DashboardGarcom.vue')
const ComandasPage = () => import('../pages/garcom/ComandasPage.vue')
const ComandaDetalhesPage = () => import('../pages/garcom/ComandaDetalhesPage.vue')
const NovaComandaPage = () => import('../pages/garcom/NovaComandaPage.vue')
const PagamentosPage = () => import('../pages/garcom/PagamentosPage.vue')
const EstoqueGarcomPage = () => import('../pages/garcom/EstoquePage.vue')
const PerfilPage = () => import('../pages/garcom/PerfilPage.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { publicOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { publicOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordPage,
    meta: { publicOnly: true }
  },
  {
    path: '/admin',
    component: TabsAdmin,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: DashboardAdmin
      },
      {
        path: 'empresa',
        name: 'AdminEmpresa',
        component: EmpresaPage
      },
      {
        path: 'estoque',
        name: 'AdminEstoque',
        component: EstoqueAdminPage
      },
      {
        path: 'financeiro',
        name: 'AdminFinanceiro',
        component: FinanceiroPage
      },
      {
        path: 'produtos',
        name: 'AdminProdutos',
        component: ProdutosPage
      },
      {
        path: 'relatorios',
        name: 'AdminRelatorios',
        component: RelatoriosPage
      },
      {
        path: 'usuarios',
        name: 'AdminUsuarios',
        component: UsuariosPage
      },
      {
        path: 'configuracoes',
        name: 'AdminConfiguracoes',
        component: ConfiguracoesPage
      }
    ]
  },
  {
    path: '/garcom',
    component: TabsGarcom,
    meta: { requiresAuth: true, role: 'garcom' },
    children: [
      {
        path: '',
        redirect: '/garcom/dashboard'
      },
      {
        path: 'dashboard',
        name: 'GarcomDashboard',
        component: DashboardGarcom
      },
      {
        path: 'comandas',
        name: 'GarcomComandas',
        component: ComandasPage
      },
      {
        path: 'comandas/nova',
        name: 'GarcomNovaComanda',
        component: NovaComandaPage
      },
      {
        path: 'comandas/:id',
        name: 'GarcomComandaDetalhes',
        component: ComandaDetalhesPage
      },
      {
        path: 'pagamentos',
        name: 'GarcomPagamentos',
        component: PagamentosPage
      },
      {
        path: 'estoque',
        name: 'GarcomEstoque',
        component: EstoqueGarcomPage
      },
      {
        path: 'perfil',
        name: 'GarcomPerfil',
        component: PerfilPage
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  await authStore.init()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (authStore.isAuthenticated && !userStore.usuario) {
    try {
      await userStore.fetchUsuarioLogado()
    } catch {
      if (to.meta.requiresAuth) {
        await authStore.logout()
        userStore.clear()
        return '/login'
      }
    }
  }

  if (to.meta.publicOnly && userStore.usuario) {
    return userStore.isAdmin ? '/admin/dashboard' : '/garcom/dashboard'
  }

  if (to.meta.role === 'admin' && !userStore.isAdmin) {
    return '/garcom/dashboard'
  }

  if (to.meta.role === 'garcom' && !userStore.isGarcom) {
    return '/admin/dashboard'
  }
})

export default router
