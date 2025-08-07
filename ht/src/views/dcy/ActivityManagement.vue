<template>
  <div class="activity-management">

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <div class="search-row">
        <div class="search-item">
          <label>标题:</label>
          <el-input
            v-model="searchForm.title"
            placeholder="请输入活动标题"
            style="width: 200px"
            clearable
          ></el-input>
        </div>
        <div class="search-item">
          <label>类型:</label>
          <el-select
            v-model="searchForm.type"
            placeholder="不限"
            style="width: 120px"
            clearable
          >
            <el-option label="不限" value=""></el-option>
            <el-option label="活动" value="活动"></el-option>
            <el-option label="赛事" value="赛事"></el-option>
          </el-select>
        </div>
        <div class="search-item">
          <label>活动进度:</label>
          <el-select
            v-model="searchForm.activityprogress"
            placeholder="不限"
            style="width: 120px"
            clearable
          >
            <el-option label="不限" value=""></el-option>
            <el-option label="报名中" value="报名中"></el-option>
            <el-option label="待开始" value="待开始"></el-option>
            <el-option label="活动中" value="活动中"></el-option>
            <el-option label="已结束" value="已结束"></el-option>
          </el-select>
        </div>
        <div class="search-item">
          <label>状态:</label>
          <el-select
            v-model="searchForm.state"
            placeholder="不限"
            style="width: 120px"
            clearable
          >
            <el-option label="不限" value=""></el-option>
            <el-option label="待发布" value="待发布"></el-option>
            <el-option label="已发布" value="已发布"></el-option>
            <el-option label="已下线" value="已下线"></el-option>
          </el-select>
        </div>
        <el-button type="primary" @click="searchActivities" :icon="Search"
          >搜索</el-button
        >
        <el-button type="primary" @click="goToCreate" :icon="Plus"
          >新建</el-button
        >
      </div>
    </div>

    <!-- 活动列表表格 -->
    <div class="table-section">
      <el-table
        :data="activityList"
        style="width: 100%"
        stripe
        :header-cell-style="{ background: '#fafafa', color: '#262626' }"
      >
        <el-table-column
          prop="id"
          label="序号"
          align="center"
        ></el-table-column>
        <el-table-column
          prop="title"
          label="标题"
          show-overflow-tooltip
          width="110"
        ></el-table-column>
        <el-table-column prop="type" label="类型" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.type === '赛事' ? 'warning' : 'primary'"
              size="small"
            >
              {{ scope.row.type === "赛事" ? "赛事" : "活动" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="运动类型"
          align="center"
          prop="sportstype"
        ></el-table-column>
        <el-table-column
          prop="participants"
          label="阅读人/次数"
          align="center"
          width="110"
        >
          <template #default="scope">
            {{ scope.row.readnumber }}
          </template>
        </el-table-column>
        <el-table-column
          prop="enrollment"
          label="报名人数"
          align="center"
        ></el-table-column>
        <el-table-column prop="activityStatus" label="活动进度" align="center">
          <template #default="scope">
            <el-tag
              :type="getActivityStatusType(calculateActivityProgress(scope.row))"
              size="small"
            >
              {{ calculateActivityProgress(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" align="center">
          <template #default="scope">
            <el-tag :type="getStateType(scope.row.state)" size="small">
              {{ getStateText(scope.row.state) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="topstate" label="是否置顶" align="center">
          <template #default="scope">
            <span v-if="scope.row.topstate === 1">已置顶</span>
            <span
              v-else-if="
                scope.row.topstate === 0 && scope.row.state === '已发布'
              "
              >未置顶</span
            >
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="创建时间"
          width="170"
          align="center"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="450" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="editActivity(scope.row)"
              >编辑</el-button
            >
            <el-button
              v-if="scope.row.state === '已发布'"
              size="small"
              type="success"
              @click="handleOffline(scope.row)"
            >
              下线
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="manageRegistrations(scope.row)"
              >报名管理</el-button
            >
            <el-button
              v-if="scope.row.topstate === 1"
              size="small"
              type="warning"
              @click="handleCancelTop(scope.row)"
            >
              取消置顶
            </el-button>
            <el-button
              v-else-if="scope.row.state === '已发布'"
              size="small"
              type="warning"
              @click="handleSetTop(scope.row)"
            >
              置顶
            </el-button>
            <el-button
              v-if="scope.row.state === '已下线'"
              size="small"
              type="success"
              @click="handlePublish(scope.row)"
            >
              发布
            </el-button>
            <el-button
              v-if="scope.row.state === '已发布'"
              size="small"
              type="info"
              @click="copyLink(scope.row)"
            >
              复制链接
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteActivity(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[5, 10, 20, 30]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>

  <!-- 编辑活动对话框 -->
  <el-dialog v-model="editDialogVisible" title="编辑活动" width="600px">
    <el-form :model="editForm" label-width="120px">
      <el-form-item label="活动标题">
        <el-input v-model="editForm.title" placeholder="请输入活动标题"></el-input>
      </el-form-item>
      <el-form-item label="活动类型">
        <el-select v-model="editForm.type" placeholder="请选择类型">
          <el-option label="活动" value="活动"></el-option>
          <el-option label="赛事" value="赛事"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="运动类型">
        <el-input v-model="editForm.sportstype" placeholder="请输入运动类型"></el-input>
      </el-form-item>
      <!-- <el-form-item label="活动进度">
        <el-select v-model="editForm.activityprogress" placeholder="请选择活动进度">
          <el-option label="报名中" value="报名中"></el-option>
          <el-option label="待开始" value="待开始"></el-option>
          <el-option label="活动中" value="活动中"></el-option>
          <el-option label="已结束" value="已结束"></el-option>
        </el-select>
      </el-form-item> -->
      <el-form-item label="报名人数">
        <el-input v-model="editForm.enrollment" placeholder="请输入报名人数"></el-input>
      </el-form-item>
      <el-form-item label="阅读人数">
        <el-input v-model="editForm.readnumber" placeholder="请输入阅读人数"></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="editForm.state" placeholder="请选择状态">
          <el-option label="待发布" value="待发布"></el-option>
          <el-option label="已发布" value="已发布"></el-option>
          <el-option label="已下线" value="已下线"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import axios from "axios";
import dayjs from "dayjs";
const router = useRouter();

// 搜索表单
const searchForm = reactive({
  title: "",
  type: "",
  activityprogress: "",
  state: "",
});

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 5,
  total: 0
});

// 活动列表数据
const activityList = ref([
  // {
  //   id: 1,
  //   title: '跑步比赛',
  //   type: 'activity',
  //   category: '游泳',
  //   currentParticipants: 0,
  //   maxParticipants: 0,
  //   registrations: 0,
  //   activityStatus: 'pending',
  //   publishStatus: 'published',
  //   createTime: '2020.01.03 13:09'
  // },
  // {
  //   id: 2,
  //   title: '点亮跑步活动',
  //   type: 'event',
  //   category: '跑步',
  //   currentParticipants: 2356,
  //   maxParticipants: 3356,
  //   registrations: 123,
  //   activityStatus: 'ongoing',
  //   publishStatus: 'published',
  //   createTime: '2020.01.03 11:09'
  // },
  // {
  //   id: 3,
  //   title: '明星跑步推荐',
  //   type: 'activity',
  //   category: '文化',
  //   currentParticipants: 1289,
  //   maxParticipants: 3356,
  //   registrations: 235,
  //   activityStatus: 'ongoing',
  //   publishStatus: 'draft',
  //   createTime: '2020.01.02 11:09'
  // },
  // {
  //   id: 4,
  //   title: '九州山登山活动',
  //   type: 'event',
  //   category: '登山',
  //   currentParticipants: 1298,
  //   maxParticipants: 23356,
  //   registrations: 563,
  //   activityStatus: 'finished',
  //   publishStatus: 'published',
  //   createTime: '2020.01.01 11:09'
  // }
]);

// 搜索功能
const searchActivities = () => {
  console.log('搜索条件:', searchForm)
  pagination.currentPage = 1 // 搜索时重置到第一页
  getlist()
};

// 计算活动进度状态
const calculateActivityProgress = (activity: any) => {
  // 检查必要的时间数据是否存在
  if (!activity.activityTime || !activity.registrationTime) {
    return "已结束";
  }

  const now = new Date();
console.log('now:', now);



  // 解析报名时间 - 数组格式 [开始时间, 结束时间]
  const registrationStart = new Date(activity.registrationTime[0]);
  const registrationEnd = new Date(activity.registrationTime[1]);
console.log('registrationStart:', registrationStart);
console.log('registrationEnd:', registrationEnd);
  // 解析活动时间 - 数组格式 [开始时间, 结束时间]
  const activityStart = new Date(activity.activityTime[0]);
  const activityEnd = new Date(activity.activityTime[1]);

  // 判断当前时间处于哪个阶段
  if (now < registrationStart) {
    return "待开始"; // 还未到报名时间
  } else if (now >= registrationStart && now <= registrationEnd) {
    return "报名中"; // 在报名期间
  } else if (now > registrationEnd && now < activityStart) {
    return "待开始"; // 报名结束，活动未开始
  } else if (now >= activityStart && now <= activityEnd) {
    return "活动中"; // 活动进行中
  } else {
    return "已结束"; // 活动已结束
  }
};

// 获取活动状态类型
const getActivityStatusType = (status: string) => {
  switch (status) {
    case "报名中":
      return "info";
    case "待开始":
      return "success";
    case "活动中":
      return "primary";
    case "已结束":
      return "warning";
    default:
      return "info";
  }
};

// 获取活动状态文本
// const getActivityStatusText = (status: string) => {
//   switch (status) {
//     case "报名中":
//       return "报名中";
//     case "待开始":
//       return "待开始";
//     case "活动中":
//       return "活动中";
//     default:
//       return "已结束";
//   }
// };

// 操作方法





const goToCreate = () => {
  router.push("/dashboard/activity/create");
};

// 编辑对话框相关
const editDialogVisible = ref(false)
const editForm = reactive({
  id: '',
  _id: '',
  title: '',
  type: '',
  sportstype: '',
  activityprogress: '',
  state: '',
  enrollment: '',
  readnumber: ''
})

// 编辑活动
const editActivity = (row: any) => {
  console.log("编辑活动:", row)
  
  // 填充表单数据
  editForm.id = row.id
  editForm._id = row._id
  editForm.title = row.title
  editForm.type = row.type
  editForm.sportstype = row.sportstype
  editForm.activityprogress = row.activityprogress
  editForm.state = row.state
  editForm.enrollment = row.enrollment
  editForm.readnumber = row.readnumber
  
  // 显示对话框
  editDialogVisible.value = true
}

// 保存编辑
const saveEdit = async () => {
  try {
    // 调用编辑API
    const res = await axios.put(`http://localhost:3000/edit/${editForm._id}`, editForm)
    
    // 更新本地数据
    // const index = activityList.value.findIndex(item => item.id === editForm.id)
    // if (index !== -1) {
    //   Object.assign(activityList.value[index], editForm)
    // }
    if (res.data.code === 200) {
      editDialogVisible.value = false
      ElMessage.success('编辑成功')
      getlist()
    }
    
    
  } catch (error) {
    console.error('编辑失败:', error)
    ElMessage.error('编辑失败')
  }
}

const viewRegistrations = (row: any) => {
  console.log("下载:", row);
};

const manageRegistrations = (row: any) => {
  router.push("/dashboard/activity/registration");
};

const viewDetails = (row: any) => {
  console.log("取消发布:", row);
};

const deleteActivity =async (row: any) => {
  // console.log("删除活动:", row);
  // 调用删除API
  //删除提示
  ElMessageBox.confirm('确定删除该活动吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 确定删除
  let res =await axios.delete(`http://localhost:3000/delete/${row._id}`);
  if (res.data.code === 200) {
    ElMessage.success('删除成功')
    getlist()
  }
}).catch(() => {
  // 取消删除
})
};

// 分页方法
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1 // 重置到第一页
  getlist()
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  getlist()
};

// 获取列表数据
const getlist = async () => {
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    const res = await axios.get('http://localhost:3000/list', { params })
    // console.log(res.data.data,499);
    
    activityList.value = res.data.data
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取数据失败:', error)
  }
};

onMounted(() => {
  // 初始化加载数据
  getlist();
});

// 格式化时间
const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  return dayjs(dateString).format("YYYY-MM-DD HH:mm:ss");
};

// 获取状态类型
const getStateType = (state: string) => {
  
  switch (state) {
    case "待发布":
      return "info";
    case "已发布":
      return "success";
    case "已下线":
      return "primary";
    default:
      return "info";
  }
};

// 获取状态文本
const getStateText = (state: string) => {
  // console.log(state,536);
  switch (state) {
    case "待发布":
      return "待发布";
    case "已发布":
      return "已发布";
    case "已下线":
      return "已下线";
    default:
      return "未知状态";
  }
};

// 置顶操作
const handleSetTop = async (row: any) => {
  try {
    // 检查已置顶数量
    const topCount = activityList.value.filter(
      (item) => item.topstate === 1
    ).length;
    if (topCount >= 3) {
      ElMessage.warning("最多只能置顶3个活动");
      return;
    }

    // 二次确认
    await ElMessageBox.confirm("确定置顶吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 调用置顶API
    // const res = await axios.post(`http://localhost:3000/setTop/${row.id}`)

    // 更新本地数据
    row.topstate = 1;
    row.toptime = new Date().toISOString();

    ElMessage.success("置顶成功");
  } catch (error) {
    // 用户取消操作
  }
};

// 取消置顶操作
const handleCancelTop = async (row: any) => {
  try {
    // 二次确认
    await ElMessageBox.confirm("确定取消置顶吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 调用取消置顶API
    // const res = await axios.post(`http://localhost:3000/cancelTop/${row.id}`)

    // 更新本地数据
    row.topstate = 0;
    row.toptime = null;

    ElMessage.success("取消置顶成功");
  } catch (error) {
    // 用户取消操作
  }
};

// 发布操作
const handlePublish = async (row: any) => {
  try {
    // 二次确认
    await ElMessageBox.confirm("发布后用户即可看见，确认发布吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })

    // 调用发布API
    const res = await axios.put(`http://localhost:3000/publish/${row._id}`)
    if (res.data.code === 200) {
      getlist()
      ElMessage.success("发布成功");
    } else {
      ElMessage.error(res.data.msg)
    }
    // 更新本地数据状态
    // row.state = "已发布";

    
  } catch (error) {
    // 用户取消操作
  }
};

// 复制链接操作
const copyLink = async (row: any) => {
  try {
    const link = `${window.location.origin}/dashboard/activity/${row.id}`;
    await navigator.clipboard.writeText(link);
    ElMessage.success("复制成功");
  } catch (error) {
    // 降级方案
    const textArea = document.createElement("textarea");
    textArea.value = `${window.location.origin}/dashboard/activity/${row.id}`;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    ElMessage.success("复制成功");
  }
};

// 下线操作
const handleOffline = async (row: any) => {
  try {
    // 二次确认
    await ElMessageBox.confirm("下线后不再显示给用户，确认下线吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 调用下线API
    const res = await axios.put(`http://localhost:3000/offline/${row._id}`)
    if (res.data.code === 200) {
      getlist()
      ElMessage.success("下线成功");
    }
    // 更新本地数据状态
    // row.state = "已下线";
    // 如果已置顶，下线时取消置顶
    // if (row.topstate === 1) {
    //   row.topstate = 0;
    //   row.toptime = null;
    // }

    
  } catch (error) {
    // 用户取消操作
  }
};

const goToRegistration = () => {
  router.push('/dashboard/activity/registration')
}
</script>

<style scoped>
.banner-sort {
  padding: 20px;
}

.search-section {
  background: #f5f5f5;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-item label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.action-section {
  margin-bottom: 20px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination-section {
  display: flex;
  justify-content: center;
}
</style>