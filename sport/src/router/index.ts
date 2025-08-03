import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import HomePage from '../pages/Home';
import Auth from '../pages/Auth';
import Guide from '../pages/Guide';
import Preferences from '../pages/Preferences';
import Community from '../pages/Community';
import Sports from '../pages/Sports';
import Booking from '../pages/Booking';
import Profile from '../pages/Profile';
import React from 'react';

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
    path: '/',
    element: React.createElement(Layout),
    errorElement: React.createElement(ErrorPage),
    children: [
      {
        index: true,
        element: React.createElement(HomePage)
      },
      {
        path: 'guide',
        element: React.createElement(Guide)
      },
      {
        path: 'preferences',
        element: React.createElement(Preferences)
      },
      {
        path: 'community',
        element: React.createElement(Community)
      },
      {
        path: 'sports',
        element: React.createElement(Sports)
      },
      {
        path: 'booking',
        element: React.createElement(Booking)
      },
      {
        path: 'profile',
        element: React.createElement(Profile),
        children: [
          {
            path: 'settings',
            element: React.createElement('div', null, '设置页面')
          }
        ]
      }
    ]
  },
  {
    path: '/auth',
    element: React.createElement(Auth)
  },
  {
    path: '/login',
    element: React.createElement(Navigate, { to: '/auth', replace: true })
  },
  {
    path: '/register',
    element: React.createElement(Navigate, { to: '/auth', replace: true })
  },
  {
    path: '*',
    element: React.createElement(ErrorPage)
  }
]);

export default router;
