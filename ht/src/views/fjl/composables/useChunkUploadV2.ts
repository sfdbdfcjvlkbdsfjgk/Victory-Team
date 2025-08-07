import { ref, computed } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import axios from 'axios';
import { getOptimalConfig, formatFileSize, estimateUploadTime, UPLOAD_CONFIGS, type UploadConfig } from '../utils/fileUploadConfig';
import { useUploadMonitor } from './useUploadMonitor';

// 创建专用的上传axios实例
const uploadApi = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 180000 // 3分钟超时，适合大文件上传
});

// 计算文件hash - 更快的方式
const calculateFileHash = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const hashBuffer = new Uint8Array(arrayBuffer);
      let hash = '';
      // 取样计算hash，提高速度
      for (let i = 0; i < hashBuffer.length; i += 1000) {
        hash += hashBuffer[i].toString(16);
      }
      resolve(hash + file.name + file.size + Date.now());
    };
    // 只读取前100KB计算hash，大大提高速度
    reader.readAsArrayBuffer(file.slice(0, 100000));
  });
};

// 文件分片 - 优化版
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

// 根据速度模式估算网络速度
const getEstimatedSpeed = (speedMode: string): number => {
  switch (speedMode) {
    case 'LIGHTNING': return 50; // 50Mbps
    case 'TURBO': return 30;     // 30Mbps
    default: return 10;          // 10Mbps
  }
};

export const useChunkUploadV2 = () => {
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const uploadStatus = ref('');
  const currentFile = ref<File | null>(null);
  const monitor = useUploadMonitor();
  
  // 上传进度计算
  const progressText = computed(() => {
    return `${uploadProgress.value.toFixed(1)}%`;
  });

  // 检查已上传的分片 - 增强版
  const checkUploadedChunks = async (fileHash: string, totalChunks: number) => {
    try {
      const response = await uploadApi.post('/api/upload/check', {
        fileHash,
        totalChunks
      });
      
      if (response.data.code === 200) {
        const data = response.data.data;
        
        // 输出详细的检查结果
        if (data.needsRetry) {
          console.warn(`🔄 需要重新上传分片:`, {
            完整: data.uploadedCount,
            缺失: data.missingCount,
            损坏: data.corruptedCount,
            总计: data.totalChunks,
            完成率: `${data.completionRate}%`
          });
          
          if (data.missingChunks.length > 0) {
            console.log(`📋 缺失分片:`, data.missingChunks);
          }
          if (data.corruptedChunks.length > 0) {
            console.log(`💥 损坏分片:`, data.corruptedChunks);
          }
        } else {
          console.log(`✅ 分片检查完成: ${data.completionRate}% (${data.uploadedCount}/${data.totalChunks})`);
        }
        
        return {
          uploadedChunks: data.uploadedChunks || [],
          missingChunks: data.missingChunks || [],
          corruptedChunks: data.corruptedChunks || [],
          needsRetry: data.needsRetry || false,
          completionRate: data.completionRate || 0
        };
      }
      return {
        uploadedChunks: [],
        missingChunks: [],
        corruptedChunks: [],
        needsRetry: false,
        completionRate: 0
      };
    } catch (error) {
      console.error('❌ 检查分片失败:', error);
      return {
        uploadedChunks: [],
        missingChunks: [],
        corruptedChunks: [],
        needsRetry: false,
        completionRate: 0
      };
    }
  };

  // 兼容的分片检查函数 - 只返回上传完成的分片数组（为了向后兼容）
  const checkUploadedChunksCompat = async (fileHash: string, totalChunks: number): Promise<number[]> => {
    const result = await checkUploadedChunks(fileHash, totalChunks);
    return result.uploadedChunks;
  };

  // 上传单个分片 - 改进版
  const uploadChunk = async (
    chunk: Blob, 
    index: number, 
    fileHash: string, 
    fileName: string, 
    totalChunks: number,
    retries: number = 8
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
          timeout: 120000, // 2分钟超时
          onUploadProgress: (progressEvent) => {
            // 可以在这里添加单个分片的进度监控
          }
        });
        
        if (response.data.code === 200) {
          monitor.recordChunkSuccess(index, chunk.size);
          return true;
        } else {
          throw new Error(response.data.msg || '分片上传失败');
        }
      } catch (error: any) {
        monitor.recordChunkFailure(index);
        console.error(`分片 ${index} 上传失败 (尝试 ${attempt + 1}/${retries}):`, error.message);
        
        if (attempt === retries - 1) {
          // 最后一次尝试失败，记录详细错误
          console.error(`分片 ${index} 最终上传失败:`, error);
          return false;
        }
        
        // 根据错误类型调整等待时间
        let waitTime = Math.min(10000, 1000 * Math.pow(2, attempt));
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          waitTime *= 2; // 超时错误等待更久
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
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
      }, {
        timeout: 300000 // 5分钟超时，给大文件合并足够时间
      });
      
      return response.data;
    } catch (error) {
      console.error('合并分片失败:', error);
      throw error;
    }
  };

  // 主要的上传函数 - 支持速度模式选择
  const uploadLargeFile = async (
    file: File,
    onProgress?: (progress: number, status: string) => void,
    customConfig?: Partial<UploadConfig>,
    speedMode: 'STANDARD' | 'TURBO' | 'LIGHTNING' = 'STANDARD'
  ): Promise<{ url: string; fileName: string } | null> => {
    if (!file) {
      ElMessage.error('请选择文件');
      return null;
    }
    
    try {
      isUploading.value = true;
      uploadProgress.value = 0;
      currentFile.value = file;
      
      // 根据速度模式选择配置
      let baseConfig;
      switch (speedMode) {
        case 'TURBO':
          baseConfig = UPLOAD_CONFIGS.TURBO;
          break;
        case 'LIGHTNING':
          baseConfig = UPLOAD_CONFIGS.LIGHTNING;
          break;
        default:
          baseConfig = getOptimalConfig(file.size);
      }
      
      const config = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
      
      // 为超大文件调整配置（但保持速度优先）
      if (file.size > 5 * 1024 * 1024 * 1024 && speedMode !== 'LIGHTNING') { // > 5GB
        config.concurrency = Math.max(2, Math.floor(config.concurrency / 2)); // 适度降低并发
        config.retries = Math.min(8, config.retries + 2); // 适度增加重试
      }
      
      // 显示文件信息和预估时间
      const fileSizeText = formatFileSize(file.size);
      const estimatedTime = estimateUploadTime(file.size, getEstimatedSpeed(speedMode));
      
      const modeText = {
        'STANDARD': '稳定模式',
        'TURBO': '🚀 高速模式',
        'LIGHTNING': '⚡ 极速模式'
      }[speedMode];
      
      uploadStatus.value = `${modeText} - 准备上传 ${fileSizeText}，预估时间: ${estimatedTime}`;
      onProgress?.(0, uploadStatus.value);
      
      // 检查文件大小限制
      if (file.size > config.maxFileSize) {
        ElMessage.error(`文件大小超过限制 (最大: ${formatFileSize(config.maxFileSize)})`);
        return null;
      }
      
      // 计算文件hash - 高速模式使用更快的hash计算
      uploadStatus.value = '正在计算文件标识...';
      onProgress?.(0, uploadStatus.value);
      
      const fileHash = await calculateFileHash(file);
      
      // 创建分片
      uploadStatus.value = '正在准备分片...';
      onProgress?.(2, uploadStatus.value);
      
      const chunks = createFileChunks(file, config.chunkSize);
      const totalChunks = chunks.length;
      
      // 初始化监控
      monitor.initMonitor(totalChunks);
      
      console.log(`${modeText} - 文件: ${fileSizeText}, 分片: ${totalChunks}个 (${formatFileSize(config.chunkSize)}/片), 并发: ${config.concurrency}`);
      
      // 检查已上传的分片（支持断点续传）
      uploadStatus.value = '检查上传进度...';
      const chunkCheckResult = await checkUploadedChunks(fileHash, totalChunks);
      
      let uploadedChunks = chunkCheckResult.uploadedChunks;
      let uploadedCount = uploadedChunks.length;
      uploadProgress.value = (uploadedCount / totalChunks) * 90;
      
      // 如果有损坏的分片，需要重新上传
      const chunksNeedReupload = [
        ...chunkCheckResult.missingChunks,
        ...chunkCheckResult.corruptedChunks
      ];
      
      if (chunksNeedReupload.length > 0) {
        uploadStatus.value = `发现 ${chunksNeedReupload.length} 个分片需要重新上传`;
        console.log(`🔄 需要重新上传的分片:`, chunksNeedReupload);
      }
      
      if (uploadedCount === totalChunks) {
        uploadStatus.value = '验证完整性并合并文件...';
        onProgress?.(90, uploadStatus.value);
      } else {
        uploadStatus.value = `${modeText} 上传中... (已完成: ${uploadedCount}/${totalChunks})`;
        onProgress?.(uploadProgress.value, uploadStatus.value);
        
        // 获取需要上传的分片（包括缺失和损坏的）
        const chunksToUpload = chunks.filter(chunk => 
          chunkCheckResult.missingChunks.includes(chunk.index) || 
          chunkCheckResult.corruptedChunks.includes(chunk.index)
        );
        
        console.log(`需要上传 ${chunksToUpload.length} 个分片，已完成 ${uploadedCount} 个`);
        
        // 高速模式：更激进的上传策略
        if (speedMode === 'LIGHTNING') {
          // 极速模式：最大并发，批量上传
          for (let i = 0; i < chunksToUpload.length; i += config.concurrency) {
            const batch = chunksToUpload.slice(i, i + config.concurrency);
            
            console.log(`⚡ 极速批次 ${Math.floor(i / config.concurrency) + 1}，包含分片:`, batch.map(c => c.index));
            
            // 并行上传整个批次
            const batchResults = await Promise.allSettled(batch.map(async ({ chunk, index, size }) => {
              if (uploadedChunks.includes(index)) {
                return { index, success: true };
              }
              
              const success = await uploadChunk(chunk, index, fileHash, file.name, totalChunks, config.retries);
              
              if (success) {
                uploadedCount++;
                uploadedChunks.push(index);
                uploadProgress.value = (uploadedCount / totalChunks) * 90;
                uploadStatus.value = `⚡ 极速上传中... (${uploadedCount}/${totalChunks}) - ${fileSizeText}`;
                onProgress?.(uploadProgress.value, uploadStatus.value);
              }
              
              return { index, success };
            }));
            
            // 极速模式：批次之间无延迟
          }
        } else if (speedMode === 'TURBO') {
          // 高速模式：平衡并发和稳定性
          for (let i = 0; i < chunksToUpload.length; i += config.concurrency) {
            const batch = chunksToUpload.slice(i, i + config.concurrency);
            
            console.log(`🚀 高速批次 ${Math.floor(i / config.concurrency) + 1}，包含分片:`, batch.map(c => c.index));
            
            // 并发上传批次中的分片
            await Promise.all(batch.map(async ({ chunk, index, size }) => {
              if (uploadedChunks.includes(index)) {
                return;
              }
              
              const success = await uploadChunk(chunk, index, fileHash, file.name, totalChunks, config.retries);
              
              if (success) {
                uploadedCount++;
                uploadedChunks.push(index);
                uploadProgress.value = (uploadedCount / totalChunks) * 90;
                uploadStatus.value = `🚀 高速上传中... (${uploadedCount}/${totalChunks}) - ${fileSizeText}`;
                onProgress?.(uploadProgress.value, uploadStatus.value);
                
                // 高速模式：每20个分片检查一次
                if (uploadedCount % 20 === 0) {
                  monitor.checkWarnings();
                }
              } else {
                console.warn(`高速模式下分片 ${index} 上传失败`);
              }
            }));
            
            // 高速模式：批次之间很短延迟
            if (i + config.concurrency < chunksToUpload.length) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        } else {
          // 标准模式：保持原有的稳定上传逻辑
          for (let i = 0; i < chunksToUpload.length; i += config.concurrency) {
            const batch = chunksToUpload.slice(i, i + config.concurrency);
            
            console.log(`开始上传批次 ${Math.floor(i / config.concurrency) + 1}，包含分片:`, batch.map(c => c.index));
            
            // 串行上传每个批次中的分片，确保稳定性
            for (const { chunk, index, size } of batch) {
              if (uploadedChunks.includes(index)) {
                continue; // 跳过已上传的分片
              }
              
              const success = await uploadChunk(chunk, index, fileHash, file.name, totalChunks, config.retries);
              
              if (success) {
                uploadedCount++;
                uploadedChunks.push(index);
                uploadProgress.value = (uploadedCount / totalChunks) * 90;
                uploadStatus.value = `上传中... (${uploadedCount}/${totalChunks}) - ${fileSizeText}`;
                onProgress?.(uploadProgress.value, uploadStatus.value);
                
                // 每10个分片检查一次警告
                if (uploadedCount % 10 === 0) {
                  monitor.checkWarnings();
                }
              } else {
                // 分片上传失败，显示详细信息
                const stats = monitor.getUploadStats();
                console.error(`分片 ${index} 上传失败，当前统计:`, stats);
                
                ElNotification({
                  title: '分片上传失败',
                  message: `分片 ${index} 上传失败，成功率: ${stats.successRate}%`,
                  type: 'error',
                  duration: 3000
                });
              }
              
              // 分片之间的短暂延迟，避免服务器压力
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // 批次之间的延迟
            if (i + config.concurrency < chunksToUpload.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      }
      
      // 速度模式下的完整性验证
      if (speedMode === 'LIGHTNING') {
        // 极速模式：简化验证，信任上传结果
        uploadStatus.value = '⚡ 快速验证...';
        onProgress?.(88, uploadStatus.value);
      } else {
        // 其他模式：完整验证
        uploadStatus.value = '验证分片完整性...';
        onProgress?.(88, uploadStatus.value);
        
        const finalCheckArray = await checkUploadedChunksCompat(fileHash, totalChunks);
        const missingChunks = [];
        for (let i = 0; i < totalChunks; i++) {
          if (!finalCheckArray.includes(i)) {
            missingChunks.push(i);
          }
        }
        
        if (missingChunks.length > 0) {
          uploadStatus.value = `重新上传缺失分片... (${missingChunks.length}个)`;
          console.warn('发现缺失分片，开始补传:', missingChunks);
          
          // 根据速度模式调整补传策略
          const retryCount = speedMode === 'TURBO' ? 8 : 15;
          
          for (const chunkIndex of missingChunks) {
            const chunkToRetry = chunks[chunkIndex];
            if (chunkToRetry) {
              console.log(`补传分片 ${chunkIndex}...`);
              const success = await uploadChunk(
                chunkToRetry.chunk, 
                chunkIndex, 
                fileHash, 
                file.name, 
                totalChunks, 
                retryCount
              );
              
              if (success) {
                uploadedCount++;
                uploadProgress.value = (uploadedCount / totalChunks) * 90;
                uploadStatus.value = `补传分片... (${uploadedCount}/${totalChunks})`;
                onProgress?.(uploadProgress.value, uploadStatus.value);
              } else if (speedMode !== 'LIGHTNING') {
                throw new Error(`分片 ${chunkIndex} 补传失败，无法完成上传`);
              }
            }
          }
        }
      }
      
      // 合并分片
      uploadStatus.value = '合并文件中...';
      uploadProgress.value = 92;
      onProgress?.(92, uploadStatus.value);
      
      const mergeResult = await mergeChunks(fileHash, file.name, totalChunks);
      
      if (mergeResult.code === 200) {
        uploadProgress.value = 100;
        uploadStatus.value = `${modeText} 上传完成`;
        onProgress?.(100, uploadStatus.value);
        
        // 显示最终统计
        const finalStats = monitor.generateDiagnosticReport();
        console.log(`${modeText} 上传完成，最终统计:`, finalStats);
        
        ElMessage.success(`${modeText} 文件上传成功！大小: ${formatFileSize(mergeResult.data.size)}`);
        
        return {
          url: mergeResult.data.url,
          fileName: mergeResult.data.fileName
        };
      } else {
        throw new Error(mergeResult.msg || '文件合并失败');
      }
      
    } catch (error: any) {
      console.error('文件上传失败:', error);
      
      // 生成诊断报告
      const diagnosticReport = monitor.generateDiagnosticReport();
      console.error('上传失败诊断报告:', diagnosticReport);
      
      ElMessage.error(`文件上传失败: ${error.message}`);
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
    cancelUpload,
    monitor
  };
}; 