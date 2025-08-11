import { createBrowserRouter, Navigate } from 'react-router-dom';
import React from 'react';
import Layout from '../components/Layout';
// import HomePage from '../pages/Home';
import HomePage from '../pages/fjl/Home';
import Auth from '../pages/Auth';
import Guide from '../pages/Guide';
import Preferences from '../pages/Preferences';
import Community from '../pages/Community';
import Sports from '../pages/Sports';
import Booking from '../pages/Booking';
import Profile from '../pages/Profile';
import Sou from '../pages/Sou';
import Activitydetail from '../pages/ActivityDetail';
import FamilyRegistration from '../pages/FamilyRegistration';
import PersonalRegistration from '../pages/PersonalRegistration';
import RegistrationSelection from '../pages/RegistrationSelection';
import TeamRegistration from '../pages/TeamRegistration';
import Sp from '../pages/Sp';
import AssociationDetail from '../pages/AssociationDetail';
import SportsEvents from '../pages/fjl/SportsEvents';
import { ROUTES } from './types';



// 错误页面组件
const ErrorPage = () => (
  React.createElement('div', { className: 'error-page' },
    React.createElement('h1', null, '页面未找到'),
    React.createElement('p', null, '抱歉，您访问的页面不存在。'),
    React.createElement('a', { href: '/' }, '返回首页')
  )
);

export const router = createBrowserRouter([
  {

    // 主布局路由 - 包含底部导航栏的页面

    path: '/',
    element: React.createElement(Layout),
    errorElement: React.createElement(ErrorPage),
    children: [
      {
        // 首页 - 默认路由
        index: true,
        element: React.createElement(HomePage)
      },
      {
        // 基础规范说明页面
        path: 'guide',
        element: React.createElement(Guide)
      },
      {
        // 喜好选择页面
        path: 'preferences',
        element: React.createElement(Preferences)
      },
      {
        // 运动团页面 - 底部导航栏项目
        path: 'community',
        element: React.createElement(Community)
      },
      {
        // 运动页面 - 底部导航栏项目
        path: 'sports',
        element: React.createElement(Sports)
      },
      {
        // 运动馆页面 - 底部导航栏项目
        path: 'booking',
        element: React.createElement(Booking)
      },
      {
        // 搜索页面
        path: 'sou',
        element: React.createElement(Sou)
      },
      {
        // 活动详情页面 - 动态路由参数 activityId
        path: "/activity-detail/:activityId",
        element: React.createElement(Activitydetail)
      },
      {
        // 个人报名页面 - 动态路由参数 activityId
        path: "/personal-registration/:activityId",
        element: React.createElement(PersonalRegistration)
      },
      {
        // 家庭报名页面 - 动态路由参数 activityId
        path: "/family-registration/:activityId",
         element: React.createElement(FamilyRegistration)
      },
      {
        // 团队报名页面 - 动态路由参数 activityId
        path: "/team-registration/:activityId",
        element: React.createElement(TeamRegistration)
      },
      {
        // 报名方式选择页面 - 动态路由参数 activityId
        path: "/registration-selection/:activityId",
        element: React.createElement(RegistrationSelection)
      },
      {
        // SP页面 (具体功能待确认)
        path: 'sp',
        element: React.createElement(Sp)
      },
      {
        // 协会详情页面 - 动态路由参数 associationId
        path: "/association-detail/:associationId",
        element: React.createElement(AssociationDetail)
      },
      {
        // 个人中心页面 - 底部导航栏项目，包含子路由
        path: 'booking',
        element: React.createElement(Booking)
      },
      {
        path: 'sports-events',
        element: React.createElement(SportsEvents)
      },
      {
        path: 'profile',
        element: React.createElement(Profile),
        children: [
          {
            // 个人设置子页面
            path: 'settings',
            element: React.createElement('div', null, '设置页面')
          }
        ]
      }
    ]
  },
  {
    // 登录注册页面 - 独立布局，不包含底部导航栏
    path: '/auth',
    element: React.createElement(Auth)
  },
  {
    // 登录路由重定向 - 重定向到统一的认证页面
    path: '/login',
    element: React.createElement(Navigate, { to: '/auth', replace: true })
  },
  {

    // 注册路由重定向 - 重定向到统一的认证页面
    path: '/register',
    element: React.createElement(Navigate, { to: '/auth', replace: true })
  },
  {
    // 404 页面 - 捕获所有未匹配的路由
    path: '*',
    element: React.createElement(ErrorPage)
  }
]);
    // path: '*',
    // element: React.createElement(ErrorPage)
//   }
// ], {
//   future: {
//     v7_startTransition: true,
//   }
// });


export default router;
