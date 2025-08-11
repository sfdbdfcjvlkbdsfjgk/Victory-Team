/**
 * 抑制已知的兼容性警告
 * 这些警告不影响功能，只是版本兼容性提示
 */
export const suppressKnownWarnings = () => {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    
    // 抑制 Ant Design React 版本兼容性警告
    if (
      message.includes('antd: compatible') ||
      message.includes('antd v5 support React') ||
      message.includes('v5-for-19')
    ) {
      return;
    }
    
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    
    // 抑制已知的非关键错误
    if (message.includes('antd: compatible')) {
      return;
    }
    
    originalError.apply(console, args);
  };
}; 