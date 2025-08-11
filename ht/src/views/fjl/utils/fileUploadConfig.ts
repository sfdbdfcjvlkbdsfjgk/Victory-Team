// 大文件上传配置
export interface UploadConfig {
  maxFileSize: number;      // 最大文件大小（字节）
  chunkSize: number;        // 分片大小（字节）
  maxChunkSize: number;     // 后端最大分片限制（字节）
  concurrency: number;      // 并发上传数量
  retries: number;          // 重试次数
  timeout: number;          // 超时时间（毫秒）
}

// 预设配置方案
export const UPLOAD_CONFIGS = {
  // 标准配置：10GB - 优化稳定性
  STANDARD: {
    maxFileSize: 10 * 1024 * 1024 * 1024,    // 10GB
    chunkSize: 5 * 1024 * 1024,              // 5MB（更小分片，更稳定）
    maxChunkSize: 100 * 1024 * 1024,         // 100MB
    concurrency: 2,                          // 降低并发数，提高稳定性
    retries: 5,                              // 增加重试次数
    timeout: 60000                           // 60秒超时
  } as UploadConfig,

  // 高速配置：10GB - 优化速度
  TURBO: {
    maxFileSize: 10 * 1024 * 1024 * 1024,    // 10GB
    chunkSize: 20 * 1024 * 1024,             // 20MB（大分片，减少请求数）
    maxChunkSize: 200 * 1024 * 1024,         // 200MB
    concurrency: 6,                          // 高并发，快速上传
    retries: 3,                              // 适度重试
    timeout: 45000                           // 45秒超时
  } as UploadConfig,

  // 极速配置：10GB - 最大化速度
  LIGHTNING: {
    maxFileSize: 10 * 1024 * 1024 * 1024,    // 10GB
    chunkSize: 50 * 1024 * 1024,             // 50MB（超大分片）
    maxChunkSize: 500 * 1024 * 1024,         // 500MB
    concurrency: 10,                         // 超高并发
    retries: 2,                              // 最少重试，追求速度
    timeout: 30000                           // 30秒超时
  } as UploadConfig,

  // 大容量配置：100GB
  LARGE: {
    maxFileSize: 100 * 1024 * 1024 * 1024,   // 100GB
    chunkSize: 50 * 1024 * 1024,             // 50MB
    maxChunkSize: 200 * 1024 * 1024,         // 200MB
    concurrency: 5,
    retries: 5,
    timeout: 60000
  } as UploadConfig,

  // 超大容量配置：1TB
  ENTERPRISE: {
    maxFileSize: 1024 * 1024 * 1024 * 1024,  // 1TB
    chunkSize: 100 * 1024 * 1024,            // 100MB
    maxChunkSize: 500 * 1024 * 1024,         // 500MB
    concurrency: 8,
    retries: 10,
    timeout: 120000
  } as UploadConfig,

  // 自定义配置：无限制（受硬件限制）
  UNLIMITED: {
    maxFileSize: Number.MAX_SAFE_INTEGER,    // 理论无限制
    chunkSize: 200 * 1024 * 1024,            // 200MB
    maxChunkSize: 1024 * 1024 * 1024,        // 1GB
    concurrency: 10,
    retries: 15,
    timeout: 300000
  } as UploadConfig
};

// 根据文件大小自动选择最佳配置
export const getOptimalConfig = (fileSize: number): UploadConfig => {
  if (fileSize <= 10 * 1024 * 1024 * 1024) {      // <= 10GB
    return UPLOAD_CONFIGS.STANDARD;
  } else if (fileSize <= 100 * 1024 * 1024 * 1024) { // <= 100GB
    return UPLOAD_CONFIGS.LARGE;
  } else if (fileSize <= 1024 * 1024 * 1024 * 1024) { // <= 1TB
    return UPLOAD_CONFIGS.ENTERPRISE;
  } else {
    return UPLOAD_CONFIGS.UNLIMITED;
  }
};

// 格式化文件大小显示
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// 估算上传时间（基于网络速度）
export const estimateUploadTime = (
  fileSize: number, 
  networkSpeedMbps: number = 10 // 默认10Mbps
): string => {
  const sizeInMb = fileSize / (1024 * 1024);
  const timeInMinutes = sizeInMb / (networkSpeedMbps / 8) / 60; // 转换为分钟
  
  if (timeInMinutes < 60) {
    return `约 ${Math.ceil(timeInMinutes)} 分钟`;
  } else if (timeInMinutes < 1440) { // < 24小时
    return `约 ${Math.ceil(timeInMinutes / 60)} 小时`;
  } else {
    return `约 ${Math.ceil(timeInMinutes / 1440)} 天`;
  }
}; 