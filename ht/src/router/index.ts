import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
    {
        // 根路径重定向到仪表板
        path: '/',
        redirect: '/dashboard'
    },
    {
        // 仪表板/首页
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        children: [
            {
                path: 'account/system',
                name: 'SystemAccount',
                component: () => import('@/views/txs/SystemAccount.vue')
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
            // {
            //     path: 'activity/publish-normal',
            //     name: 'PublishNormal',
            //     component: () => import('@/views/wsj/PublishNormal.vue')
            // },
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
                path: 'activity/registration-form',
                name: 'ActivityRegistration',
                component: () => import('@/views/dcy/ActivityRegistration.vue')
            },
            {
                path: 'tag-demo',
                name: 'TagDemo',
                component: () => import('@/views/TagDemo.vue')
            },
            {
                path: 'tag-test',
                name: 'TagTest',
                component: () => import('@/views/TagTest.vue')
            }
        ]
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(), // 使用HTML5 History模式
    routes
})

export default router


