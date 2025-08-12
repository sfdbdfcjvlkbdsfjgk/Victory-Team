<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <div><h1>全民健身运营管理后台</h1></div>
        <div class="user-info">
          <div class="user-avatar">
            <el-icon><User /></el-icon>
          </div>
          <span class="username">杨秋清</span>
          <el-icon class="dropdown-arrow" @click="toggleDropdown">
            <ArrowDown />
          </el-icon>
          <div v-show="showDropdown" class="dropdown-menu">
            <div class="dropdown-item" @click="logout">退出</div>
          </div>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <el-menu
            default-active="/dashboard/operation"
            class="el-menu-vertical-demo"
            mode="vertical"
            router
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

            <!-- <el-sub-menu index="1">
              <template #title>
                <el-icon><Location /></el-icon>
                <span>活动管理</span>
              </template>
              <el-menu-item index="/dashboard/activity">活动管理</el-menu-item>
              <!-- <el-menu-item index="/dashboard/activity/publish-normal">发布活动（不含赛事）</el-menu-item> -->
              <el-menu-item index="/dashboard/activity/publish-event">发布活动（含赛事）</el-menu-item>
              <el-menu-item index="/dashboard/activity/create">新增活动</el-menu-item>
              <el-menu-item index="/dashboard/activity/registration">报名信息查看</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="2">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>运营位置管理</span>
              </template>
              <el-menu-item index="/dashboard/operation">运营位置管理</el-menu-item>
              <el-menu-item index="/dashboard/operation/banner-create">新建banner运营位</el-menu-item>
              <el-menu-item index="/dashboard/operation/banner-sort">排序banner位</el-menu-item>
            </el-sub-menu>
            <el-menu-item index="/dashboard/account/system">
              <template #title>
                <el-icon><Document /></el-icon>
                <span>账号管理-系统账号管理</span>
              </template>
            </el-menu-item>
            <el-menu-item index="/dashboard/account/role">
              <template #title>
                <el-icon><Menu /></el-icon>
                <span>账号管理-角色管理</span>
              </template>
            </el-menu-item>
            <el-menu-item index="/dashboard/tag-demo">
              <template #title>
                <el-icon><Collection /></el-icon>
                <span>标签展示演示</span>
              </template>
            </el-menu-item>
            <el-menu-item index="/dashboard/tag-test">
              <template #title>
                <el-icon><PriceTag /></el-icon>
                <span>标签测试页面</span>
              </template>
            </el-menu-item> 

          </el-menu>
        </el-aside>
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  /* box-sizing: border-box; */
}

body {
  margin: 0;
  padding: 0;
}

#app {
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.common-layout {
  margin: 0;
  padding: 0;
  height: 100vh;
}

.el-header {
  background-color: #b3c0d1;
  color: #333;
  line-height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.el-aside {
  background-color: #d3dce6;
  color: #333;
  /* border: 1px solid #1d1d1d; */
  /* text-align: center; */
  /* line-height: calc(100vh - 60px); */
}
.el-container{
  height: 100vh;
}
.el-menu {
  border-right: none;
}
.el-main {

  padding: 20px;
  background-color: #f2f3f5;
  overflow-y: auto;
  height: calc(100vh - 72px) !important;
  background-color: #e9eef3;
  color: #333;
  text-align: center;
  /* line-height: calc(100vh - 60px); */
  padding: 0;


}

.user-info {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 8px;
}

.username {
  margin-right: 8px;
  font-size: 14px;
}

.dropdown-arrow {
  font-size: 12px;
  transition: transform 0.3s;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 80px;
}

.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}
</style>







