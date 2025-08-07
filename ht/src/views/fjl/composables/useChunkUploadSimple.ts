import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

// 创建专用的上传axios实例
const uploadApi = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 120000 // 2分钟超时
});

// 计算文件hash - 简化版（支持中文文件名）
const calculateFileHash = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // 使用安全的方式生成hash，避免中文字符问题
    const fileInfo = `${file.size}_${file.lastModified}_${Date.now()}`;
    let hash = '';
    
    // 简单hash算法，避免btoa编码问题
    for (let i = 0; i < fileInfo.length; i++) {
      const char = fileInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    // 转换为正数并添加随机后缀
    const positiveHash = Math.abs(hash).toString(36);
    const randomSuffix = Math.random().toString(36).substr(2, 8);
    const finalHash = positiveHash + randomSuffix;
    
    resolve(finalHash);
  });
};

// 文件分片
const createFileChunks = (file: File, chunkSize: number = 5 * 1024 * 1024) => {
  const chunks = [];
  let start = 0;
  let index = 0;
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push({
      chunk: file.slice(start, end),
      index,
      start,
      end,
      size: end - start
    });
    start = end;
    index++;
  }
  
  return chunks;
};

export const useChunkUploadSimple = () => {
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const uploadStatus = ref('');
  
  // 上传进度计算
  const progressText = computed(() => {
    return `${uploadProgress.value.toFixed(1)}%`;
  });

  // 检查已上传的分片
  const checkUploadedChunks = async (fileHash: string, totalChunks: number) => {
    try {
      const response = await uploadApi.post('/api/upload-simple/check', {
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
    totalChunks: number
  ): Promise<boolean> => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('fileHash', fileHash);
    formData.append('chunkIndex', index.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', fileName);
    
    try {
      const response = await uploadApi.post('/api/upload-simple/chunk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 1分钟超时
      });
      
      if (response.data.code === 200) {
        console.log(`✅ 分片 ${index + 1} 上传成功`);
        return true;
      } else {
        console.error(`❌ 分片 ${index + 1} 上传失败:`, response.data.msg);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ 分片 ${index + 1} 上传异常:`, error.message);
      return false;
    }
  };

  // 合并分片
  const mergeChunks = async (fileHash: string, fileName: string, totalChunks: number) => {
    try {
      const response = await uploadApi.post('/api/upload-simple/merge', {
        fileHash,
        fileName,
        totalChunks
      }, {
        timeout: 180000 // 3分钟超时
      });
      
      return response.data;
    } catch (error) {
      console.error('合并分片失败:', error);
      throw error;
    }
  };

  // 主要的上传函数
  const uploadLargeFile = async (
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<{ url: string; fileName: string } | null> => {
    if (!file) {
      ElMessage.error('请选择文件');
      return null;
    }
    
    try {
      isUploading.value = true;
      uploadProgress.value = 0;
      
      console.log(`🚀 开始上传文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // 计算文件hash
      uploadStatus.value = '计算文件标识...';
      onProgress?.(0, uploadStatus.value);
      
      const fileHash = await calculateFileHash(file);
      console.log(`🔑 文件Hash: ${fileHash}`);
      
      // 创建分片
      uploadStatus.value = '准备分片...';
      onProgress?.(2, uploadStatus.value);
      
      const chunks = createFileChunks(file);
      const totalChunks = chunks.length;
      
      console.log(`📦 创建 ${totalChunks} 个分片`);
      
      // 检查已上传的分片
      uploadStatus.value = '检查上传进度...';
      const uploadedChunks = await checkUploadedChunks(fileHash, totalChunks);
      
      let uploadedCount = uploadedChunks.length;
      uploadProgress.value = (uploadedCount / totalChunks) * 90;
      
      console.log(`📊 已上传分片: ${uploadedCount}/${totalChunks}`);
      
      // 获取需要上传的分片
      const chunksToUpload = chunks.filter(chunk => !uploadedChunks.includes(chunk.index));
      
      if (chunksToUpload.length > 0) {
        console.log(`📤 需要上传 ${chunksToUpload.length} 个分片`);
        
        // 逐个上传分片（确保稳定性）
        for (const { chunk, index } of chunksToUpload) {
          uploadStatus.value = `上传分片 ${index + 1}/${totalChunks}...`;
          onProgress?.(uploadProgress.value, uploadStatus.value);
          
          const success = await uploadChunk(chunk, index, fileHash, file.name, totalChunks);
          
          if (success) {
            uploadedCount++;
            uploadProgress.value = (uploadedCount / totalChunks) * 90;
            onProgress?.(uploadProgress.value, uploadStatus.value);
          } else {
            throw new Error(`分片 ${index + 1} 上传失败`);
          }
        }
      }
      
      // 合并文件
      uploadStatus.value = '合并文件...';
      uploadProgress.value = 95;
      onProgress?.(uploadProgress.value, uploadStatus.value);
      
      console.log('🔗 开始合并分片...');
      const mergeResult = await mergeChunks(fileHash, file.name, totalChunks);
      
      if (mergeResult.code === 200) {
        uploadProgress.value = 100;
        uploadStatus.value = '上传完成！';
        onProgress?.(uploadProgress.value, uploadStatus.value);
        
        console.log(`✅ 上传成功: ${mergeResult.data.url}`);
        
        return {
          url: mergeResult.data.url,
          fileName: mergeResult.data.fileName
        };
      } else {
        throw new Error(mergeResult.msg || '文件合并失败');
      }
      
    } catch (error: any) {
      console.error('❌ 上传失败:', error);
      throw error;
    } finally {
      isUploading.value = false;
    }
  };

  // 取消上传
  const cancelUpload = () => {
    isUploading.value = false;
    uploadProgress.value = 0;
    uploadStatus.value = '';
  };

  // 清理
  const cleanup = () => {
    cancelUpload();
  };

  return {
    isUploading,
    uploadProgress,
    uploadStatus,
    progressText,
    uploadLargeFile,
    cancelUpload,
    cleanup
  };
}; 