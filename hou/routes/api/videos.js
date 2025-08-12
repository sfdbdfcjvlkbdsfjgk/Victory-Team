const express = require('express');
const router = express.Router();
const { Video } = require('../../models/index');
const fs = require('fs');
const path = require('path');

// 1. 获取所有的列表
router.get('/videos/list', async (req, res) => {
    // 禁用缓存
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    const videos = await Video.find();
    console.log('数据库中的视频:', videos.length, '个');
    console.log('视频数据:', videos);
    
    res.json({
        code: 200,
        msg: '获取视频列表成功',
        data: videos
    });
});

// 2. 视频播放路由 - 直接提供文件流
router.get('/videos/play/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const videoPath = path.join(__dirname, '../../public/uploads/videos', fileName);
        
        console.log('🎬 请求播放视频:', fileName);
        console.log('📁 视频路径:', videoPath);
        
        // 检查文件是否存在
        if (!fs.existsSync(videoPath)) {
            console.log('❌ 视频文件不存在:', videoPath);
            return res.status(404).json({
                code: 404,
                msg: '视频文件不存在',
                data: { fileName, videoPath }
            });
        }
        
        // 获取文件信息
        const stats = fs.statSync(videoPath);
        console.log('📊 视频文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
        
        // 设置响应头
        res.set({
            'Content-Type': 'video/mp4',
            'Content-Length': stats.size,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD',
            'Access-Control-Allow-Headers': 'Range'
        });
        
        // 支持范围请求
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;
            
            res.status(206);
            res.set({
                'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize
            });
            
            const stream = fs.createReadStream(videoPath, { start, end });
            stream.pipe(res);
        } else {
            const stream = fs.createReadStream(videoPath);
            stream.pipe(res);
        }
        
    } catch (error) {
        console.error('❌ 视频播放失败:', error);
        res.status(500).json({
            code: 500,
            msg: '视频播放失败',
            error: error.message
        });
    }
});

// 3. 直接提供视频文件流
router.get('/videos/stream/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const videoPath = path.join(__dirname, '../../public/uploads/videos', fileName);
        
        console.log('🎬 流式播放视频:', fileName);
        
        // 检查文件是否存在
        if (!fs.existsSync(videoPath)) {
            console.log('❌ 视频文件不存在:', videoPath);
            return res.status(404).json({
                code: 404,
                msg: '视频文件不存在'
            });
        }
        
        // 获取文件信息
        const stats = fs.statSync(videoPath);
        
        // 设置响应头
        res.set({
            'Content-Type': 'video/mp4',
            'Content-Length': stats.size,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600'
        });
        
        // 支持范围请求
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;
            
            res.status(206);
            res.set({
                'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize
            });
            
            const stream = fs.createReadStream(videoPath, { start, end });
            stream.pipe(res);
        } else {
            const stream = fs.createReadStream(videoPath);
            stream.pipe(res);
        }
        
    } catch (error) {
        console.error('❌ 视频流播放失败:', error);
        res.status(500).json({
            code: 500,
            msg: '视频流播放失败',
            error: error.message
        });
    }
});

// 4. 获取视频信息
router.get('/videos/info/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const videoPath = path.join(__dirname, '../../public/uploads/videos', fileName);
        
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                code: 404,
                msg: '视频文件不存在'
            });
        }
        
        const stats = fs.statSync(videoPath);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        res.json({
            code: 200,
            msg: '获取视频信息成功',
            data: {
                fileName,
                fileSize: stats.size,
                fileSizeMB: (stats.size / 1024 / 1024).toFixed(2),
                createTime: stats.birthtime,
                modifyTime: stats.mtime,
                videoUrl: `${baseUrl}/api/videos/play/${fileName}`,
                staticUrl: `${baseUrl}/uploads/videos/${fileName}`
            }
        });
        
    } catch (error) {
        console.error('获取视频信息失败:', error);
        res.status(500).json({
            code: 500,
            msg: '获取视频信息失败',
            error: error.message
        });
    }
});

// 5. 检查视频文件状态
router.get('/videos/check/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const videoPath = path.join(__dirname, '../../public/uploads/videos', fileName);
        const staticPath = `/uploads/videos/${fileName}`;
        
        const fileExists = fs.existsSync(videoPath);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        if (fileExists) {
            const stats = fs.statSync(videoPath);
            res.json({
                code: 200,
                msg: '视频文件存在',
                data: {
                    fileName,
                    exists: true,
                    fileSize: stats.size,
                    fileSizeMB: (stats.size / 1024 / 1024).toFixed(2),
                    videoUrl: `${baseUrl}/api/videos/play/${fileName}`,
                    staticUrl: `${baseUrl}${staticPath}`,
                    createTime: stats.birthtime
                }
            });
        } else {
            res.json({
                code: 200,
                msg: '视频文件不存在',
                data: {
                    fileName,
                    exists: false,
                    videoPath,
                    staticPath
                }
            });
        }
        
    } catch (error) {
        console.error('检查视频文件失败:', error);
        res.status(500).json({
            code: 500,
            msg: '检查视频文件失败',
            error: error.message
        });
    }
});

module.exports = router; 