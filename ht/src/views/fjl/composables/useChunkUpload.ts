import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { getOptimalConfig, formatFileSize, estimateUploadTime, type UploadConfig } from '../utils/fileUploadConfig';

// 创建专用的上传axios实例
const uploadApi = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 300000 // 5分钟超时，适合大文件上传
});

// 计算文件hash
const calculateFileHash = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const hashBuffer = new Uint8Array(arrayBuffer);
      let hash = '';
      for (let i = 0; i < hashBuffer.length; i += 1000) {
        hash += hashBuffer[i].toString(16);
      }
      // 简单hash，实际项目可以使用crypto-js的MD5
      resolve(hash + file.name + file.size);
    };
    reader.readAsArrayBuffer(file.slice(0, 10000)); // 读取前10KB计算hash
  });
};

// 文件分片 - 调整为10MB分片以支持更大文件
const createFileChunks = (file: File, chunkSize: number = 10 * 1024 * 1024) => {
  const chunks = [];
  let start = 0;
  let index = 0;
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push({
      chunk: file.slice(start, end),
      index,
      start,
      end
    });
    start = end;
    index++;
  }
  
  return chunks;
};

export const useChunkUpload = () => {
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const uploadStatus = ref('');
  const currentFile = ref<File | null>(null);
  
  // 上传进度计算
  const progressText = computed(() => {
    return `${uploadProgress.value.toFixed(1)}%`;
  });
  
  // 检查已上传的分片
  const checkUploadedChunks = async (fileHash: string, totalChunks: number) => {
    try {
      const response = await uploadApi.post('/api/upload/check', {
        fileHash,
        totalChunks
      });
      
      if (response.data.code === 200) {
        return response.data.data.uploadedChunks || [];
      }
      return [];
    } catch (error) {
      console.error('检查分片失败:', error);
      return [];
    }
  };
  
  // 上传单个分片
  const uploadChunk = async (
    chunk: Blob, 
    index: number, 
    fileHash: string, 
    fileName: string, 
    totalChunks: number,
    retries: number = 3
  ): Promise<boolean> => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('fileHash', fileHash);
    formData.append('chunkIndex', index.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', fileName);
    
          for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const response = await uploadApi.post('/api/upload/chunk', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000 // 60秒超时，适合大分片
          });
          
          if (response.data.code === 200) {
            return true;
          }
        } catch (error) {
          console.error(`分片 ${index} 上传失败 (尝试 ${attempt + 1}/${retries}):`, error);
          if (attempt === retries - 1) {
            throw error;
          }
          // 等待一段时间后重试（指数退避）
          await new Promise(resolve => setTimeout(resolve, Math.min(5000, 1000 * Math.pow(2, attempt))));
        }
      }
    
    return false;
  };
  
  // 合并分片
  const mergeChunks = async (fileHash: string, fileName: string, totalChunks: number) => {
    try {
      const response = await uploadApi.post('/api/upload/merge', {
        fileHash,
        fileName,
        totalChunks
      });
      
      return response.data;
    } catch (error) {
      console.error('合并分片失败:', error);
      throw error;
    }
  };
  
  // 主要的上传函数 - 自动选择最佳配置
  const uploadLargeFile = async (
    file: File,
    onProgress?: (progress: number, status: string) => void,
    customConfig?: Partial<UploadConfig>
  ): Promise<{ url: string; fileName: string } | null> => {
    if (!file) {
      ElMessage.error('请选择文件');
      return null;
    }
    
    try {
      isUploading.value = true;
      uploadProgress.value = 0;
      currentFile.value = file;
      
      // 自动选择最佳配置
      const config = customConfig ? { ...getOptimalConfig(file.size), ...customConfig } : getOptimalConfig(file.size);
      
      // 显示文件信息和预估时间
      const fileSizeText = formatFileSize(file.size);
      const estimatedTime = estimateUploadTime(file.size);
      
      uploadStatus.value = `准备上传 ${fileSizeText} 文件，预估时间: ${estimatedTime}`;
      onProgress?.(0, uploadStatus.value);
      
      // 检查文件大小限制
      if (file.size > config.maxFileSize) {
        ElMessage.error(`文件大小超过限制 (最大: ${formatFileSize(config.maxFileSize)})`);
        return null;
      }
      
      // 计算文件hash
      uploadStatus.value = '正在计算文件标识...';
      onProgress?.(0, uploadStatus.value);
      
      const fileHash = await calculateFileHash(file);
      
      // 创建分片
      uploadStatus.value = '正在准备分片...';
      onProgress?.(5, uploadStatus.value);
      
      const chunks = createFileChunks(file, config.chunkSize);
      const totalChunks = chunks.length;
      
      console.log(`文件: ${fileSizeText}, 分片: ${totalChunks}个 (${formatFileSize(config.chunkSize)}/片), 并发: ${config.concurrency}`);
      
      // 检查已上传的分片（支持断点续传）
      uploadStatus.value = '检查上传进度...';
      const uploadedChunks = await checkUploadedChunks(fileHash, totalChunks);
      
      let uploadedCount = uploadedChunks.length;
      uploadProgress.value = (uploadedCount / totalChunks) * 90; // 上传占90%，合并占10%
      
      if (uploadedCount === totalChunks) {
        uploadStatus.value = '合并文件中...';
        onProgress?.(90, uploadStatus.value);
      } else {
        uploadStatus.value = `上传中... (${uploadedCount}/${totalChunks})`;
        onProgress?.(uploadProgress.value, uploadStatus.value);
        
        // 使用更稳定的分片上传策略
        const chunksToUpload = chunks.filter(chunk => !uploadedChunks.includes(chunk.index));
        
        // 分批次上传，每批次之间有延迟
        for (let i = 0; i < chunksToUpload.length; i += config.concurrency) {
          const batch = chunksToUpload.slice(i, i + config.concurrency);
          
          // 并发上传当前批次
          const batchResults = await Promise.allSettled(batch.map(async ({ chunk, index }) => {
            const success = await uploadChunk(chunk, index, fileHash, file.name, totalChunks, config.retries);
            if (success) {
              uploadedCount++;
              uploadProgress.value = (uploadedCount / totalChunks) * 90;
              uploadStatus.value = `上传中... (${uploadedCount}/${totalChunks}) - ${fileSizeText}`;
              onProgress?.(uploadProgress.value, uploadStatus.value);
            }
            return { index, success };
          }));
          
          // 检查失败的分片
          const failedChunks = batchResults
            .map((result, idx) => ({ result, originalIndex: batch[idx].index }))
            .filter(({ result }) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
            .map(({ originalIndex }) => originalIndex);
          
          if (failedChunks.length > 0) {
            console.warn(`批次 ${Math.floor(i / config.concurrency) + 1} 中有 ${failedChunks.length} 个分片失败:`, failedChunks);
          }
          
          // 批次之间的延迟，避免服务器压力过大
          if (i + config.concurrency < chunksToUpload.length) {
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms延迟
          }
        }
      }
      
      // 最终检查所有分片是否都上传成功
      uploadStatus.value = '验证分片完整性...';
      const finalCheck = await checkUploadedChunks(fileHash, totalChunks);
      const missingChunks = [];
      for (let i = 0; i < totalChunks; i++) {
        if (!finalCheck.includes(i)) {
          missingChunks.push(i);
        }
      }
      
      if (missingChunks.length > 0) {
        uploadStatus.value = `重新上传缺失分片... (${missingChunks.length}个)`;
        console.log('重新上传缺失的分片:', missingChunks);
        
        // 重新上传缺失的分片（逐个上传，确保稳定）
        for (const chunkIndex of missingChunks) {
          const chunkToRetry = chunks[chunkIndex];
          if (chunkToRetry) {
            const success = await uploadChunk(
              chunkToRetry.chunk, 
              chunkIndex, 
              fileHash, 
              file.name, 
              totalChunks, 
              10 // 更多重试次数
            );
            if (success) {
              uploadedCount++;
              uploadProgress.value = (uploadedCount / totalChunks) * 90;
              uploadStatus.value = `补传分片... (${uploadedCount}/${totalChunks})`;
              onProgress?.(uploadProgress.value, uploadStatus.value);
            }
          }
        }
      }
      
      // 合并分片
      uploadStatus.value = '合并文件中...';
      uploadProgress.value = 90;
      onProgress?.(90, uploadStatus.value);
      
      const mergeResult = await mergeChunks(fileHash, file.name, totalChunks);
      
      if (mergeResult.code === 200) {
        uploadProgress.value = 100;
        uploadStatus.value = '上传完成';
        onProgress?.(100, uploadStatus.value);
        
        ElMessage.success(`文件上传成功！大小: ${formatFileSize(mergeResult.data.size)}`);
        
        return {
          url: mergeResult.data.url,
          fileName: mergeResult.data.fileName
        };
      } else {
        throw new Error(mergeResult.msg || '文件合并失败');
      }
      
    } catch (error: any) {
      console.error('文件上传失败:', error);
      ElMessage.error(error.message || '文件上传失败');
      return null;
    } finally {
      isUploading.value = false;
    }
  };
  
  // 取消上传
  const cancelUpload = () => {
    isUploading.value = false;
    uploadProgress.value = 0;
    uploadStatus.value = '';
    currentFile.value = null;
  };
  
  return {
    isUploading,
    uploadProgress,
    uploadStatus,
    progressText,
    currentFile,
    uploadLargeFile,
    cancelUpload
  };
}; 