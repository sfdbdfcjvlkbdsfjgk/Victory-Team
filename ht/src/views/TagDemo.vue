<template>
  <div class="tag-demo">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>标签展示组件演示</span>
        </div>
      </template>
      
      <!-- 基础展示 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <h3>基础标签展示</h3>
          <TagDisplay 
            api-url="/labels"
            @tag-selected="handleTagSelected"
          />
        </el-col>
        
        <el-col :span="12">
          <h3>可选择标签</h3>
          <TagDisplay 
            api-url="/labels"
            :selectable="true"
            :max-select="3"
            @tag-selected="handleTagSelected"
          />
          <div v-if="selectedTags.length > 0" class="selected-tags">
            <p>已选择的标签：</p>
            <el-tag 
              v-for="tag in selectedTags" 
              :key="tag"
              style="margin-right: 8px; margin-bottom: 8px;"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
      
      <!-- 可删除标签 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <h3>可删除标签（管理员功能）</h3>
          <TagDisplay 
            api-url="/labels"
            :show-delete="true"
            @tag-deleted="handleTagDeleted"
          />
        </el-col>
      </el-row>
      
      <!-- 简单标签展示 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <h3>简单标签展示（类似图二）</h3>
          <SimpleTagDisplay 
            api-url="/labels"
            @tag-click="handleTagClick"
          />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import TagDisplay from '@/components/TagDisplay.vue'
import SimpleTagDisplay from '@/components/SimpleTagDisplay.vue'

const selectedTags = ref<string[]>([])

const handleTagSelected = (tags: string[]) => {
  selectedTags.value = tags
  console.log('选中的标签:', tags)
}

const handleTagDeleted = (tag: any) => {
  console.log('删除的标签:', tag)
  ElMessage.success(`已删除标签: ${tag.sport_tag || tag}`)
}

const handleTagClick = (tag: any) => {
  console.log('点击的标签:', tag)
  ElMessage.info(`点击了标签: ${tag.sport_tag || tag}`)
}
</script>

<style scoped>
.tag-demo {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h3 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.selected-tags {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.selected-tags p {
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}
</style> 