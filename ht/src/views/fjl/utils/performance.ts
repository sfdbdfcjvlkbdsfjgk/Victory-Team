// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 性能监控类
export class PerformanceMonitor {
  private startTimes: Map<string, number> = new Map();
  private logs: Array<{ operation: string; duration: number; timestamp: number }> = [];

  start(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  log(operation: string): void {
    const startTime = this.startTimes.get(operation);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      const logEntry = {
        operation,
        duration,
        timestamp: Date.now()
      };
      
      this.logs.push(logEntry);
      this.startTimes.delete(operation);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);
      }
    }
  }

  getLogs(): Array<{ operation: string; duration: number; timestamp: number }> {
    return [...this.logs];
  }

  clear(): void {
    this.startTimes.clear();
    this.logs.length = 0;
  }

  getAverageDuration(operation: string): number {
    const operationLogs = this.logs.filter(log => log.operation === operation);
    if (operationLogs.length === 0) return 0;
    
    const totalDuration = operationLogs.reduce((sum, log) => sum + log.duration, 0);
    return totalDuration / operationLogs.length;
  }
}

// 渲染时间追踪
export function trackRenderTime(componentName: string) {
  let beforeMountTime: number = 0;
  let mountedTime: number = 0;

  return {
    beforeMount(): void {
      beforeMountTime = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${componentName} 开始挂载`);
      }
    },

    mounted(): void {
      mountedTime = performance.now();
      const duration = mountedTime - beforeMountTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${componentName} 挂载完成，耗时: ${duration.toFixed(2)}ms`);
      }
    },

    getDuration(): number {
      return mountedTime - beforeMountTime;
    }
  };
}

// 获取内存使用情况
export function getMemoryUsage(): string {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100;
    const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100;
    
    return `内存使用: ${used}MB / ${total}MB (限制: ${limit}MB)`;
  } else {
    return '内存信息不可用';
  }
}

// 额外的性能工具函数

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 异步函数性能测量
export async function measureAsync<T>(
  operation: string,
  asyncFunc: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await asyncFunc();
    const duration = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ 异步操作 ${operation}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ 异步操作 ${operation} 失败: ${duration.toFixed(2)}ms`);
    }
    
    throw error;
  }
}

// FPS 监控
export function createFPSMonitor() {
  let fps = 0;
  let lastTime = performance.now();
  let frames = 0;
  
  function calculateFPS() {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      fps = Math.round((frames * 1000) / (currentTime - lastTime));
      frames = 0;
      lastTime = currentTime;
      
      if (process.env.NODE_ENV === 'development' && fps < 55) {
        console.warn(`⚠️ FPS较低: ${fps}`);
      }
    }
    
    requestAnimationFrame(calculateFPS);
  }
  
  requestAnimationFrame(calculateFPS);
  
  return {
    getFPS: () => fps
  };
} 