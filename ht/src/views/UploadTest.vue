<template>
  <div class="upload-test-page">
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <h3>🚀 大文件上传测试工具</h3>
          <el-tag type="success">超级稳定版 V2</el-tag>
        </div>
      </template>

      <div class="upload-section">
        <!-- 速度模式选择 -->
        <div class="speed-mode-selector">
          <h4>🚀 选择上传模式</h4>
          <el-radio-group v-model="selectedSpeedMode" class="mode-group">
            <el-radio-button value="STANDARD">
              <div class="mode-option">
                <div class="mode-title">🛡️ 稳定模式</div>
                <div class="mode-desc">最高稳定性，适合网络不稳定环境</div>
                <div class="mode-specs">5MB分片 | 2并发 | 5重试</div>
              </div>
            </el-radio-button>
            <el-radio-button value="TURBO">
              <div class="mode-option">
                <div class="mode-title">🚀 高速模式</div>
                <div class="mode-desc">平衡速度与稳定性，推荐使用</div>
                <div class="mode-specs">20MB分片 | 6并发 | 3重试</div>
              </div>
            </el-radio-button>
            <el-radio-button value="LIGHTNING">
              <div class="mode-option">
                <div class="mode-title">⚡ 极速模式</div>
                <div class="mode-desc">最大化速度，需要稳定网络</div>
                <div class="mode-specs">50MB分片 | 10并发 | 2重试</div>
              </div>
            </el-radio-button>
          </el-radio-group>
        </div>

        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          :disabled="chunkUpload.isUploading.value"
          accept="*"
        >
          <div v-if="!selectedFile && !chunkUpload.isUploading.value" class="upload-placeholder">
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">拖拽文件到此处或点击选择</div>
            <div class="upload-hint">支持任意格式，最大10GB</div>
          </div>
          
          <div v-else-if="chunkUpload.isUploading.value" class="upload-progress">
            <el-progress 
              :percentage="chunkUpload.uploadProgress.value" 
              :status="chunkUpload.uploadProgress.value === 100 ? 'success' : undefined"
              :stroke-width="8"
              :show-text="false"
            />
            <div class="progress-info">
              <span class="progress-text">{{ chunkUpload.uploadStatus.value }}</span>
              <span class="progress-percent">{{ chunkUpload.progressText.value }}</span>
            </div>
            
            <!-- 实时统计 -->
            <div class="upload-stats" v-if="chunkUpload.monitor">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-statistic title="成功率" :value="parseFloat(uploadStats.successRate)" suffix="%" />
                </el-col>
                <el-col :span="6">
                  <el-statistic title="上传速度" :value="parseFloat(uploadStats.speed)" suffix="KB/s" />
                </el-col>
                <el-col :span="6">
                  <el-statistic title="重试次数" :value="chunkUpload.monitor.metrics.retryAttempts" />
                </el-col>
                <el-col :span="6">
                  <el-statistic title="预计剩余" :value="uploadStats.eta" :formatter="(value) => value" />
                </el-col>
              </el-row>
            </div>
            
            <el-button 
              type="danger" 
              @click="chunkUpload.cancelUpload()"
              class="cancel-btn"
            >
              取消上传
            </el-button>
          </div>
          
          <div v-else class="file-selected">
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-info">
              <div class="file-name">{{ selectedFile?.name }}</div>
              <div class="file-size">{{ formatFileSize(selectedFile?.size || 0) }}</div>
            </div>
            <el-button type="primary" @click="startUpload" :loading="chunkUpload.isUploading.value">
              开始上传
            </el-button>
          </div>
        </el-upload>
      </div>

      <!-- 上传结果 -->
      <div v-if="uploadResult" class="upload-result">
        <el-alert
          title="上传成功！"
          type="success"
          :description="`文件URL: ${uploadResult.url}`"
          show-icon
          :closable="false"
        />
      </div>

      <!-- 测试建议 -->
      <div class="test-suggestions">
        <h4>💡 测试建议</h4>
        <el-steps direction="vertical" :space="80">
          <el-step title="小文件测试" description="先用1-10MB的文件测试基本功能" />
          <el-step title="中等文件测试" description="使用100-500MB的文件测试稳定性" />
          <el-step title="大文件测试" description="测试1-5GB文件，观察分片上传效果" />
          <el-step title="极限测试" description="测试接近10GB的文件，验证系统限制" />
        </el-steps>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, Document } from '@element-plus/icons-vue';
import { useChunkUploadV2 } from '../composables/useChunkUploadV2';
import { formatFileSize } from '../utils/fileUploadConfig';

const chunkUpload = useChunkUploadV2();
const selectedFile = ref<File | null>(null);
const uploadResult = ref<{url: string; fileName: string} | null>(null);
const selectedSpeedMode = ref<'STANDARD' | 'TURBO' | 'LIGHTNING'>('TURBO');

// 实时统计
const uploadStats = computed(() => {
  if (chunkUpload.monitor) {
    return chunkUpload.monitor.getUploadStats();
  }
  return { successRate: '0', failureRate: '0', speed: '0', eta: '0秒' };
});

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw;
  uploadResult.value = null;
  ElMessage.info(`已选择文件: ${file.raw.name} (${formatFileSize(file.raw.size)})`);
};

const startUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.error('请先选择文件');
    return;
  }

  try {
    const result = await chunkUpload.uploadLargeFile(
      selectedFile.value,
      (progress, status) => {
        console.log(`进度: ${progress}%, 状态: ${status}`);
      },
      undefined, // 使用默认配置
      selectedSpeedMode.value // 使用选择的速度模式
    );
    
    if (result) {
      uploadResult.value = result;
      selectedFile.value = null;
    }
  } catch (error) {
    console.error('上传失败:', error);
  }
};
</script>

<style scoped>
.upload-test-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.test-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-section {
  margin-top: 20px;
}

.speed-mode-selector {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.speed-mode-selector h4 {
  margin-bottom: 15px;
  color: #303133;
}

.mode-group {
  display: flex;
  gap: 10px;
}

.mode-option {
  text-align: left;
}

.mode-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.mode-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.mode-specs {
  font-size: 12px;
  color: #909399;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

.upload-placeholder {
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #909399;
}

.upload-progress {
  width: 100%;
  padding: 40px;
  text-align: center;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  font-size: 14px;
  color: #606266;
}

.progress-percent {
  font-weight: bold;
  color: #409eff;
  font-size: 18px;
}

.upload-stats {
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.cancel-btn {
  margin-top: 16px;
}

.file-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
}

.file-icon {
  font-size: 48px;
  color: #409eff;
}

.file-info {
  text-align: center;
}

.file-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.file-size {
  font-size: 14px;
  color: #909399;
}

.upload-result {
  margin-top: 20px;
}

.test-suggestions {
  margin-top: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.test-suggestions h4 {
  margin-bottom: 20px;
  color: #303133;
}

/* 速度模式选择器样式 */
.speed-mode-selector {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.speed-mode-selector h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.mode-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.mode-group :deep(.el-radio-button) {
  margin: 0;
  flex: 1;
  min-width: 200px;
}

.mode-group :deep(.el-radio-button__inner) {
  width: 100%;
  height: auto;
  padding: 16px 12px;
  border-radius: 8px;
  border: 2px solid #dcdfe6;
  background: #fff;
  color: #606266;
  font-weight: normal;
  transition: all 0.3s;
}

.mode-group :deep(.el-radio-button__inner:hover) {
  border-color: #409eff;
  color: #409eff;
}

.mode-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.mode-option {
  text-align: center;
}

.mode-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  line-height: 1.4;
}

.mode-specs {
  font-size: 11px;
  color: #c0c4cc;
  font-family: 'Monaco', 'Menlo', monospace;
}
</style> 