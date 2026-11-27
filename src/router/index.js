import AppLayout from '@/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/organizacoes',
                    name: 'organizacoes',
                    component: () => import('@/views/pages/Organizacoes/OrganizacaoList.vue')
                },    
                {
                    path: '/ano-exercicios',
                    name: 'ano-exercicios',
                    component: () => import('@/views/pages/AnoExercicios/AnoExercicioList.vue')
                },   
                {
                    path: '/escolaridades',
                    name: 'escolaridades',
                    component: () => import('@/views/pages/Escolaridades/EscolaridadeList.vue')
                },
                {
                    path: '/equipes',
                    name: 'equipes',
                    component: () => import('@/views/pages/Equipes/EquipeList.vue')
                },
                // --- Módulos de Controle de Acesso (ACL) ---
                {
                    path: '/acl/usuarios',
                    name: 'acl-usuarios',
                    component: () => import('@/views/pages/Usuarios/UsuarioList.vue')
                },  
                {
                    path: '/acl/entidades',
                    name: 'acl-entidades',
                    component: () => import('@/views/pages/Entidades/EntidadeList.vue')
                },                              
                {
                    path: '/acl/perfis',
                    name: 'acl-perfis',
                    component: () => import('@/views/pages/Perfis/PerfilList.vue')
                },
                {
                    path: '/acl/audit',
                    name: 'acl-audit',
                    component: () => import('@/views/pages/Audit/AuditList.vue')
                },
                {
                    path: '/acl/modulos',
                    name: 'acl-modulos',
                    component: () => import('@/views/pages/Modulos/ModuloList.vue')
                },
                {
                    path: '/menus',
                    name: 'menus',
                    // component: () => import('@/views/pages/Menus/MenuTreeView.vue')
                    component: () => import('@/views/pages/Menus/MenuTabs.vue')

                },             
                // --- UI Kit & Blocks ---
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },
                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/blocks/free',
                    name: 'blocks',
                    meta: {
                        breadcrumb: ['Prime Blocks', 'Free Blocks']
                    },
                    component: () => import('@/views/utilities/Blocks.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/start/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                }
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue'),
            meta: { public: true }
        },
        {
            path: '/auth/definir-senha',
            name: 'definirSenha',
            component: () => import('@/views/pages/auth/DefinirSenha.vue'),
            meta: { public: true }
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue'),
            meta: { public: true }
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue'),
            meta: { public: true }
        }
    ]
});

router.beforeEach(async (to) => {
    const auth = useAuthStore();

    // Rotas públicas: não força fetchMe; se já carregou, respeita o estado.
    if (to.meta.public) {
        if (auth.isAuthenticated && to.name === 'login') return { name: 'dashboard' };
        return true;
    }

    if (!auth.loaded) {
        try {
            await auth.fetchMe();
        } catch {
            /* sem sessão */
        }
    }

    if (!auth.isAuthenticated) return { name: 'login' };

    if (auth.precisaTrocarSenha && to.name !== 'definirSenha') {
        return { name: 'definirSenha' };
    }

    return true;
});

export default router;