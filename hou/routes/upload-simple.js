const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();

// 确保目录存在
const uploadDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../temp');

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(tempDir);

// 日志函数
const logWithTimestamp = (message, data = '') => {
  const timestamp = new Date().toLocaleString('zh-CN');
  console.log(`[${timestamp}] ${message}`, data);
};

// 文件类型判断
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'unknown';
};

// 文件大小格式化
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 简化的multer配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const tempName = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, tempName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB单个分片限制
    fieldSize: 1024 * 1024        // 1MB字段限制
  }
});

// 简化的分片上传接口
router.post('/chunk', upload.single('chunk'), (req, res) => {
  logWithTimestamp('📦 收到分片上传请求');
  
  try {
    const { fileHash, chunkIndex, totalChunks, fileName } = req.body;
    
    logWithTimestamp('请求参数:', { fileHash: fileHash?.substring(0, 8) + '...', chunkIndex, totalChunks, fileName });
    
    // 基本验证
    if (!fileHash || chunkIndex === undefined || !totalChunks || !fileName) {
      logWithTimestamp('❌ 缺少必要参数');
      return res.json({ code: 400, msg: '缺少必要参数' });
    }
    
    if (!req.file) {
      logWithTimestamp('❌ 没有接收到文件');
      return res.json({ code: 400, msg: '没有接收到文件' });
    }

    const chunkIndexNum = parseInt(chunkIndex);
    const totalChunksNum = parseInt(totalChunks);
    const tempPath = req.file.path;
    const finalPath = path.join(tempDir, `${fileHash}-${chunkIndexNum}`);
    
    logWithTimestamp(`📄 处理分片 ${chunkIndexNum}/${totalChunksNum}, 临时文件: ${tempPath}`);
    
    // 同步移动文件（避免异步问题）
    try {
      if (fs.existsSync(finalPath)) {
        fs.removeSync(finalPath);
      }
      fs.moveSync(tempPath, finalPath);
      
      const stats = fs.statSync(finalPath);
      logWithTimestamp(`✅ 分片保存成功: ${formatFileSize(stats.size)}`);
      
      res.json({
        code: 200,
        msg: '分片上传成功',
        data: {
          fileHash,
          chunkIndex: chunkIndexNum,
          totalChunks: totalChunksNum,
          size: stats.size
        }
      });
      
    } catch (moveError) {
      logWithTimestamp('❌ 分片保存失败:', moveError.message);
      
      // 清理临时文件
      try {
        if (fs.existsSync(tempPath)) {
          fs.removeSync(tempPath);
        }
      } catch (cleanupError) {
        logWithTimestamp('⚠️ 清理临时文件失败:', cleanupError.message);
      }
      
      return res.json({ code: 500, msg: '分片保存失败: ' + moveError.message });
    }
    
  } catch (error) {
    logWithTimestamp('❌ 分片上传异常:', error.message);
    res.json({ code: 500, msg: '分片上传失败: ' + error.message });
  }
});

// 简化的分片检查接口
router.post('/check', (req, res) => {
  try {
    const { fileHash, totalChunks } = req.body;
    
    logWithTimestamp('🔍 检查分片状态:', { fileHash: fileHash?.substring(0, 8) + '...', totalChunks });
    
    if (!fileHash || !totalChunks) {
      return res.json({ code: 400, msg: '缺少必要参数' });
    }
    
    const uploadedChunks = [];
    const totalChunksNum = parseInt(totalChunks);
    
    for (let i = 0; i < totalChunksNum; i++) {
      const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
      if (fs.existsSync(chunkPath)) {
        const stats = fs.statSync(chunkPath);
        if (stats.size > 0) {
          uploadedChunks.push(i);
        }
      }
    }
    
    logWithTimestamp(`📊 分片检查结果: ${uploadedChunks.length}/${totalChunksNum}`);
    
    res.json({
      code: 200,
      msg: '分片检查完成',
      data: {
        uploadedChunks,
        totalChunks: totalChunksNum,
        uploadedCount: uploadedChunks.length
      }
    });
  } catch (error) {
    logWithTimestamp('❌ 检查分片失败:', error.message);
    res.json({ code: 500, msg: '检查分片失败: ' + error.message });
  }
});

// 简化的合并接口 - 修复版本
router.post('/merge', async (req, res) => {
  try {
    const { fileHash, fileName, totalChunks } = req.body;
    
    logWithTimestamp('🔗 开始合并文件:', { fileName, totalChunks });
    
    if (!fileHash || !fileName || !totalChunks) {
      return res.json({ code: 400, msg: '缺少必要参数' });
    }
    
    const totalChunksNum = parseInt(totalChunks);
    
    // 确保uploads目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.ensureDirSync(uploadDir);
      logWithTimestamp('📁 创建uploads目录:', uploadDir);
    }
    
    // 检查所有分片是否存在
    const missingChunks = [];
    for (let i = 0; i < totalChunksNum; i++) {
      const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
      if (!fs.existsSync(chunkPath)) {
        missingChunks.push(i);
      }
    }
    
    if (missingChunks.length > 0) {
      logWithTimestamp('❌ 缺少分片:', missingChunks);
      return res.json({ code: 400, msg: `缺少分片: ${missingChunks.join(', ')}` });
    }
    
    // 生成最终文件路径
    const ext = path.extname(fileName);
    const finalFileName = `${fileHash}${ext}`;
    const finalPath = path.join(uploadDir, finalFileName);
    
    logWithTimestamp('📝 合并到:', finalPath);
    
    // 使用fs.writeFile同步合并所有分片
    try {
      let mergedBuffer = Buffer.alloc(0);
      
      for (let i = 0; i < totalChunksNum; i++) {
        const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
        const chunkBuffer = fs.readFileSync(chunkPath);
        mergedBuffer = Buffer.concat([mergedBuffer, chunkBuffer]);
        logWithTimestamp(`📦 合并分片 ${i + 1}/${totalChunksNum}, 大小: ${formatFileSize(chunkBuffer.length)}`);
      }
      
      // 写入最终文件
      fs.writeFileSync(finalPath, mergedBuffer);
      logWithTimestamp(`✅ 文件写入完成: ${formatFileSize(mergedBuffer.length)}`);
      
      // 验证文件是否存在
      if (!fs.existsSync(finalPath)) {
        throw new Error('文件写入后无法找到');
      }
      
      const fileStats = fs.statSync(finalPath);
      const fileType = getFileType(fileName);
      
      logWithTimestamp(`✅ 文件合并成功: ${formatFileSize(fileStats.size)}`);
      
      // 清理临时分片（成功后才清理）
      for (let i = 0; i < totalChunksNum; i++) {
        const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
        try {
          if (fs.existsSync(chunkPath)) {
            fs.removeSync(chunkPath);
          }
        } catch (cleanupError) {
          logWithTimestamp('⚠️ 清理分片失败:', cleanupError.message);
        }
      }
      
      res.json({
        code: 200,
        msg: '文件上传成功',
        data: {
          fileName: finalFileName,
          originalName: fileName,
          url: `/uploads/${finalFileName}`,
          size: fileStats.size,
          type: fileType,
          sizeFormatted: formatFileSize(fileStats.size)
        }
      });
      
    } catch (mergeError) {
      logWithTimestamp('❌ 文件合并失败:', mergeError.message);
      
      // 清理可能存在的不完整文件
      try {
        if (fs.existsSync(finalPath)) {
          fs.removeSync(finalPath);
        }
      } catch (cleanupError) {
        logWithTimestamp('⚠️ 清理不完整文件失败:', cleanupError.message);
      }
      
      throw mergeError;
    }
    
  } catch (error) {
    logWithTimestamp('❌ 合并文件失败:', error.message);
    res.json({ code: 500, msg: '合并文件失败: ' + error.message });
  }
});

module.exports = router; 