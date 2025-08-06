<template>
  <div class="common-layout">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="app-header">
        <div class="left-group">
          <div class="logo-title">
            <div class="header-title">全民健身运营管理后台</div>
          </div>
          <div class="breadcrumb-wrapper">
            <el-breadcrumb separator="/" class="breadcrumb">
              <el-breadcrumb-item 
                v-for="(item, index) in breadcrumbItems" 
                :key="index"
                :to="item.path ? { path: item.path } : undefined"
              >
                {{ item.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <div class="right-group">
          <div class="icon-btn" @click="toggleSidebar">
            <el-icon><Fold /></el-icon>
          </div>

          <div class="user-area">
            <div class="avatar">
              <el-icon><User /></el-icon>
            </div>
            <div class="username">{{ userName }}</div>
            <el-popover placement="bottom-end" width="140" trigger="click">
              <template #reference>
                <div class="caret">
                  <el-icon><ArrowDown /></el-icon>
                </div>
              </template>
              <div class="user-dropdown">
                <el-button type="text" class="logout-btn" @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-button>
              </div>
            </el-popover>
          </div>
        </div>
      </el-header>

      <el-container>
        <!-- 侧边栏菜单 -->
        <el-aside :width="sidebarWidth">
          <el-menu
            :default-active="activeIndex"
            class="sidebar-menu"
            text-color="rgb(85, 85, 85)"
            active-text-color="rgb(255, 3, 0)"
            :unique-opened="true"
            router
            v-loading="menuLoading"
            element-loading-text="加载菜单中..."
            @open="handleOpen"
          >
            <!-- 动态渲染菜单 -->
            <template v-for="parent in menuData" :key="parent._id">
              <el-sub-menu :index="parent._id.toString()">
                <template #title>
                  <el-icon>
                    <component :is="getIcon(parent.icon)" />
                  </el-icon>
                  <span>{{ parent.name }}</span>
                </template>
                <template v-for="child in parent.children" :key="child._id">
                  <el-menu-item 
                    :index="child.path" 
                    v-if="child.isShow"
                  >
                    {{ child.name }}
                  </el-menu-item>
                </template>
              </el-sub-menu>
            </template>
          </el-menu>
        </el-aside>

        <!-- 主内容区 -->
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowDown, Fold, User, SwitchButton } from '@element-plus/icons-vue';
import { permissionAPI } from '../api/txs.js';
// 引入所有可能用到的图标
import {
  DataAnalysis,
  Document,
  Goods,
  Picture,
  Promotion,
  Money,
  Setting
} from '@element-plus/icons-vue';

// 路由与导航
const route = useRoute();
const router = useRouter();

// 状态管理
const menuData = ref<any[]>([]); // 菜单数据
const menuLoading = ref(true); // 菜单加载状态
const activeIndex = ref(route.path); // 当前激活的菜单索引（路由路径）
const userName = ref('用户'); // 用户名
const sidebarWidth = ref('200px'); // 侧边栏宽度（用于折叠功能）

// 面包屑数据
const breadcrumbItems = ref([
  { name: '首页', path: '/' },
  { name: '', path: '' },
  { name: '', path: '' }
]);

// 图标映射表（确保与后端返回的icon名称匹配）
const iconMap: Record<string, any> = {
  DataAnalysis,
  Document,
  Goods,
  Picture,
  Promotion,
  User,
  Money,
  Setting
};

// 格式化菜单路径（确保以/开头）
const formatMenuPaths = (menus: any[]) => {
  return menus.map(parent => ({
    ...parent,
    children: parent.children?.map((child: any) => ({
      ...child,
      path: child.path?.startsWith('/') ? child.path : `/${child.path || ''}`
    })) || []
  }));
};

// 更新面包屑
const updateBreadcrumb = () => {
  const currentPath = route.path;
  let parentMenu: any = null;
  let currentMenu: any = null;

  // 遍历菜单查找当前路由对应的项
  for (const parent of menuData.value) {
    const found = parent.children?.find((child: any) => child.path === currentPath);
    if (found) {
      parentMenu = parent;
      currentMenu = found;
      break;
    }
  }

  // 更新面包屑
  breadcrumbItems.value = [
    { name: '首页', path: '/' },
    { name: parentMenu?.name || '', path: parentMenu?._id ? `#${parentMenu._id}` : '' },
    { name: currentMenu?.name || '', path: currentPath }
  ];
};

// 处理菜单展开（仅日志，不手动跳转）
const handleOpen = (key: string, keyPath: string[]) => {
  console.log('菜单展开:', key, keyPath);
};

// 从token解析用户信息
const getUserInfoFromToken = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64Url解码
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padLength = 4 - (base64.length % 4);
    if (padLength < 4) base64 += '='.repeat(padLength);

    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(decoded);
  } catch (error) {
    console.error('Token解析失败:', error);
    return null;
  }
};

// 获取图标组件
const getIcon = (iconName: string) => {
  return iconMap[iconName] || Setting; // 默认为设置图标
};

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  sidebarWidth.value = sidebarWidth.value === '200px' ? '64px' : '200px';
};

// 获取用户菜单
const fetchUserMenu = async () => {
  try {
    const tokenPayload = getUserInfoFromToken();
    if (!tokenPayload) {
      router.push('/login');
      return;
    }

    // 设置用户名
    userName.value = tokenPayload.realName || tokenPayload.userName || '用户';

    // 判断是否为管理员
    const userRoles = tokenPayload.roles || [];
    const isAdmin = userRoles.some((role: any) => {
      const roleName = (role.name || role.roleName || '').toLowerCase();
      return roleName.includes('admin') || roleName.includes('管理员');
    });

    // 获取权限菜单
    const response: any = await permissionAPI.getPermissionTree();
    if (response.code !== 200) throw new Error('菜单获取失败');

    // 格式化菜单路径并设置
    let menuList = formatMenuPaths(response.data);
    if (!isAdmin) {
      // 普通用户过滤无权限的菜单
      const userPermissions = tokenPayload.permissions || [];
      menuList = menuList.filter(parent => {
        const validChildren = parent.children.filter((child: any) => 
          userPermissions.some((p: any) => p._id === child._id)
        );
        if (validChildren.length) {
          parent.children = validChildren;
          return true;
        }
        return false;
      });
    }
    menuData.value = menuList;
    menuLoading.value = false;
    updateBreadcrumb();

    // 首页默认跳转
    const defaultPaths = ['/', '/dashboard'];
    if (defaultPaths.includes(route.path)) {
      let targetPath = '';
      // 从菜单取第一个有效路径
      if (menuList.length) {
        const firstParent = menuList[0];
        if (firstParent.children?.length) {
          targetPath = firstParent.children[0].path;
        }
      }
      // 兜底路径
      if (!targetPath) {
        targetPath = isAdmin 
          ? '/dashboard/account/system' 
          : '/dashboard/operation';
      }
      // 确保路径有效再跳转
      if (targetPath && !defaultPaths.includes(targetPath)) {
        console.log('默认跳转:', targetPath);
        router.push(targetPath);
      }
    }
  } catch (error) {
    console.error('菜单加载失败:', error);
    menuLoading.value = false;
  }
};

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  router.push('/login');
};

// 初始化
onMounted(() => {
  fetchUserMenu();
});

// 监听路由变化更新激活状态和面包屑
watch(() => route.path, (newPath) => {
  activeIndex.value = newPath;
  updateBreadcrumb();
}, { immediate: true });
</script>

<style scoped>
.common-layout {
  height: 100vh;
  overflow: hidden;
}

.el-container {
  height: 100%;
}

/* 顶部导航 */
.el-header {
  background: linear-gradient(135deg, #2f3e52 0%, #426688 100%);
  color: #fff;
  padding: 0 24px;
  height: 72px !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 侧边栏 */
.el-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s;
}

.el-menu {
  border-right: none;
  height: 100%;
  background-color: transparent;
}

/* 主内容区 */
.el-main {
  padding: 20px;
  background-color: #f2f3f5;
  overflow-y: auto;
  height: calc(100vh - 72px) !important;
}

/* 顶部导航细节 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;

  .left-group {
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
    min-width: 0;

    .logo-title {
      .header-title {
        font-size: 20px;
        font-weight: 600;
        white-space: nowrap;
      }
    }

    .breadcrumb-wrapper {
      flex: 1;
      min-width: 0;

      .breadcrumb {
        .el-breadcrumb__item {
          .el-breadcrumb__inner {
            color: rgba(255, 255, 255, 0.85) !important;
            font-size: 14px;
          }
          .el-breadcrumb__separator {
            color: rgba(255, 255, 255, 0.6) !important;
          }
        }
      }
    }
  }

  .right-group {
    display: flex;
    align-items: center;
    gap: 16px;

    .icon-btn {
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .el-icon {
        color: #fff;
        font-size: 20px;
      }
    }

    .user-area {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.08);
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #409eff;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-icon {
          color: #fff;
          font-size: 18px;
        }
      }

      .username {
        font-size: 14px;
        white-space: nowrap;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .caret .el-icon {
        color: #fff;
        font-size: 16px;
      }

      .user-dropdown {
        .logout-btn {
          width: 100%;
          justify-content: flex-start;
          color: #ff4d4f;

          &:hover {
            color: #d93025;
            background-color: #fff5f5;
          }
        }
      }
    }
  }
}
</style>