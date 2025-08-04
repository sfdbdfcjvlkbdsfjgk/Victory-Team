<template>
  <el-config-provider :locale="zhCn">
    <div class="operation-management ui-simple">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-bar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>运营位管理</el-breadcrumb-item>
          <el-breadcrumb-item>全民健身运营位</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 标签页导航 -->
      <div class="tab-navigation">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          <span class="tab-text">{{ tab.title }}</span>
          <el-icon
            class="tab-close"
            @click.stop="closeTab(tab.id)"
            v-if="tab.id !== 'banner'"
          >
            <Close />
          </el-icon>
        </div>
      </div>

      <!-- 搜索区域 -->
      <div
        v-if="
          !activeTab.startsWith('create-') && !activeTab.startsWith('edit-')
        "
        class="search-section ui-center"
      >
        <el-form :model="searchForm" inline>
          <el-form-item label="标题:">
            <el-input
              v-model="searchForm.title"
              placeholder="请输入banner或id"
              style="width: 200px"
              @keyup.enter="handleSearch"
              clearable
            />
          </el-form-item>
          <el-form-item label="状态:">
            <el-select
              v-model="searchForm.status"
              placeholder="不限"
              style="width: 120px"
            >
              <el-option label="不限" value="" />
              <el-option label="待发布" value="待发布" />
              <el-option label="已下线" value="已下线" />
              <el-option label="已发布" value="已发布" />
            </el-select>
          </el-form-item>
          <el-form-item label="起止时间:">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              style="width: 350px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :loading="loading"
              >搜索</el-button
            >
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 标签页内容 -->
      <div class="tabs-section">
        <!-- Banner管理页面 -->
        <div v-if="activeTab === 'banner'" class="tab-content">
          <Suspense>
            <template #default>
              <BannerTable
                :data="filteredTableData"
                :loading="loading"
                :current-page="pagination.currentPage"
                :page-size="pagination.pageSize"
                :total="pagination.total"
                :enable-drag-sort="true"
                @create="handleCreate"
                @sort="handleSort"
                @edit="handleEdit"
                @toggle-status="handleToggleStatus"
                @delete="handleDelete"
                @page-change="handleCurrentChange"
                @size-change="handleSizeChange"
                @jump-page="handleJumpPage"
                @drag-sort="handleDragSort"
                @batch-toggle-status="handleBatchToggleStatus"
                @batch-delete="handleBatchDelete"
                @import-excel="handleImportExcel"
                @export-excel="handleExportExcel"
                @download-template="handleDownloadTemplate"
              />
            </template>
            <template #fallback>
              <div class="loading-container">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>表格组件加载中...</span>
              </div>
            </template>
          </Suspense>
        </div>

        <!-- 功能位页面 -->
        <div v-else-if="activeTab === 'function'" class="tab-content">
          <div class="empty-content">
            <el-empty description="暂无数据" />
          </div>
        </div>

        <!-- 新建/编辑表单页面 -->
        <div
          v-else-if="
            activeTab.startsWith('create-') || activeTab.startsWith('edit-')
          "
          class="tab-content"
        >
          <Suspense>
            <template #default>
              <BannerForm
                v-model="formData"
                :is-edit="activeTab.startsWith('edit-')"
                :submit-loading="submitLoading"
                @submit="handleFormSubmit"
                @cancel="handleCancel"
                @upload-progress="handleUploadProgress"
              />
            </template>
            <template #fallback>
              <div class="loading-container">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>表单组件加载中...</span>
              </div>
            </template>
          </Suspense>
        </div>
      </div>

      <!-- 排序对话框 -->
      <Suspense>
        <template #default>
          <SortDialog
            ref="sortDialogRef"
            v-model="sortDialogVisible"
            :data="publishedTableData"
            :loading="sortLoading"
            :confirm-loading="submitLoading"
            @confirm="handleSortConfirm"
            @cancel="handleSortCancel"
          />
        </template>
        <template #fallback>
          <!-- 排序对话框加载时不显示fallback，因为它是弹窗组件 -->
        </template>
      </Suspense>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  computed,
  shallowRef,
  markRaw,
  nextTick,
} from "vue";
import { ElMessage, ElMessageBox, ElConfigProvider } from "element-plus";
import { Close, Loading } from "@element-plus/icons-vue";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import {
  getBannerList,
  addBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  updateBannerSort,
  importExcel,
  exportExcel,
  downloadTemplate,
  type Banner,
} from "./api/banner";
import {
  PerformanceMonitor,
  trackRenderTime,
  getMemoryUsage,
} from "./utils/performance";
// 异步组件加载优化
import { defineAsyncComponent } from "vue";

const BannerTable = defineAsyncComponent(
  () => import("./components/BannerTable.vue")
);
const BannerForm = defineAsyncComponent(
  () => import("./components/BannerForm.vue")
);
const SortDialog = defineAsyncComponent(
  () => import("./components/SortDialog.vue")
);

// 性能监控工具
const performanceMonitor = new PerformanceMonitor();
const renderTracking = trackRenderTime("OperationManagement");

// 搜索表单
const searchForm = reactive({
  title: "",
  status: "",
  dateRange: [],
});

// 实际应用的搜索条件（只有点击搜索时才更新）
const appliedSearchConditions = reactive({
  title: "",
  status: "",
  dateRange: [],
});

// 标签页数据
const tabs = ref([
  { id: "banner", title: "活动赛事管理" },
  { id: "function", title: "全民健身运营位" },
]);

// 当前激活的标签页
const activeTab = ref("banner");

// 加载状态
const loading = ref(false);
const submitLoading = ref(false);

// 分页信息 - 使用markRaw优化
const pagination = markRaw(
  reactive({
    currentPage: 1,
    pageSize: 5,
    total: 0,
  })
);

// 表格数据 - 使用shallowRef优化大数组
const tableData = shallowRef<Banner[]>([]);

// 表单数据
const formData = reactive<Partial<Banner> & { timeRange?: any[] }>({
  title: "",
  imageUrl: "",
  redirectType: "内部",
  redirectUrl: "",
  startTime: "",
  endTime: "",
  status: "待发布",
  locationType: "首页banner位",
  timeRange: [],
});

// 排序相关数据
const sortDialogVisible = ref(false);
const sortLoading = ref(false);
const sortDialogRef = ref();

// 计算属性 - 过滤表格数据
const filteredTableData = computed(() => {
  let filtered = tableData.value;

  // 应用搜索过滤
  if (appliedSearchConditions.title) {
    const searchTerm = appliedSearchConditions.title.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title?.toLowerCase().includes(searchTerm) ||
        item._id?.toLowerCase().includes(searchTerm)
    );
  }

  if (appliedSearchConditions.status) {
    filtered = filtered.filter((item) => item.status === appliedSearchConditions.status);
  }

  if (appliedSearchConditions.dateRange && appliedSearchConditions.dateRange.length === 2) {
    const [startDate, endDate] = appliedSearchConditions.dateRange;
    filtered = filtered.filter((item) => {
      const createdAt = new Date(item.createdAt || "");
      return createdAt >= new Date(startDate) && createdAt <= new Date(endDate);
    });
  }

  // 更新分页总数
  pagination.total = filtered.length;

  return filtered;
});

// 计算属性 - 已发布的数据用于排序
const publishedTableData = computed(() =>
  tableData.value.filter((item) => item.status === "已发布")
);

// 性能优化的获取数据方法

const fetchData = async () => {
  performanceMonitor.start("fetchData");
  loading.value = true;

  try {
    const params: any = {
      locationType: "首页banner位",
    };

    const response = await getBannerList(params);
    if (response.data.code === 200) {
      // 使用shallowRef的特性，直接替换引用
      tableData.value = [...response.data.data];
      pagination.total = response.data.data.length;

      if (process.env.NODE_ENV === "development") {
        console.log(`📊 ${getMemoryUsage()}`);
        console.log(`🔍 获取到 ${response.data.data.length} 条数据`);
        console.log(`📋 数据排序情况:`, response.data.data.map(item => ({
          title: item.title,
          status: item.status,
          sortOrder: item.sortOrder,
          createdAt: item.createdAt
        })));
      }
    } else {
      ElMessage.error(response.data.msg || "获取数据失败");
    }
  } catch (error) {
    console.error("获取数据失败:", error);
    ElMessage.error("获取数据失败");
  } finally {
    loading.value = false;
    performanceMonitor.log("数据获取");
  }
};

// 搜索处理 - 手动触发搜索，将搜索表单的条件应用到过滤逻辑中
const handleSearch = () => {
  pagination.currentPage = 1;
  // 将搜索条件应用到appliedSearchConditions
  appliedSearchConditions.title = searchForm.title;
  appliedSearchConditions.status = searchForm.status;
  appliedSearchConditions.dateRange = searchForm.dateRange;

  // 由于使用了计算属性filteredTableData，搜索结果会立即生效
  // 在无数据时提示
  nextTick(() => {
    if (filteredTableData.value.length === 0 && !loading.value) {
      ElMessage.info("没有找到匹配的数据");
    }
  });
};

// 重置搜索条件 - 清空搜索表单和应用的搜索条件
const handleReset = () => {
  searchForm.title = "";
  searchForm.status = "";
  searchForm.dateRange = [];
  appliedSearchConditions.title = "";
  appliedSearchConditions.status = "";
  appliedSearchConditions.dateRange = [];
};

// 新的表单提交处理
const handleFormSubmit = async (submitData: Partial<Banner>) => {
  performanceMonitor.start("formSubmit");
  submitLoading.value = true;

  try {
    let response;
    const isEdit = activeTab.value.startsWith("edit-");

    if (isEdit) {
      response = await updateBanner(submitData as Banner & { _id: string });
      if (response.data.code === 200) {
        ElMessage.success("更新成功");
      } else {
        ElMessage.error(response.data.msg || "更新失败");
        return;
      }
    } else {
      response = await addBanner(submitData as Banner);
      if (response.data.code === 200) {
        ElMessage.success("创建成功");
      } else {
        ElMessage.error(response.data.msg || "创建失败");
        return;
      }
    }

    // 关闭当前标签页并刷新数据
    const currentTabId = activeTab.value;
    closeTab(currentTabId);
    activeTab.value = "banner";
    await fetchData();

    // 重置表单
    resetFormData();
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("提交失败");
  } finally {
    submitLoading.value = false;
    performanceMonitor.log("表单提交");
  }
};

// 处理上传进度
const handleUploadProgress = (progress: number) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`📤 上传进度: ${progress}%`);
  }
};

// 重置表单数据
const resetFormData = () => {
  Object.assign(formData, {
    title: "",
    imageUrl: "",
    redirectType: "内部",
    redirectUrl: "",
    startTime: "",
    endTime: "",
    status: "待发布",
    locationType: "首页banner位",
    timeRange: [],
    _id: undefined, // 确保清除ID
  });
};

// 切换标签页
const switchTab = (tabId: string) => {
  activeTab.value = tabId;
};

// 关闭标签页
const closeTab = (tabId: string) => {
  const index = tabs.value.findIndex((tab) => tab.id === tabId);
  if (index > -1) {
    tabs.value.splice(index, 1);
    // 如果关闭的是当前激活的标签页，切换到第一个标签页
    if (activeTab.value === tabId) {
      activeTab.value = tabs.value[0]?.id || "banner";
    }
  }
};

// 新建
const handleCreate = () => {
  const newTabId = `create-${Date.now()}`;
  tabs.value.push({
    id: newTabId,
    title: "新建广告运营位",
  });
  activeTab.value = newTabId;
  resetFormData();
};

// 排序
const handleSort = () => {
  if (publishedTableData.value.length === 0) {
    ElMessage.warning("暂无已发布的数据可排序");
    return;
  }
  sortDialogVisible.value = true;
};

// 排序处理
const handleSortConfirm = async (sortedData: any[]) => {
  performanceMonitor.start("sortConfirm");
  submitLoading.value = true;

  try {
    // 准备排序数据，使用数组索引作为新的sortOrder
    const sortUpdateData = sortedData.map((item, index) => ({
      _id: item._id,
      sortOrder: index + 1 // 从1开始排序
    }));

    if (process.env.NODE_ENV === "development") {
      console.log("📊 排序数据:", sortUpdateData);
    }

    // 调用后端API保存排序结果
    const response = await updateBannerSort(sortUpdateData);
    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '保存排序失败');
    }

    ElMessage.success("排序已保存");
    
    // 重置排序对话框状态，避免弹出确认对话框
    if (sortDialogRef.value) {
      sortDialogRef.value.resetData();
    }
    
    sortDialogVisible.value = false;
    
    // 重新获取数据并强制刷新
    await fetchData();
    
    // 强制触发响应式更新
    await nextTick();
    
    if (process.env.NODE_ENV === "development") {
      console.log("🔄 排序完成，数据已刷新");
    }
  } catch (error) {
    ElMessage.error("保存排序失败");
    console.error("保存排序失败:", error);
  } finally {
    submitLoading.value = false;
    performanceMonitor.log("排序保存");
  }
};

const handleSortCancel = () => {
  sortDialogVisible.value = false;
};

// 编辑
const handleEdit = (row: Banner) => {
  const editTabId = `edit-${row._id}`;

  // 检查是否已存在该编辑标签页
  const existingTab = tabs.value.find((tab) => tab.id === editTabId);
  if (!existingTab) {
    tabs.value.push({
      id: editTabId,
      title: `编辑-${row.title}`,
    });
  }

  activeTab.value = editTabId;

  // 填充表单数据
  Object.assign(formData, {
    _id: row._id,
    title: row.title,
    imageUrl: row.imageUrl,
    redirectType: row.redirectType,
    redirectUrl: row.redirectUrl,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    locationType: row.locationType,
    timeRange: [row.startTime, row.endTime],
  });
};

// 切换状态
const handleToggleStatus = async (row: Banner) => {
  const isOnline = row.status === "已发布";
  const action = isOnline ? "下线" : "上线";

  let confirmMessage = "";
  if (isOnline) {
    confirmMessage = "下线后将不再显示给用户,确认下线吗?";
  } else {
    confirmMessage = "上线后用户即可看见,确认上线吗?";
  }

  try {
    await ElMessageBox.confirm(confirmMessage, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const newStatus = isOnline ? "已下线" : "已发布";
    const response = await updateBannerStatus(row._id!, newStatus);
    if (response.data.code === 200) {
      ElMessage.success(`${action}成功`);
      fetchData();
    } else {
      ElMessage.error(response.data.msg || `${action}失败`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("状态更新失败:", error);
      ElMessage.error("状态更新失败");
    }
  }
};

// 删除
const handleDelete = async (row: Banner) => {
  try {
    await ElMessageBox.confirm("删除后不可撤回,确认删除吗?", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const response = await deleteBanner(row._id!);
    if (response.data.code === 200) {
      ElMessage.success("删除成功");
      fetchData();
    } else {
      ElMessage.error(response.data.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 这些检查逻辑已移至BannerForm组件中

// 表单提交已移至handleFormSubmit方法

// 简化的分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
};

const handleJumpPage = (page: number) => {
  pagination.currentPage = page;
};

// 处理拖拽排序
const handleDragSort = async (sortedData: Banner[]) => {
  performanceMonitor.start("dragSort");
  
  try {
    // 准备排序数据
    const sortUpdateData = sortedData.map((item, index) => ({
      _id: item._id,
      sortOrder: index + 1
    }));

    if (process.env.NODE_ENV === "development") {
      console.log("🖱️ 拖拽排序数据:", sortUpdateData);
    }

    // 调用后端API保存排序结果
    const response = await updateBannerSort(sortUpdateData);
    if (response.data.code !== 200) {
      throw new Error(response.data.msg || '保存排序失败');
    }

    // 立即更新本地数据，提供即时反馈
    const updatedTableData = [...tableData.value];
    sortedData.forEach((sortedItem, index) => {
      const dataIndex = updatedTableData.findIndex(item => item._id === sortedItem._id);
      if (dataIndex !== -1) {
        updatedTableData[dataIndex] = {
          ...updatedTableData[dataIndex],
          sortOrder: index + 1
        };
      }
    });
    
    // 重新排序本地数据
    updatedTableData.sort((a, b) => {
      if (a.status === '已发布' && b.status === '已发布') {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      } else if (a.status === '已发布' && b.status !== '已发布') {
        return -1;
      } else if (a.status !== '已发布' && b.status === '已发布') {
        return 1;
      } else {
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
    });
    
    tableData.value = updatedTableData;

    if (process.env.NODE_ENV === "development") {
      console.log("🖱️ 拖拽排序保存成功");
    }
  } catch (error) {
    console.error("拖拽排序失败:", error);
    ElMessage.error("拖拽排序失败，请重试");
    
    // 出错时重新获取数据
    await fetchData();
  } finally {
    performanceMonitor.log("拖拽排序");
  }
};

// 批量操作处理
const handleBatchToggleStatus = async (rows: Banner[], status: string) => {
  performanceMonitor.start("batchToggleStatus");
  
  try {
    // 验证状态值并转换为正确类型
    const validStatuses = ["待发布", "已发布", "已下线"] as const;
    type BannerStatus = typeof validStatuses[number];
    
    if (!validStatuses.includes(status as BannerStatus)) {
      ElMessage.error("无效的状态值");
      return;
    }
    
    const bannerStatus = status as BannerStatus;
    const promises = rows.map(row => updateBannerStatus(row._id!, bannerStatus));
    const results = await Promise.all(promises);
    
    const successCount = results.filter(result => result.data.code === 200).length;
    const failCount = rows.length - successCount;
    
    if (successCount > 0) {
      ElMessage.success(`成功${status === '已发布' ? '上线' : '下线'} ${successCount} 个项目`);
    }
    if (failCount > 0) {
      ElMessage.warning(`${failCount} 个项目操作失败`);
    }
    
    // 刷新数据
    await fetchData();
  } catch (error) {
    console.error("批量状态切换失败:", error);
    ElMessage.error("批量操作失败");
  } finally {
    performanceMonitor.log("批量状态切换");
  }
};

const handleBatchDelete = async (rows: Banner[]) => {
  performanceMonitor.start("batchDelete");
  
  try {
    const promises = rows.map(row => deleteBanner(row._id!));
    const results = await Promise.all(promises);
    
    const successCount = results.filter(result => result.data.code === 200).length;
    const failCount = rows.length - successCount;
    
    if (successCount > 0) {
      ElMessage.success(`成功删除 ${successCount} 个项目`);
    }
    if (failCount > 0) {
      ElMessage.warning(`${failCount} 个项目删除失败`);
    }
    
    // 刷新数据
    await fetchData();
  } catch (error) {
    console.error("批量删除失败:", error);
    ElMessage.error("批量删除失败");
  } finally {
    performanceMonitor.log("批量删除");
  }
};

// 导入Excel功能
const handleImportExcel = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      processImportFile(file);
    }
  };
  input.click();
};

const processImportFile = async (file: File) => {
  // 验证文件大小（限制为10MB）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过10MB');
    return;
  }

  // 验证文件类型
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('请选择Excel文件（.xlsx或.xls）');
    return;
  }

  const loadingInstance = ElMessage({
    message: '正在上传并解析Excel文件...',
    type: 'info',
    duration: 0,
    showClose: false
  });
  
  try {
    const response = await importExcel(file);
    
    if (response.data.code === 200) {
      const { successCount, failCount, errors } = response.data.data;
      
      let message = `导入完成！成功 ${successCount} 条`;
      if (failCount > 0) {
        message += `，失败 ${failCount} 条`;
      }
      
      ElMessage.success(message);
      
      // 如果有失败的记录，显示详细错误信息
      if (errors && errors.length > 0) {
        console.warn('导入错误详情:', errors);
        ElMessage.warning('部分数据导入失败，请检查控制台查看详情');
      }
      
      // 刷新数据
      await fetchData();
    } else {
      throw new Error(response.data.msg || '导入失败');
    }
  } catch (error: any) {
    console.error('Excel导入失败:', error);
    const errorMsg = error.response?.data?.msg || error.message || '导入失败';
    ElMessage.error(`导入失败：${errorMsg}`);
  } finally {
    loadingInstance.close();
  }
};

// 导出Excel功能
const handleExportExcel = async (selectedRows?: Banner[]) => {
  performanceMonitor.start("exportExcel");
  
  try {
    // 准备导出参数
    const exportParams: any = {};
    
    // 如果有选中的行，只导出选中的
    if (selectedRows && selectedRows.length > 0) {
      exportParams.selectedIds = selectedRows.map(row => row._id);
    } else {
      // 否则根据当前搜索条件导出
      exportParams.filters = {
        title: appliedSearchConditions.title,
        status: appliedSearchConditions.status,
        locationType: "首页banner位"
      };
      if (appliedSearchConditions.dateRange && appliedSearchConditions.dateRange.length === 2) {
        exportParams.filters.startDate = appliedSearchConditions.dateRange[0];
        exportParams.filters.endDate = appliedSearchConditions.dateRange[1];
      }
    }

    const loadingInstance = ElMessage({
      message: '正在生成Excel文件...',
      type: 'info',
      duration: 0,
      showClose: false
    });

    const response = await exportExcel(exportParams);
    
    // 处理文件下载
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // 从响应头获取文件名，或使用默认文件名
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `运营位数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (matches && matches[1]) {
        fileName = matches[1].replace(/['"]/g, '');
      }
    }
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    loadingInstance.close();
    
    const count = selectedRows ? selectedRows.length : '全部';
    ElMessage.success(`成功导出 ${count} 条数据`);
    
    if (process.env.NODE_ENV === "development") {
      console.log("📊 导出参数:", exportParams);
      console.log("📁 文件名:", fileName);
    }
  } catch (error: any) {
    console.error("导出失败:", error);
    const errorMsg = error.response?.data?.msg || error.message || '导出失败';
    ElMessage.error(`导出失败：${errorMsg}`);
  } finally {
    performanceMonitor.log("Excel导出");
  }
};

// 下载Excel模板功能
const handleDownloadTemplate = async () => {
  try {
    const loadingInstance = ElMessage({
      message: '正在下载模板...',
      type: 'info',
      duration: 1000
    });

    const response = await downloadTemplate();
    
    // 处理文件下载
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `运营位导入模板.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('模板下载成功');
    
    if (process.env.NODE_ENV === "development") {
      console.log("📋 下载Excel模板成功");
    }
  } catch (error: any) {
    console.error("模板下载失败:", error);
    const errorMsg = error.response?.data?.msg || error.message || '模板下载失败';
    ElMessage.error(`模板下载失败：${errorMsg}`);
  }
};

// 格式化日期函数（如果不存在的话）
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "";
  const d = new Date(date);
  return d
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\//g, "-");
};

// 这些方法已移至相关子组件中

// 处理取消
const handleCancel = () => {
  const currentTabId = activeTab.value;
  closeTab(currentTabId);
  activeTab.value = "banner";
  resetFormData();
};



// 组件挂载和卸载
onMounted(() => {
  renderTracking.beforeMount();
  performanceMonitor.start("componentMount");

  fetchData().then(() => {
    performanceMonitor.log("组件初始化");
    renderTracking.mounted();

    if (process.env.NODE_ENV === "development") {
      console.log("🎯 运营位管理组件已加载");
      console.log(`📊 当前内存使用: ${getMemoryUsage()}`);
    }
  });
});

onUnmounted(() => {
  // 清理性能监控
  performanceMonitor.clear();

  if (process.env.NODE_ENV === "development") {
    console.log("🧹 运营位管理组件已卸载，资源已清理");
  }
});
</script>

<style scoped>
.operation-management.ui-simple {
  background: #f7fafd;
  min-height: 100vh;
  padding: 0;
}

.breadcrumb-bar {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #222;
  background: none;
}

.tab-navigation {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e6eaf0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
  border-bottom: none;
}

.tab-item:hover {
  background: #e6f7ff;
}

.tab-item.active {
  background: #fff;
  border-color: #e6eaf0;
  color: #409eff;
  font-weight: 500;
}

.tab-text {
  font-size: 14px;
}

.tab-close {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}

.tab-close:hover {
  color: #f56c6c;
}

.tab-content {
  padding: 20px;
}

.search-section.ui-center {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: #fff;
  border-radius: 0;
  box-shadow: none;
  padding: 8px 0;
  display: flex;
  justify-content: center;
}

.tabs-section {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: #fff;
  border-radius: 0;
  box-shadow: none;
  border: none;
  border-top: 1px solid #e6eaf0;
}

/* 这些样式已移至子组件 */

.empty-content {
  padding: 16px 0;
  text-align: center;
}

.el-form--inline .el-form-item {
  margin-right: 16px;
}

.el-form-item__label {
  color: #666;
  font-size: 15px;
}

.el-input__inner,
.el-select .el-input__inner {
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #e6eaf0;
  font-size: 15px;
}

.el-button--primary {
  border-radius: 4px;
  font-size: 14px;
  padding: 0 16px;
}

:deep(.el-table th) {
  background: #409eff !important;
  color: #fff !important;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid #e6eaf0;
}

:deep(.el-table th .cell) {
  color: #fff !important;
}

:deep(.el-table .el-table__row) {
  font-size: 15px;
  transition: background 0.2s;
}

:deep(.el-table .el-table__row:hover) {
  background: #f0f7ff !important;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff !important;
  font-weight: 600;
  background: none;
  border-radius: 0;
}

:deep(.el-tabs__active-bar) {
  background: #409eff !important;
  height: 4px;
  border-radius: 2px 2px 0 0;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-input__wrapper) {
  height: 36px;
}

:deep(.el-select .el-input__wrapper) {
  height: 36px;
}

:deep(.el-button) {
  height: 36px;
  padding: 0 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表单和上传相关样式已移至BannerForm和FileUpload组件 */

/* 操作相关样式已移至BannerTable组件 */

/* 排序相关样式已移至SortDialog组件 */

/* 分页相关样式已移至BannerTable组件 */

/* 异步组件加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #606266;
  font-size: 14px;
}

.loading-container .el-icon {
  font-size: 24px;
  margin-bottom: 12px;
  color: #409eff;
}



/* 性能优化后的动画 */
.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
