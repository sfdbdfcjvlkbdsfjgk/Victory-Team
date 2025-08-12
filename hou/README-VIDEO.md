# 视频管理系统

## 📋 系统概述

这是一个基于Node.js + Express + MongoDB的视频管理系统，支持视频上传、存储、检索和播放功能。

## 🏗️ 系统架构

```
前端 → API接口 → 视频服务 → MongoDB数据库
                ↓
            文件存储(本地)
```

## 📁 文件结构

```
hou/
├── models/
│   └── index.js              # 数据库模型（Video表）
├── services/
│   └── videoService.js       # 视频业务逻辑
├── routes/
│   └── api/
│       ├── videos.js         # 视频API接口
│       └── upload.js         # 文件上传接口
├── public/
│   └── uploads/
│       ├── videos/           # 视频文件存储
│       └── thumbnails/       # 缩略图存储
└── app.js                    # 主应用文件
```

## 🎯 核心功能

### 1. 视频管理
- ✅ 视频上传（支持MP4、AVI、MOV、WMV格式）
- ✅ 缩略图上传（支持JPEG、PNG、GIF、WebP格式）
- ✅ 视频信息管理（标题、时长、难度等级、分类等）
- ✅ 视频搜索和筛选

### 2. 数据存储
- **视频文件**：存储在 `public/uploads/videos/` 目录
- **缩略图**：存储在 `public/uploads/thumbnails/` 目录
- **元数据**：存储在MongoDB数据库

### 3. API接口
- **获取视频列表**：支持分页和分类
- **获取热门视频**：大家都在学分类
- **获取视频教程**：视频教程分类
- **按等级获取**：K1-K4难度等级
- **搜索视频**：关键词搜索
- **视频详情**：单个视频信息
- **统计信息**：视频数量统计

## 🚀 快速开始

### 1. 启动服务器
```bash
npm start
```

### 2. 测试API接口
```bash
node test-api.js
```

### 3. 访问接口
- 服务器地址：`http://localhost:3001`
- API基础路径：`http://localhost:3001/api`

## 📡 API接口文档

### 获取视频列表
```
GET /api/videos?category=大家都在学&page=1&limit=20
```

### 获取热门视频
```
GET /api/videos/popular
```

### 获取视频教程
```
GET /api/videos/tutorials?limit=20
```

### 按等级获取视频
```
GET /api/videos/level/K1%20零基础?limit=20
```

### 搜索视频
```
GET /api/videos/search?keyword=燃脂&category=大家都在学&level=K1%20零基础
```

### 获取视频详情
```
GET /api/videos/:id
```

### 获取统计信息
```
GET /api/videos/stats
```

### 上传视频文件
```
POST /api/upload/video
Content-Type: multipart/form-data
Body: { video: File }
```

### 上传缩略图
```
POST /api/upload/thumbnail
Content-Type: multipart/form-data
Body: { thumbnail: File }
```

### 添加视频到数据库
```
POST /api/videos/add
Content-Type: application/json
Body: {
  "title": "视频标题",
  "duration": 15,
  "level": "K1 零基础",
  "category": "大家都在学",
  "videoUrl": "/uploads/videos/video_xxx.mp4",
  "thumbnailUrl": "/uploads/thumbnails/thumb_xxx.jpg",
  "description": "视频描述",
  "tags": ["燃脂", "健身"]
}
```

## 💡 前端调用示例

### 获取热门视频
```javascript
fetch('/api/videos/popular')
  .then(res => res.json())
  .then(data => {
    console.log('热门视频:', data.data);
    // 渲染到页面
  });
```

### 搜索视频
```javascript
fetch('/api/videos/search?keyword=燃脂&category=大家都在学')
  .then(res => res.json())
  .then(data => {
    console.log('搜索结果:', data.data);
  });
```

### 分页获取视频
```javascript
fetch('/api/videos?page=1&limit=20&category=视频教程')
  .then(res => res.json())
  .then(data => {
    console.log('视频列表:', data.data);
  });
```

### 上传视频
```javascript
const formData = new FormData();
formData.append('video', videoFile);

fetch('/api/upload/video', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => {
  console.log('上传成功:', data.data.videoUrl);
});
```

## 📊 数据库结构

### Video表结构
```javascript
{
  "_id": "ObjectId",
  "title": "视频标题",
  "duration": 15,                    // 时长（分钟）
  "level": "K1 零基础",              // 难度等级
  "category": "大家都在学",           // 分类
  "popularity": 1000,                // 观看人数
  "videoUrl": "/uploads/videos/xxx.mp4",    // 视频文件路径
  "thumbnail": "/uploads/thumbnails/xxx.jpg", // 缩略图路径
  "description": "视频描述",
  "tags": ["燃脂", "健身"],          // 标签数组
  "isActive": true,                  // 是否激活
  "createTime": "2024-01-15T10:30:00.000Z",
  "updateTime": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 配置说明

### 文件上传配置
- **视频文件大小限制**：100MB
- **缩略图大小限制**：5MB
- **支持格式**：
  - 视频：MP4、AVI、MOV、WMV
  - 图片：JPEG、PNG、GIF、WebP

### 数据库配置
- **数据库**：MongoDB
- **连接地址**：`mongodb+srv://yy2935140484:439952014710q@cluster0.kuvzpp4.mongodb.net/sport`

## 🎯 使用场景

1. **健身视频平台**：上传和分享健身教程
2. **在线教育**：视频课程管理
3. **内容管理**：视频内容存储和检索
4. **移动应用后端**：为移动应用提供视频API

## 📝 注意事项

1. **文件存储**：视频文件存储在本地，生产环境建议使用云存储
2. **性能优化**：大量视频时建议添加缓存机制
3. **安全考虑**：上传文件需要验证文件类型和大小
4. **扩展性**：可以根据需要添加更多分类和标签

## 🚀 后续优化

1. **云存储集成**：支持阿里云OSS、腾讯云COS等
2. **视频转码**：自动生成不同分辨率的视频
3. **CDN加速**：提升视频播放速度
4. **用户权限**：添加用户认证和权限控制
5. **视频处理**：自动生成缩略图、提取视频信息 