import { ref, reactive } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';

export interface UploadMetrics {
  totalChunks: number;
  uploadedChunks: number;
  failedChunks: number[];
  retryAttempts: number;
  averageSpeed: number; // KB/s
  estimatedTimeRemaining: number; // seconds
}

export const useUploadMonitor = () => {
  const metrics = reactive<UploadMetrics>({
    totalChunks: 0,
    uploadedChunks: 0,
    failedChunks: [],
    retryAttempts: 0,
    averageSpeed: 0,
    estimatedTimeRemaining: 0
  });

  const uploadStartTime = ref<number>(0);
  const uploadedBytes = ref<number>(0);

  // 初始化监控
  const initMonitor = (totalChunks: number) => {
    metrics.totalChunks = totalChunks;
    metrics.uploadedChunks = 0;
    metrics.failedChunks = [];
    metrics.retryAttempts = 0;
    uploadStartTime.value = Date.now();
    uploadedBytes.value = 0;
  };

  // 记录分片上传成功
  const recordChunkSuccess = (chunkIndex: number, chunkSize: number) => {
    metrics.uploadedChunks++;
    uploadedBytes.value += chunkSize;
    
    // 从失败列表中移除（如果存在）
    const failedIndex = metrics.failedChunks.indexOf(chunkIndex);
    if (failedIndex > -1) {
      metrics.failedChunks.splice(failedIndex, 1);
    }
    
    updateSpeed();
  };

  // 记录分片上传失败
  const recordChunkFailure = (chunkIndex: number) => {
    if (!metrics.failedChunks.includes(chunkIndex)) {
      metrics.failedChunks.push(chunkIndex);
    }
    metrics.retryAttempts++;
  };

  // 更新上传速度
  const updateSpeed = () => {
    const elapsedTime = (Date.now() - uploadStartTime.value) / 1000; // seconds
    if (elapsedTime > 0) {
      metrics.averageSpeed = (uploadedBytes.value / 1024) / elapsedTime; // KB/s
      
      const remainingBytes = (metrics.totalChunks - metrics.uploadedChunks) * (uploadedBytes.value / metrics.uploadedChunks);
      metrics.estimatedTimeRemaining = remainingBytes / (metrics.averageSpeed * 1024);
    }
  };

  // 获取上传统计信息
  const getUploadStats = () => {
    const successRate = metrics.totalChunks > 0 ? (metrics.uploadedChunks / metrics.totalChunks) * 100 : 0;
    const failureRate = metrics.totalChunks > 0 ? (metrics.failedChunks.length / metrics.totalChunks) * 100 : 0;
    
    return {
      successRate: successRate.toFixed(1),
      failureRate: failureRate.toFixed(1),
      speed: metrics.averageSpeed.toFixed(1),
      eta: formatTime(metrics.estimatedTimeRemaining)
    };
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}秒`;
    } else if (seconds < 3600) {
      return `${Math.ceil(seconds / 60)}分钟`;
    } else {
      return `${Math.ceil(seconds / 3600)}小时`;
    }
  };

  // 检查是否需要显示警告
  const checkWarnings = () => {
    const stats = getUploadStats();
    
    // 失败率过高警告
    if (parseFloat(stats.failureRate) > 20 && metrics.uploadedChunks > 10) {
      ElNotification({
        title: '上传警告',
        message: `分片失败率较高 (${stats.failureRate}%)，建议检查网络连接`,
        type: 'warning',
        duration: 5000
      });
    }
    
    // 速度过慢警告
    if (metrics.averageSpeed < 50 && metrics.uploadedChunks > 5) { // 小于50KB/s
      ElNotification({
        title: '速度提示',
        message: `上传速度较慢 (${stats.speed}KB/s)，建议等待网络环境改善`,
        type: 'info',
        duration: 5000
      });
    }
  };

  // 生成详细的诊断报告
  const generateDiagnosticReport = () => {
    const stats = getUploadStats();
    const elapsedTime = (Date.now() - uploadStartTime.value) / 1000;
    
    return {
      upload: {
        totalChunks: metrics.totalChunks,
        uploadedChunks: metrics.uploadedChunks,
        failedChunks: metrics.failedChunks.length,
        successRate: stats.successRate + '%',
        retryAttempts: metrics.retryAttempts
      },
      performance: {
        averageSpeed: stats.speed + ' KB/s',
        elapsedTime: formatTime(elapsedTime),
        estimatedTimeRemaining: stats.eta,
        uploadedData: (uploadedBytes.value / 1024 / 1024).toFixed(2) + ' MB'
      },
      issues: {
        failedChunksList: metrics.failedChunks.slice(0, 10), // 只显示前10个失败的分片
        hasHighFailureRate: parseFloat(stats.failureRate) > 15,
        hasSlowSpeed: metrics.averageSpeed < 100
      }
    };
  };

  return {
    metrics,
    initMonitor,
    recordChunkSuccess,
    recordChunkFailure,
    updateSpeed,
    getUploadStats,
    checkWarnings,
    generateDiagnosticReport
  };
}; 