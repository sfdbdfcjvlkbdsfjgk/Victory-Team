const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { Video } = require('../../models/index');

// 确保临时目录存在
const tempDir = path.join(__dirname, '../../public/uploads/temp');
const uploadDir = path.join(__dirname, '../../public/uploads/videos');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 分片上传接口 - 支持二进制数据
router.post('/upload/chunk', async (req, res) => {
    try {
        const { 
            chunkIndex, 
            totalChunks, 
            fileName, 
            fileId,
            fileSize,
            fileHash
        } = req.body;

        // 从express-fileupload中获取二进制数据
        const chunk = req.files?.chunk;

        console.log('接收到的参数:', {
            hasChunk: !!chunk,
            chunkIndex,
            totalChunks,
            fileName,
            fileId,
            chunkLength: chunk ? chunk.length : 0,
            chunkType: typeof chunk,
            isBuffer: Buffer.isBuffer(chunk),
            isFile: chunk && chunk.data ? 'File object' : 'Not file object'
        });
        
        if (!chunk || chunkIndex === undefined || !totalChunks || !fileName || !fileId) {
            return res.status(400).json({
                code: 400,
                msg: '缺少必要参数'
            });
        }

        // 创建临时目录
        const tempFileDir = path.join(tempDir, fileId);
        if (!fs.existsSync(tempFileDir)) {
            fs.mkdirSync(tempFileDir, { recursive: true });
        }

        // 处理二进制数据
        let chunkBuffer;
        if (chunk && chunk.data) {
            // express-fileupload上传的文件对象
            chunkBuffer = chunk.data;
        } else if (Buffer.isBuffer(chunk)) {
            // 如果已经是Buffer
            chunkBuffer = chunk;
        } else if (typeof chunk === 'string') {
            // 如果是base64字符串（兼容旧版本）
            chunkBuffer = Buffer.from(chunk, 'base64');
        } else {
            return res.status(400).json({
                code: 400,
                msg: '无效的分片数据格式'
            });
        }

        // 保存分片 - 直接保存二进制数据
        const chunkPath = path.join(tempFileDir, `chunk_${chunkIndex}`);
        fs.writeFileSync(chunkPath, chunkBuffer);

        // 检查是否所有分片都上传完成
        const uploadedChunks = fs.readdirSync(tempFileDir).length;
        const totalChunksNum = parseInt(totalChunks);
        
        console.log('分片上传状态:', {
            chunkIndex,
            totalChunks,
            totalChunksNum,
            uploadedChunks,
            isComplete: uploadedChunks === totalChunksNum
        });
        
        if (uploadedChunks === totalChunksNum) {
            console.log('🎉 所有分片上传完成，开始合并文件...');
            
            try {
                // 1. 分片合并后:正确保存文件到磁盘
                const finalPath = path.join(uploadDir, fileName);
                console.log('最终文件路径:', finalPath);
                
                // 二进制数据合并逻辑
                const writeStream = fs.createWriteStream(finalPath);
                let isFirstChunk = true;
                
                for (let i = 0; i < totalChunksNum; i++) {
                    const chunkPath = path.join(tempFileDir, `chunk_${i}`);
                    console.log(`读取分片 ${i}:`, chunkPath);
                    
                    // 直接读取二进制数据
                    const chunkBuffer = fs.readFileSync(chunkPath);
                    console.log(`分片 ${i} 二进制长度:`, chunkBuffer.length);
                    
                    // 如果是第一个分片，查找并跳过到ftyp位置
                    if (isFirstChunk) {
                        const ftypIndex = chunkBuffer.indexOf(Buffer.from('ftyp'));
                        if (ftypIndex !== -1) {
                            console.log(`找到ftyp位置: ${ftypIndex}，跳过前${ftypIndex}个字节`);
                            writeStream.write(chunkBuffer.slice(ftypIndex - 4)); // 包含ftyp前的4字节长度
                            isFirstChunk = false;
                        } else {
                            // 如果没找到ftyp，检查是否有00 00 00 20开头
                            if (chunkBuffer.length >= 4 && chunkBuffer[0] === 0x00 && chunkBuffer[1] === 0x00 && chunkBuffer[2] === 0x00 && chunkBuffer[3] === 0x20) {
                                console.log('检测到00 00 00 20开头，跳过前4个字节');
                                writeStream.write(chunkBuffer.slice(4));
                                isFirstChunk = false;
                            } else {
                                console.log('未找到ftyp，写入完整分片');
                                writeStream.write(chunkBuffer);
                                isFirstChunk = false;
                            }
                        }
                    } else {
                        writeStream.write(chunkBuffer);
                    }
                }
                
                writeStream.end();
                
                // 等待写入完成
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });
                console.log('✅ 文件写入完成');
                
                console.log('✅ 文件合并完成');

                // 清理临时文件
                fs.rmSync(tempFileDir, { recursive: true, force: true });
                console.log('✅ 临时文件清理完成');

                // 确保文件保存成功
                if (!fs.existsSync(finalPath)) {
                    throw new Error('文件合并失败，最终文件未生成');
                }
                console.log('✅ 最终文件确认存在');

                const finalFileSize = fs.statSync(finalPath).size;

                // 获取表单数据（只在最后一个分片时处理）
                const { 
                    title, 
                    category, 
                    description, 
                    popularity = 0,
                    thumbnail = '',
                    isActive = true
                } = req.body;

                // 2. 数据库记录:正确保存 videoUrl 字段
                console.log('💾 开始保存到数据库...');
                
                // 构建完整的URL - 使用静态文件路径
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                const fullVideoUrl = `${baseUrl}/uploads/videos/${fileName}`;
                
                console.log('调试信息:', {
                    protocol: req.protocol,
                    host: req.get('host'),
                    baseUrl: baseUrl,
                    fileName: fileName,
                    fullVideoUrl: fullVideoUrl
                });
                
                // 在分片合并完成后,确保正确保存到数据库
                const video = new Video({
                    fileId: fileId,
                    fileName: fileName,
                    videoUrl: fullVideoUrl, // 保存完整URL到数据库
                    title: title || fileName.replace(/\.[^/.]+$/, ""),
                    category: category || '视频教程',
                    popularity: popularity,
                    thumbnail: thumbnail,
                    description: description || `上传的视频文件：${fileName}`,
                    isActive: isActive,
                    createTime: new Date(),
                    updateTime: new Date()
                });
                
                console.log('💾 保存视频数据到数据库...');
                await video.save();
                console.log('✅ 数据库保存成功');
                
                const responseData = {
                    code: 200,
                    msg: '视频上传并保存成功',
                    data: {
                        fileName,
                        videoUrl: fullVideoUrl, // 返回完整URL
                        fileSize: finalFileSize,
                        fileHash,
                        videoId: video._id,
                        fileId: fileId
                    }
                };

                console.log('📤 返回给前端的数据:', JSON.stringify(responseData, null, 2));
                res.json(responseData);

            } catch (error) {
                console.error('❌ 文件合并或数据库保存失败:', error);
                res.status(500).json({
                    code: 500,
                    msg: '文件上传失败',
                    error: error.message
                });
            }
        } else {
            res.json({
                code: 200,
                msg: `分片 ${chunkIndex + 1}/${totalChunks} 上传成功`,
                data: {
                    uploadedChunks,
                    totalChunks,
                    progress: Math.round((uploadedChunks / totalChunks) * 100),
                    fileId
                }
            });
        }

    } catch (error) {
        console.error('分片上传失败:', error);
        res.status(500).json({
            code: 500,
            msg: '分片上传失败',
            error: error.message
        });
    }
});

// 检查文件是否已存在
router.get('/upload/check/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(uploadDir, fileName);
        
        if (fs.existsSync(filePath)) {
            // 构建完整URL
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const fullVideoUrl = `${baseUrl}/uploads/videos/${fileName}`;
            
            res.json({
                code: 200,
                msg: '文件已存在',
                data: {
                    exists: true,
                    fileName,
                    videoUrl: fullVideoUrl
                }
            });
        } else {
            res.json({
                code: 200,
                msg: '文件不存在',
                data: {
                    exists: false
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            code: 500,
            msg: '检查文件失败',
            error: error.message
        });
    }
});

// 检查分片上传状态（断点续传）
router.get('/upload/chunk/status/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const tempFileDir = path.join(tempDir, fileId);
        
        if (fs.existsSync(tempFileDir)) {
            // 上传进行中
            const uploadedChunks = fs.readdirSync(tempFileDir)
                .filter(file => file.startsWith('chunk_'))
                .map(file => parseInt(file.replace('chunk_', '')))
                .sort((a, b) => a - b);
            
            res.json({
                code: 200,
                msg: '上传中',
                data: {
                    fileId: fileId,
                    uploadedChunks: uploadedChunks,
                    totalUploaded: uploadedChunks.length,
                    progress: uploadedChunks.length > 0 ? Math.round((uploadedChunks.length / (uploadedChunks[uploadedChunks.length - 1] + 1)) * 100) : 0
                }
            });
        } else {
            // 临时目录不存在，检查是否已完成并保存到数据库
            const video = await Video.findOne({ fileId: fileId });
            
            if (video) {
                // 文件已上传完成并保存到数据库，返回图片中的"上传完成"格式
                res.json({
                    code: 200,
                    msg: '上传完成',
                    data: {
                        url: video.videoUrl, // 数据库中已经是完整URL
                        uploadedChunks: [0, 1, 2, 3, 4, 5]
                    }
                });
            } else {
                // 文件既不在临时目录，也不在数据库中
                res.json({
                    code: 200,
                    msg: '文件不存在',
                    data: {
                        fileId,
                        uploadedChunks: [],
                        totalUploaded: 0,
                        progress: 0
                    }
                });
            }
        }
    } catch (error) {
        console.error('获取分片上传状态失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取分片上传状态失败',
            error: error.message
        });
    }
});

// 获取所有正在上传的文件状态
router.get('/upload/status/all', async (req, res) => {
    try {
        const uploadStatus = [];
        
        // 检查temp目录中的所有fileId
        if (fs.existsSync(tempDir)) {
            const fileIds = fs.readdirSync(tempDir);
            
            for (const fileId of fileIds) {
                const tempFileDir = path.join(tempDir, fileId);
                const stats = fs.statSync(tempFileDir);
                
                if (stats.isDirectory()) {
                    const uploadedChunks = fs.readdirSync(tempFileDir)
                        .filter(file => file.startsWith('chunk_'))
                        .map(file => parseInt(file.replace('chunk_', '')))
                        .sort((a, b) => a - b);
                    
                    uploadStatus.push({
                        fileId: fileId,
                        status: 'uploading',
                        uploadedChunks: uploadedChunks,
                        totalUploaded: uploadedChunks.length,
                        progress: uploadedChunks.length > 0 ? Math.round((uploadedChunks.length / (uploadedChunks[uploadedChunks.length - 1] + 1)) * 100) : 0,
                        createTime: stats.birthtime
                    });
                }
            }
        }
        
        res.json({
            code: 200,
            msg: '获取上传状态成功',
            data: {
                uploadingFiles: uploadStatus,
                totalUploading: uploadStatus.length
            }
        });
        
    } catch (error) {
        console.error('获取所有上传状态失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取上传状态失败',
            error: error.message
        });
    }
});

module.exports = router; 