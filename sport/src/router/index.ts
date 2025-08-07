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

import Sou from '../pages/Sou';
import Activitydetail from '../pages/ActivityDetail';
import FamilyRegistration from '../pages/FamilyRegistration';
import PersonalRegistration from '../pages/PersonalRegistration';
import RegistrationSelection from '../pages/RegistrationSelection';
import TeamRegistration from '../pages/TeamRegistration';
import Sp from '../pages/Sp'

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
        path: 'sou',
        element: React.createElement(Sou)
      },
      {
        path: "/activity-detail/:activityId",
        element: React.createElement(Activitydetail)
      },
      {
        path: "/personal-registration/:activityId",
        element: React.createElement(PersonalRegistration)
      },
      {
        path: "/family-registration/:activityId",
         element: React.createElement(FamilyRegistration)
      },
      {
        path: "/team-registration/:activityId",
        element: React.createElement(TeamRegistration)
      },
      {
        path: "/registration-selection/:activityId",
        element: React.createElement(RegistrationSelection)
      },
      {
        path: 'sp',
        element: React.createElement(Sp)
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
