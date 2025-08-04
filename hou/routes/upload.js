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

// 配置multer用于分片上传 - 简化版
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
    fileSize: 50 * 1024 * 1024, // 50MB限制，更稳定
    fieldSize: 10 * 1024 * 1024  // 10MB字段限制
  }
});

// 添加并发控制
const activeUploads = new Map();
const MAX_CONCURRENT_UPLOADS = 5; // 限制并发数量

// 分片上传接口 - 简化版
router.post('/chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { fileHash, chunkIndex, totalChunks, fileName } = req.body;
    
    // 验证必要参数
    if (!fileHash || chunkIndex === undefined || !totalChunks || !fileName) {
      logWithTimestamp('缺少必要参数:', { fileHash, chunkIndex, totalChunks, fileName });
      return res.json({ code: 400, msg: '缺少必要参数' });
    }
    
    if (!req.file) {
      logWithTimestamp('分片文件上传失败 - 没有接收到文件');
      return res.json({ code: 400, msg: '分片文件上传失败' });
    }

    // 重命名文件为正确的分片名称
    const tempPath = req.file.path;
    const finalPath = path.join(tempDir, `${fileHash}-${chunkIndex}`);
    
    try {
      await fs.move(tempPath, finalPath);
      logWithTimestamp(`分片保存成功: ${fileName} - ${chunkIndex}/${totalChunks}`);
    } catch (moveError) {
      logWithTimestamp(`分片保存失败:`, moveError.message);
      return res.json({ code: 500, msg: '分片保存失败' });
    }
    
    // 验证文件大小
    const stats = await fs.stat(finalPath);
    
    res.json({
      code: 200,
      msg: '分片上传成功',
      data: {
        fileHash,
        chunkIndex: parseInt(chunkIndex),
        totalChunks: parseInt(totalChunks),
        size: stats.size
      }
    });
    
  } catch (error) {
    logWithTimestamp('分片上传失败:', error.message);
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
    const chunkSizes = [];
    let totalSize = 0;
    
    logWithTimestamp(`检查分片: ${fileHash}, 总数: ${totalChunks}`);
    
    // 检查哪些分片已经上传
    for (let i = 0; i < parseInt(totalChunks); i++) {
      const chunkPath = path.join(tempDir, `${fileHash}-${i}`);
      try {
        if (await fs.pathExists(chunkPath)) {
          const stats = await fs.stat(chunkPath);
          if (stats.size > 0) { // 确保文件不为空
            uploadedChunks.push(i);
            chunkSizes.push(stats.size);
            totalSize += stats.size;
          } else {
            logWithTimestamp(`发现空分片文件: ${chunkPath}`);
            // 删除空文件
            await fs.remove(chunkPath);
          }
        }
      } catch (error) {
        logWithTimestamp(`检查分片 ${i} 失败:`, error.message);
      }
    }
    
    logWithTimestamp(`分片检查结果: 已上传 ${uploadedChunks.length}/${totalChunks}, 总大小: ${totalSize} bytes`);
    
    res.json({
      code: 200,
      data: {
        uploadedChunks,
        totalChunks: parseInt(totalChunks),
        uploadedCount: uploadedChunks.length,
        totalSize: totalSize
      }
    });
  } catch (error) {
    logWithTimestamp('检查分片失败:', error.message);
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
    
    console.log(`文件合并成功: ${finalPath}`);
    
    res.json({
      code: 200,
      msg: '文件上传成功',
      data: {
        fileName: finalFileName,
        originalName: fileName,
        url: fileUrl,
        size: (await fs.stat(finalPath)).size
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