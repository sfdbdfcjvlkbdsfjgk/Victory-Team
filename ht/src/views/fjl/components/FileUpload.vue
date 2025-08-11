<template>
  <div class="upload-container">
    <el-upload
      class="upload-area"
      action="#"
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleFileChange"
      :accept="accept"
      :disabled="chunkUpload.isUploading.value"
    >
      <div v-if="!modelValue && !chunkUpload.isUploading.value" class="upload-box">
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">上传文件</div>
      </div>
      
      <div v-else-if="chunkUpload.isUploading.value" class="upload-progress">
        <el-progress 
          :percentage="chunkUpload.uploadProgress.value" 
          :status="chunkUpload.uploadProgress.value === 100 ? 'success' : undefined"
          :stroke-width="6"
        />
        <div class="progress-info">
          <span class="progress-text">{{ chunkUpload.uploadStatus.value }}</span>
          <span class="progress-percent">{{ chunkUpload.progressText.value }}</span>
        </div>
        <el-button 
          size="small" 
          type="danger" 
          @click="chunkUpload.cancelUpload()"
          class="cancel-btn"
        >
          取消上传
        </el-button>
      </div>
      
      <div v-else class="file-preview">
        <div v-if="isImageFile(modelValue)" class="image-preview">
          <el-image
            :src="getFileUrl(modelValue)"
            alt="预览图片"
            class="preview-image"
            lazy
            loading="lazy"
            :preview-src-list="[getFileUrl(modelValue)]"
          />
        </div>
        <div v-else-if="isVideoFile(modelValue)" class="video-preview" @click="handleVideoPreview">
          <video
            :src="getFileUrl(modelValue)"
            class="preview-video"
            controls
            preload="metadata"
            @loadstart="handleVideoLoadStart"
            @error="handleVideoError"
            @click.stop
          >
            您的浏览器不支持视频播放
          </video>
        </div>
        <div v-else class="file-info">
          <el-icon class="file-icon"><Document /></el-icon>
          <span class="file-name">{{ getFileName(modelValue) }}</span>
        </div>
        <div v-if="!isVideoFile(modelValue)" class="preview-overlay">
          <el-icon class="preview-icon"><Plus /></el-icon>
          <div class="preview-text">重新上传</div>
        </div>
        <div class="delete-btn" @click.stop="handleDeleteFile">
          <el-icon><Close /></el-icon>
        </div>
      </div>
    </el-upload>
    
    <div class="upload-hint" v-if="showHint">
      ⚡ 超级稳定版！支持图片预览、视频预览等大文件，最大支持{{ maxSizeText }}。智能分片、断点续传、失败重试
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, withDefaults } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Close, Document } from '@element-plus/icons-vue';
import { useChunkUploadSimple } from '../composables/useChunkUploadSimple';

interface Props {
  modelValue: string;
  accept?: string;
  maxSize?: number; // 字节
  uploadMode?: 'TURBO' | 'NORMAL' | 'SLOW';
  showHint?: boolean;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'upload-success', result: any): void;
  (e: 'upload-error', error: any): void;
  (e: 'upload-progress', progress: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.webm',
  maxSize: 10 * 1024 * 1024 * 1024, // 默认10GB
  uploadMode: 'TURBO',
  showHint: true,
  disabled: false
});

const emit = defineEmits<Emits>();

// 使用简化分片上传功能
const chunkUpload = useChunkUploadSimple();

// 计算最大文件大小显示文本
const maxSizeText = computed(() => {
  const size = props.maxSize;
  if (size >= 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024 * 1024)).toFixed(0)}GB`;
  } else if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(0)}MB`;
  } else if (size >= 1024) {
    return `${(size / 1024).toFixed(0)}KB`;
  }
  return `${size}B`;
});

// 验证文件类型
const validateFileType = (file: File): boolean => {
  const allowedTypes = props.accept.split(',').map(type => {
    if (type.startsWith('.')) {
      // 文件扩展名
      return `image/${type.slice(1)}` || `video/${type.slice(1)}`;
    }
    return type.trim();
  });
  
  // 更严格的类型检查
  const typeMap: Record<string, string[]> = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'], 
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.mp4': ['video/mp4'],
    '.avi': ['video/avi', 'video/x-msvideo'],
    '.mov': ['video/quicktime'],
    '.webm': ['video/webm']
  };
  
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
  const validTypes = typeMap[fileExt];
  
  if (validTypes && !validTypes.includes(file.type)) {
    ElMessage.error(`文件类型不匹配。期望: ${validTypes.join('/')}, 实际: ${file.type}`);
    return false;
  }
  
  return true;
};

// 处理文件选择
const handleFileChange = async (file: any) => {
  const rawFile = file.raw;
  
  // 验证文件类型
  if (!validateFileType(rawFile)) {
    return false;
  }

  // 验证文件大小
  if (rawFile.size > props.maxSize) {
    ElMessage.error(`文件大小不能超过${maxSizeText.value}`);
    return false;
  }

  try {
    console.log(`🚀 开始上传文件: ${rawFile.name} (${(rawFile.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // 使用简化分片上传
    const result = await chunkUpload.uploadLargeFile(
      rawFile,
      (progress, status) => {
        emit('upload-progress', progress);
        console.log(`📊 上传进度: ${progress}%, 状态: ${status}`);
      }
    );
    
    if (result) {
      emit('update:modelValue', result.url);
      emit('upload-success', result);
      ElMessage.success(`${rawFile.type.startsWith('video/') ? '视频' : '文件'}上传成功`);
      console.log(`✅ 上传成功: ${result.url}`);
    } else {
      throw new Error('上传返回结果为空');
    }
  } catch (error: any) {
    console.error("❌ 文件上传失败:", error);
    
    // 根据错误类型提供不同的提示
    let errorMessage = "文件上传失败";
    if (error.message?.includes('btoa') || error.message?.includes('Latin1')) {
      errorMessage = "文件名包含特殊字符，上传失败。请尝试重命名文件为英文名称";
    } else if (error.message?.includes('network') || error.message?.includes('500')) {
      errorMessage = "网络错误，请检查网络连接后重试";
    } else if (error.message?.includes('timeout')) {
      errorMessage = "上传超时，请尝试选择较小的文件或稍后重试";
    } else if (error.message?.includes('分片')) {
      errorMessage = "分片上传失败，请重新尝试";
    } else if (error.message?.includes('InvalidCharacterError')) {
      errorMessage = "文件信息包含无效字符，请重新选择文件";
    } else if (error.message) {
      errorMessage = `上传失败: ${error.message}`;
    }
    
    emit('upload-error', error);
    ElMessage.error(errorMessage);
    
    // 重置上传状态
    chunkUpload.cleanup?.();
  }

  return false; // 阻止自动上传
};

// 删除文件
const handleDeleteFile = () => {
  emit('update:modelValue', '');
};

// 判断是否为图片文件
const isImageFile = (url: string): boolean => {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
};

// 判断是否为视频文件
const isVideoFile = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.avi', '.mov', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

// 获取文件URL
const getFileUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) {
    return url;
  }
  return `http://localhost:3000${url}`;
};

// 获取文件名
const getFileName = (url: string): string => {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1];
};

// 视频加载开始处理
const handleVideoLoadStart = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📹 视频开始加载');
  }
};

// 视频加载错误处理
const handleVideoError = (event: Event) => {
  console.error('📹 视频加载失败:', event);
  ElMessage.error('视频加载失败，请检查文件格式');
};

// 视频预览处理（点击视频区域但不是控件时触发）
const handleVideoPreview = () => {
  // 创建全屏视频预览
  const videoUrl = getFileUrl(props.modelValue);
  const videoElement = document.createElement('video');
  videoElement.src = videoUrl;
  videoElement.controls = true;
  videoElement.autoplay = true;
  videoElement.style.maxWidth = '90vw';
  videoElement.style.maxHeight = '90vh';
  videoElement.style.objectFit = 'contain';
  
  // 创建模态框
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    cursor: pointer;
  `;
  
  overlay.appendChild(videoElement);
  
  // 点击背景关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
  
  // ESC键关闭
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  document.body.appendChild(overlay);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📹 打开视频全屏预览');
  }
};

// 清理资源
const cleanup = () => {
  chunkUpload.cleanup?.();
};

// 暴露清理方法
defineExpose({
  cleanup
});
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-area {
  width: 100%;
}

.upload-box {
  width: 120px;
  height: 80px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
  background: #fafafa;
}

.upload-box:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 24px;
  color: #999;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 12px;
  color: #666;
}

.upload-hint {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

/* 上传进度样式 */
.upload-progress {
  padding: 20px;
  text-align: center;
  background: #f5f7fa;
  border-radius: 6px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  font-size: 14px;
  color: #606266;
}

.progress-text {
  flex: 1;
  text-align: left;
}

.progress-percent {
  font-weight: bold;
  color: #409eff;
}

.cancel-btn {
  margin-top: 10px;
}

/* 文件预览样式 */
.file-preview {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 24px;
  color: #909399;
}

.file-name {
  font-size: 12px;
  color: #606266;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 图片预览样式 */
.image-preview {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 视频预览样式 */
.video-preview {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: #000;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.preview-video::-webkit-media-controls {
  transform: scale(0.8);
  transform-origin: bottom left;
}

.preview-video::-webkit-media-controls-panel {
  background: rgba(0, 0, 0, 0.8);
}

.preview-video::-webkit-media-controls-play-button {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
}

.preview-video::-webkit-media-controls-current-time-display,
.preview-video::-webkit-media-controls-time-remaining-display {
  color: white;
  font-size: 10px;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .preview-overlay,
.video-preview:hover .preview-overlay {
  opacity: 1;
}

/* 视频预览悬停效果 */
.video-preview::after {
  content: "点击预览\\A按住重新上传";
  white-space: pre;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1.4;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  z-index: 5;
}

.video-preview:hover::after {
  opacity: 1;
}

.preview-icon {
  font-size: 20px;
  color: white;
  margin-bottom: 4px;
}

.preview-text {
  font-size: 10px;
  color: white;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s;
  z-index: 10;
}

.delete-btn:hover {
  background: rgba(245, 108, 108, 0.8);
}

.delete-btn .el-icon {
  font-size: 12px;
  color: white;
}
</style> 