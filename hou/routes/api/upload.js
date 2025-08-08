const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { Video } = require('../../models/index');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../public/uploads/videos');
const thumbnailDir = path.join(__dirname, '../../public/uploads/thumbnails');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
}

// 上传视频文件
router.post('/upload/video', async (req, res) => {
    try {
        if (!req.files || !req.files.video) {
            return res.status(400).json({
                code: 400,
                msg: '请选择要上传的视频文件'
            });
        }

        const videoFile = req.files.video;
        
        // 检查文件类型
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
        if (!allowedTypes.includes(videoFile.mimetype)) {
            return res.status(400).json({
                code: 400,
                msg: '只支持MP4、AVI、MOV、WMV格式的视频文件'
            });
        }

        // 检查文件大小（限制500MB）
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (videoFile.size > maxSize) {
            return res.status(400).json({
                code: 400,
                msg: '视频文件大小不能超过500MB'
            });
        }

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(videoFile.name);
        const fileName = `video_${timestamp}_${randomStr}${extension}`;
        const filePath = path.join(uploadDir, fileName);

        // 保存文件
        await videoFile.mv(filePath);

        // 返回文件信息
        const videoUrl = `/uploads/videos/${fileName}`;
        
        res.json({
            code: 200,
            msg: '视频上传成功',
            data: {
                fileName: fileName,
                originalName: videoFile.name,
                size: videoFile.size,
                videoUrl: videoUrl,
                uploadTime: new Date()
            }
        });

    } catch (error) {
        console.error('视频上传失败:', error);
        res.status(500).json({
            code: 500,
            msg: '视频上传失败',
            error: error.message
        });
    }
});

// 上传缩略图
router.post('/upload/thumbnail', async (req, res) => {
    try {
        if (!req.files || !req.files.thumbnail) {
            return res.status(400).json({
                code: 400,
                msg: '请选择要上传的缩略图'
            });
        }

        const thumbnailFile = req.files.thumbnail;
        
        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(thumbnailFile.mimetype)) {
            return res.status(400).json({
                code: 400,
                msg: '只支持JPEG、PNG、GIF、WebP格式的图片'
            });
        }

        // 检查文件大小（限制5MB）
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (thumbnailFile.size > maxSize) {
            return res.status(400).json({
                code: 400,
                msg: '缩略图大小不能超过5MB'
            });
        }

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(thumbnailFile.name);
        const fileName = `thumb_${timestamp}_${randomStr}${extension}`;
        const filePath = path.join(thumbnailDir, fileName);

        // 保存文件
        await thumbnailFile.mv(filePath);

        // 返回文件信息
        const thumbnailUrl = `/uploads/thumbnails/${fileName}`;
        
        res.json({
            code: 200,
            msg: '缩略图上传成功',
            data: {
                fileName: fileName,
                originalName: thumbnailFile.name,
                size: thumbnailFile.size,
                thumbnailUrl: thumbnailUrl,
                uploadTime: new Date()
            }
        });

    } catch (error) {
        console.error('缩略图上传失败:', error);
        res.status(500).json({
            code: 500,
            msg: '缩略图上传失败',
            error: error.message
        });
    }
});

// 添加视频到数据库
router.post('/videos/add', async (req, res) => {
    try {
        const {
            title,
            duration,
            level,
            category,
            popularity,
            videoUrl,
            thumbnailUrl,
            description,
            tags
        } = req.body;
        console.log(req.body,1232456789);

        // 验证必填字段
        if (!title || !videoUrl) {
            return res.status(400).json({
                code: 400,
                msg: '标题和视频地址是必填项'
            });
        }

        // 创建视频记录
        const video = new Video({
            title,
            duration: parseInt(duration) || 0,
            level: level || 'K1 零基础',
            category: category || '视频教程',
            popularity: parseInt(popularity) || 0,
            videoUrl,
            thumbnail: thumbnailUrl || '',
            description: description || '',
            tags: Array.isArray(tags) ? tags : [],
            isActive: true
        });

        await video.save();

        res.json({
            code: 200,
            msg: '视频添加成功',
            data: video
        });

    } catch (error) {
        console.error('添加视频失败:', error);
        res.status(500).json({
            code: 500,
            msg: '添加视频失败',
            error: error.message
        });
    }
});



module.exports = router; 