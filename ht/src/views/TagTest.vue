<template>
  <div class="tag-test">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>标签展示测试</span>
          <el-button type="primary" @click="loadTestData">加载测试数据</el-button>
        </div>
      </template>
      
      <!-- 模拟数据展示 -->
      <div class="test-section">
        <h3>模拟后端数据：</h3>
        <el-code style="margin-bottom: 20px;">
          <pre>{{ JSON.stringify(mockData, null, 2) }}</pre>
        </el-code>
      </div>
      
      <!-- 标签展示组件 -->
      <div class="test-section">
        <h3>标签展示效果：</h3>
        <div class="tag-grid">
          <div
            v-for="tag in mockData"
            :key="tag._id"
            class="tag-item"
            @click="handleTagClick(tag)"
          >
            {{ tag.sport_tag }}
          </div>
        </div>
      </div>
      
      <!-- 使用SimpleTagDisplay组件 -->
      <div class="test-section">
        <h3>使用SimpleTagDisplay组件：</h3>
        <SimpleTagDisplay 
          api-url="/getlabel"
          @tag-click="handleTagClick"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import SimpleTagDisplay from '@/components/SimpleTagDisplay.vue'

// 模拟您提供的数据
const mockData = ref([
  {
    "_id": "688c82867bbc643348b2c763",
    "sport_tag": "你好",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c83b87bbc643348b2c769", 
    "sport_tag": "不知道",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c770",
    "sport_tag": "柔道",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c771",
    "sport_tag": "跑步",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c772",
    "sport_tag": "马拉松",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c773",
    "sport_tag": "篮球",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c774",
    "sport_tag": "游泳",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c775",
    "sport_tag": "爬山",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c776",
    "sport_tag": "羽毛球",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c777",
    "sport_tag": "围棋",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c778",
    "sport_tag": "山跑",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c779",
    "sport_tag": "骑行",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c780",
    "sport_tag": "步行",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c781",
    "sport_tag": "瑜伽",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c782",
    "sport_tag": "健身",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c783",
    "sport_tag": "台球",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c784",
    "sport_tag": "高尔夫球",
    "tag_createTime": "2025-08-01"
  },
  {
    "_id": "688c84567bbc643348b2c785",
    "sport_tag": "象棋",
    "tag_createTime": "2025-08-01"
  }
])

const loadTestData = () => {
  ElMessage.success('测试数据已加载')
}

const handleTagClick = (tag: any) => {
  console.log('点击的标签:', tag)
  ElMessage.info(`点击了标签: ${tag.sport_tag}`)
}
</script>

<style scoped>
.tag-test {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-section {
  margin-bottom: 30px;
}

h3 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.tag-item {
  padding: 12px 16px;
  background-color: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: #0369a1;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.tag-item:hover {
  background-color: #e0f2fe;
  border-color: #0284c7;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(3, 105, 161, 0.15);
}

:deep(.el-code) {
  display: block;
  padding: 15px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tag-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
  
  .tag-item {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style> 