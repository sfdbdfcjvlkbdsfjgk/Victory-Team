import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
// 路由配置
const routes: RouteRecordRaw[] = [
    {
        // 根路径重定向到仪表板
        path: '/',
        redirect: '/dashboard'
    },   
     {
        // 登录页
        path: '/login',
        name: 'Login',
        component: () => import('@/views/txs/Login.vue')
    },
    {
        // 仪表板/首页
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        children: [
            {
                path: 'account/system',
                name: 'SystemAccount',
                component: () => import('@/views/txs/SystemAccount.vue')
            },
            {
                   path: 'account/quanxian',
                name: 'Quanxian',
                component: () => import('@/views/txs/Quanxian.vue')
            },
            {
                path: 'account/role',
                name: 'RoleManagement',
                component: () => import('@/views/txs/RoleManagement.vue')
            },
            {
                path: 'operation',
                name: 'OperationManagement',
                component: () => import('@/views/fjl/OperationManagement.vue')
            },
            {
                path: 'operation/banner-create',
                name: 'BannerCreate',
                component: () => import('@/views/fjl/BannerCreate.vue')
            },
            {
                path: 'operation/banner-sort',
                name: 'BannerSort',
                component: () => import('@/views/fjl/BannerSort.vue')
            },
            {
                path: 'activity',
                name: 'ActivityManagement',
                component: () => import('@/views/dcy/ActivityManagement.vue')
            },
            {
                path: 'activity/publish-normal',
                name: 'PublishNormal',
                component: () => import('@/views/wsj/PublishNormal.vue')
            },
            {
                path: 'activity/publish-event',
                name: 'PublishEvent',
                component: () => import('@/views/wsj/PublishEvent.vue')
            },
            {
                path: 'activity/create',
                name: 'CreateActivity',
                component: () => import('@/views/dcy/CreateActivity.vue')
            },
            {
                path: 'activity/registration',
                name: 'Registration',
                component: () => import('@/views/dcy/Registration.vue')
            },

              {
                path: 'account',
                name: 'Accounts',
                component: () => import('@/views/txs/account.vue')
            },

        ]
    }
]

// 创建路由实例 
const router = createRouter({
    history: createWebHistory(), // 使用HTML5 History模式
    routes
})
router.beforeEach((to, _from, next) => {
  document.title = to.meta?.title ? `${to.meta.title} - 全民健身运营管理后台` : '全民健身运营管理后台'
  const publicPages = ['/login', '/reset-password']
  const accessToken = localStorage.getItem('accessToken')
  if (!publicPages.includes(to.path) && !accessToken) {
    next('/login')
  } else {
    next()
  }
})
export default router


