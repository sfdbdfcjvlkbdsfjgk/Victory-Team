<template>
  <div class="simple-tag-display">
    <!-- 标签网格 -->
    <div v-if="!loading" class="tag-grid">
      <div
        v-for="tag in tags"
        :key="tag._id || tag"
        class="tag-item"
        @click="handleTagClick(tag)"
      >
        {{ tag.sport_tag || tag }}
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <el-skeleton :rows="4" animated />
    </div>
    
    <!-- 空状态 -->
    <div v-if="!loading && tags.length === 0" class="empty">
      <el-empty description="暂无标签" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// axios配置
axios.defaults.baseURL = 'http://localhost:3000'

// 定义props
interface Props {
  apiUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  apiUrl: '/labels'
})

// 定义emits
const emit = defineEmits<{
  'tag-click': [tag: any]
}>()

// 响应式数据
const tags = ref<any[]>([])
const loading = ref(false)

// 获取标签数据
const fetchTags = async () => {
  loading.value = true
  try {
    const response = await axios.get(props.apiUrl)
    console.log('标签接口响应:', response.data) // 调试信息
    
    // 适配不同的后端响应格式
    if (response.data && response.data.code === 200) {
      // 后端返回格式: {code: 200, data: [...]}
      tags.value = response.data.data || []
    } else if (response.data && response.data.success) {
      // 后端返回格式: {success: true, data: [...]}
      tags.value = response.data.data || []
    } else if (Array.isArray(response.data)) {
      // 直接返回数组格式
      tags.value = response.data
    } else {
      console.error('获取标签数据失败:', response.data?.msg || response.data?.message || '未知错误')
      tags.value = []
    }
    
    console.log('处理后的标签数据:', tags.value) // 调试信息
  } catch (error) {
    console.error('获取标签失败:', error)
    ElMessage.error('获取标签失败')
    tags.value = []
  } finally {
    loading.value = false
  }
}

// 处理标签点击
const handleTagClick = (tag: any) => {
  emit('tag-click', tag)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchTags()
})

// 暴露方法给父组件
defineExpose({
  fetchTags
})
</script>

<style scoped>
.simple-tag-display {
  padding: 20px;
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

.loading {
  padding: 20px 0;
}

.empty {
  padding: 40px 0;
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