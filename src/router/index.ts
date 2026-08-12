import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useUserStore } from '@/stores/user.store';

import TabsAdmin from '../views/TabsAdmin.vue';
import TabsGarcom from '../views/TabsGarcom.vue';
import LoginPage from '../pages/auth/LoginPage.vue';
import RegisterPage from '../pages/auth/RegisterPage.vue';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.vue';
import DashboardAdmin from '../pages/admin/DashboardAdmin.vue';
import EmpresaPage from '../pages/admin/EmpresaPage.vue';
import EstoqueAdminPage from '../pages/admin/EstoquePage.vue';
import FinanceiroPage from '../pages/admin/FinanceiroPage.vue';
import ProdutosPage from '../pages/admin/ProdutosPage.vue';
import RelatoriosPage from '../pages/admin/RelatoriosPage.vue';
import UsuariosPage from '../pages/admin/UsuariosPage.vue';
import ConfiguracoesPage from '../pages/admin/ConfiguracoesPage.vue';
import MaisPage from '../pages/admin/MaisPage.vue';
import DashboardGarcom from '../pages/garcom/DashboardGarcom.vue';
import ComandasPage from '../pages/garcom/ComandasPage.vue';
import ComandaDetalhesPage from '../pages/garcom/ComandaDetalhesPage.vue';
import NovaComandaPage from '../pages/garcom/NovaComandaPage.vue';
import PagamentosPage from '../pages/garcom/PagamentosPage.vue';
import EstoqueGarcomPage from '../pages/garcom/EstoquePage.vue';
import PerfilPage from '../pages/garcom/PerfilPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/home',
    redirect: () => {
      const auth = useAuthStore()
      return auth.isAdmin ? '/admin/dashboard' : '/garcom/dashboard'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordPage
  },
  {
    path: '/admin',
    component: TabsAdmin,
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
      },
      {
        path: 'mais',
        name: 'AdminMais',
        component: MaisPage
      }
    ]
  },
  {
    path: '/garcom',
    component: TabsGarcom,
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
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: () => {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) return '/login'
      return auth.isAdmin ? '/admin/dashboard' : '/garcom/dashboard'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    try {
      await auth.init()
    } catch (error) {
      console.error('Erro ao inicializar guarda de rota:', error)
    }
  }

  const isPublicRoute = to.path === '/' || to.path === '/login' || to.path === '/register' || to.path === '/forgot-password'
  const isPrivateRoute = to.path.startsWith('/admin') || to.path.startsWith('/garcom') || to.path === '/home'
  const isAdminRoute = to.path.startsWith('/admin')
  const isAuthRoute = to.path === '/home'
  const isGoogleRegistrationRoute = to.path === '/register' && to.query.google === '1'

  if (!auth.isAuthenticated && isPrivateRoute) {
    return '/login'
  }
  // Garante que os dados do usuário logado estejam carregados
  if (auth.isAuthenticated) {
    const userStore = useUserStore()
    if (!userStore.usuario) {
      const timeout = new Promise((resolve) => setTimeout(resolve, 5000))
      try {
        await Promise.race([userStore.fetchUsuarioLogado(), timeout])
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err)
      }
    }
  }
















  if (!auth.isAuthenticated && isPublicRoute && to.path !== '/') {

    return true
  }



  if (!auth.isAuthenticated && to.path === '/') {
    return '/login'
  }

  if (auth.isAuthenticated && to.path === '/') {
    return auth.isAdmin ? '/admin/dashboard' : '/garcom/dashboard'
  }

  if (auth.isAuthenticated && isGoogleRegistrationRoute) {
    return true
  }

  if (auth.isAuthenticated && isPublicRoute) {
    return auth.isAdmin ? '/admin/dashboard' : '/garcom/dashboard'
  }

  if (auth.isAuthenticated && isAdminRoute && !auth.isAdmin) {
    return '/garcom/dashboard'
  }

  if (auth.isAuthenticated && isAuthRoute) {
    return true
  }

  return true
})

export default router
