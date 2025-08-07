const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(tempDir);

// 添加详细日志函数
const logWithTimestamp = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
};

// 文件大小格式化函数
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 检测文件类型的函数
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.m4v'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'unknown';
};

// 获取文件MIME类型
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    // 图片类型
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', 
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    // 视频类型
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.m4v': 'video/x-m4v'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// 配置multer用于分片上传 - 支持大视频文件
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // 先用临时名称，后续在路由中重命名
    const tempName = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, tempName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB限制，支持大视频文件
    fieldSize: 10 * 1024 * 1024   // 10MB字段限制
  },
  fileFilter: (req, file, cb) => {
    const fileType = getFileType(file.originalname);
    if (fileType === 'image' || fileType === 'video') {
      cb(null, true);
    } else {
      cb(new Error('只支持图片和视频文件'));
    }
  }
});

// 添加并发控制
const activeUploads = new Map();
const MAX_CONCURRENT_UPLOADS = 3; // 降低并发数量，视频文件较大

// 分片上传接口 - 增强稳定性版本
router.post('/chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { fileHash, chunkIndex, totalChunks, fileName } = req.body;
    
    // 验证必要参数
    if (!fileHash || chunkIndex === undefined || !totalChunks || !fileName) {
      logWithTimestamp('❌ 缺少必要参数:', { fileHash, chunkIndex, totalChunks, fileName });
      return res.json({ code: 400, msg: '缺少必要参数' });
    }
    
    if (!req.file) {
      logWithTimestamp('❌ 分片文件上传失败 - 没有接收到文件');
      return res.json({ code: 400, msg: '分片文件上传失败' });
    }

    const chunkIndexNum = parseInt(chunkIndex);
    const totalChunksNum = parseInt(totalChunks);
    
    // 验证分片索引范围
    if (chunkIndexNum < 0 || chunkIndexNum >= totalChunksNum) {
      logWithTimestamp(`❌ 分片索引无效: ${chunkIndexNum}, 总数: ${totalChunksNum}`);
      return res.json({ code: 400, msg: '分片索引无效' });
    }

    // 重命名文件为正确的分片名称
    const tempPath = req.file.path;
    const finalPath = path.join(tempDir, `${fileHash}-${chunkIndexNum}`);
    
    // 检查分片是否已存在且完整
    try {
      if (await fs.pathExists(finalPath)) {
        const existingStats = await fs.stat(finalPath);
        const newStats = await fs.stat(tempPath);
        
        if (existingStats.size === newStats.size && existingStats.size > 0) {
          // 分片已存在且大小相同，删除临时文件
          await fs.remove(tempPath);
          logWithTimestamp(`✅ 分片已存在，跳过: ${fileName} - ${chunkIndexNum}/${totalChunksNum}`);
          
          return res.json({
            code: 200,
            msg: '分片已存在',
            data: {
              fileHash,
              chunkIndex: chunkIndexNum,
              totalChunks: totalChunksNum,
              size: existingStats.size,
              status: 'exists'
            }
          });
        } else {
          // 分片损坏，删除旧文件
          await fs.remove(finalPath);
          logWithTimestamp(`⚠️ 删除损坏分片: ${finalPath}`);
        }
      }
    } catch (checkError) {
      logWithTimestamp(`⚠️ 检查现有分片失败:`, checkError.message);
    }
    
    try {
      await fs.move(tempPath, finalPath);
      logWithTimestamp(`✅ 分片保存成功: ${fileName} - ${chunkIndexNum}/${totalChunksNum}`);
    } catch (moveError) {
      logWithTimestamp(`❌ 分片保存失败:`, moveError.message);
      
      // 尝试清理临时文件
      try {
        await fs.remove(tempPath);
      } catch (cleanupError) {
        logWithTimestamp(`⚠️ 清理临时文件失败:`, cleanupError.message);
      }
      
      return res.json({ code: 500, msg: '分片保存失败' });
    }
    
    // 验证保存的文件大小
    try {
      const stats = await fs.stat(finalPath);
      
      if (stats.size === 0) {
        await fs.remove(finalPath);
        logWithTimestamp(`❌ 分片文件为空，已删除: ${finalPath}`);
        return res.json({ code: 500, msg: '分片文件为空' });
      }
      
      // 记录上传统计
      const fileType = getFileType(fileName);
      const progressPercent = ((chunkIndexNum + 1) / totalChunksNum * 100).toFixed(1);
      
      logWithTimestamp(`📊 ${fileType} 分片上传进度: ${progressPercent}% (${chunkIndexNum + 1}/${totalChunksNum}), 大小: ${formatFileSize(stats.size)}`);
      
      res.json({
        code: 200,
        msg: '分片上传成功',
        data: {
          fileHash,
          chunkIndex: chunkIndexNum,
          totalChunks: totalChunksNum,
          size: stats.size,
          type: fileType,
          progress: progressPercent
        }
      });
      
    } catch (statError) {
      logWithTimestamp(`❌ 验证分片文件失败:`, statError.message);
      // 尝试删除可能损坏的文件
      try {
        await fs.remove(finalPath);
      } catch (removeError) {
        logWithTimestamp(`⚠️ 删除损坏分片失败:`, removeError.message);
      }
      return res.json({ code: 500, msg: '分片验证失败' });
    }
    
  } catch (error) {
    logWithTimestamp('❌ 分片上传异常:', error.message);
    res.json({ code: 500, msg: '分片上传失败', error: error.message });
  }
});

// 检查已上传的分片 - 增强版
router.post('/check', async (req, res) => {
  try {
    const { fileHash, totalChunks } = req.body;
    
    if (!fileHash || !totalChunks) {
      return res.json({ code: 400, msg: '缺少必要参数' });
    }
    
    const uploadedChunks = [];
    const missingChunks = [];
    const corruptedChunks = [];
    const chunkSizes = [];
    let totalSize = 0;
    
    logWithTimestamp(`🔍 检查分片: ${fileHash}, 总数: ${totalChunks}`);
    
    // 检查哪些分片已经上传
    for (let i = 0; i < parseInt(totalChunks); i++) {
      const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
      try {
        if (await fs.pathExists(chunkPath)) {
          const stats = await fs.stat(chunkPath);
          if (stats.size > 0) { 
            // 验证分片完整性
            try {
              const buffer = await fs.readFile(chunkPath, { flag: 'r' });
              if (buffer.length === stats.size && buffer.length > 0) {
                uploadedChunks.push(i);
                chunkSizes.push(stats.size);
                totalSize += stats.size;
              } else {
                // 分片数据不完整
                corruptedChunks.push(i);
                await fs.remove(chunkPath);
                logWithTimestamp(`🗑️ 删除损坏分片: ${chunkPath}`);
              }
            } catch (readError) {
              // 分片读取失败，可能损坏
              corruptedChunks.push(i);
              await fs.remove(chunkPath);
              logWithTimestamp(`🗑️ 删除无法读取的分片: ${chunkPath}`);
            }
          } else {
            // 空文件
            corruptedChunks.push(i);
            await fs.remove(chunkPath);
            logWithTimestamp(`🗑️ 删除空分片文件: ${chunkPath}`);
          }
        } else {
          missingChunks.push(i);
        }
      } catch (error) {
        logWithTimestamp(`❌ 检查分片 ${i} 失败:`, error.message);
        missingChunks.push(i);
      }
    }
    
    const completionRate = (uploadedChunks.length / parseInt(totalChunks) * 100).toFixed(1);
    
    logWithTimestamp(`📊 分片检查完成: 完整 ${uploadedChunks.length}/${totalChunks} (${completionRate}%), 缺失 ${missingChunks.length}, 损坏 ${corruptedChunks.length}, 总大小: ${formatFileSize(totalSize)}`);
    
    // 如果有缺失或损坏的分片，在响应中标明
    let message = '分片检查完成';
    if (missingChunks.length > 0 || corruptedChunks.length > 0) {
      message = `需要重新上传 ${missingChunks.length + corruptedChunks.length} 个分片`;
    }
    
    res.json({
      code: 200,
      msg: message,
      data: {
        uploadedChunks: uploadedChunks.sort((a, b) => a - b), // 排序确保顺序
        missingChunks: missingChunks.sort((a, b) => a - b),
        corruptedChunks: corruptedChunks.sort((a, b) => a - b),
        totalChunks: parseInt(totalChunks),
        uploadedCount: uploadedChunks.length,
        missingCount: missingChunks.length,
        corruptedCount: corruptedChunks.length,
        totalSize: totalSize,
        completionRate: parseFloat(completionRate),
        needsRetry: missingChunks.length > 0 || corruptedChunks.length > 0
      }
    });
  } catch (error) {
    logWithTimestamp('❌ 检查分片失败:', error.message);
    res.json({ code: 500, msg: '检查分片失败', error: error.message });
  }
});

// 合并分片接口
router.post('/merge', async (req, res) => {
  try {
    const { fileHash, fileName, totalChunks } = req.body;
    
    console.log(`开始合并文件: ${fileName}, 总分片数: ${totalChunks}`);
    
    // 检查所有分片是否都已上传
    const missingChunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
      if (!(await fs.pathExists(chunkPath))) {
        missingChunks.push(i);
      }
    }
    
    if (missingChunks.length > 0) {
      return res.json({
        code: 400,
        msg: `缺少分片: ${missingChunks.join(', ')}`
      });
    }
    
    // 生成最终文件路径
    const ext = path.extname(fileName);
    const finalFileName = `${fileHash}${ext}`;
    const finalPath = path.join(uploadDir, finalFileName);
    
    // 合并分片
    const writeStream = fs.createWriteStream(finalPath);
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
      const chunkBuffer = await fs.readFile(chunkPath);
      writeStream.write(chunkBuffer);
    }
    
    writeStream.end();
    
    // 等待写入完成
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // 清理临时分片文件
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
      await fs.remove(chunkPath);
    }
    
    // 返回文件URL
    const fileUrl = `/uploads/${finalFileName}`;
    const fileStats = await fs.stat(finalPath);
    const fileType = getFileType(fileName);
    const mimeType = getMimeType(fileName);
    
    console.log(`${fileType === 'video' ? '视频' : '文件'}合并成功: ${finalPath}, 大小: ${fileStats.size} bytes`);
    
    res.json({
      code: 200,
      msg: `${fileType === 'video' ? '视频' : '文件'}上传成功`,
      data: {
        fileName: finalFileName,
        originalName: fileName,
        url: fileUrl,
        size: fileStats.size,
        type: fileType,
        mimeType: mimeType,
        sizeFormatted: formatFileSize(fileStats.size)
      }
    });
    
  } catch (error) {
    console.error('合并文件失败:', error);
    res.json({ code: 500, msg: '合并文件失败', error: error.message });
  }
});

// 删除文件接口
router.post('/delete', async (req, res) => {
  try {
    const { fileName } = req.body;
    const filePath = path.join(uploadDir, fileName);
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      res.json({ code: 200, msg: '文件删除成功' });
    } else {
      res.json({ code: 404, msg: '文件不存在' });
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    res.json({ code: 500, msg: '删除文件失败', error: error.message });
  }
});

module.exports = router; 