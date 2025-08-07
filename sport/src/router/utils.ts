import { ROUTES, ROUTE_METADATA } from './types';

/**
 * 获取路由的标题
 */
export const getRouteTitle = (pathname: string): string => {
  return ROUTE_METADATA[pathname]?.title || '全名体育';
};

/**
 * 检查路由是否需要认证
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return ROUTE_METADATA[pathname]?.requiresAuth || false;
};

/**
 * 获取底部导航的路由列表
 */
export const getBottomNavRoutes = () => {
  return Object.entries(ROUTE_METADATA)
    .filter(([_, metadata]) => metadata.showInBottomNav)
    .map(([path, metadata]) => ({
      path,
      title: metadata.title,
      icon: metadata.icon
    }));
};

/**
 * 检查当前路径是否匹配指定路由
 */
export const isActiveRoute = (currentPath: string, targetPath: string): boolean => {
  if (targetPath === ROUTES.HOME) {
    return currentPath === ROUTES.HOME;
  }
  return currentPath.startsWith(targetPath);
};

/**
 * 生成面包屑导航
 */
export const generateBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ path: ROUTES.HOME, title: '首页' }];
  
  let currentPath = '';
  segments.forEach(segment => {
    currentPath += `/${segment}`;
    const title = getRouteTitle(currentPath);
    if (title !== '全名体育') {
      breadcrumbs.push({ path: currentPath, title });
    }
  });
  
  return breadcrumbs;
};
