# 活动管理系统

这是一个基于Vue 3 + TypeScript + Element Plus的活动管理系统前端项目。

## 功能特性

### 1. 活动发布页面 (`/dashboard/activity/publish-event`)
- **类型选择**: 支持活动/赛事两种类型
- **标题输入**: 5-30字符限制
- **运动标签**: 支持选择现有标签或新增标签
- **富文本编辑器**: 完整的文本编辑功能，支持格式化、插入图片、表格等
- **封面图片上传**: 支持JPG、PNG、GIF格式，推荐尺寸480*270px
- **草稿保存**: 支持保存草稿功能
- **表单验证**: 完整的表单验证机制

### 2. 活动报名设置页面 (`/dashboard/activity/registration-form`)
- **报名人数限制**: 可设置最大报名人数
- **时间设置**: 报名起止时间和活动起止时间
- **费用设置**: 支持多个报名项目，可设置费用和人数限制
- **保险设置**: 可选择是否需要购买保险
- **咨询电话**: 支持座机和手机号
- **地址选择**: 省市区三级联动选择
- **表单字段**: 可自定义报名表单字段，支持必填设置
- **草稿保存**: 支持保存草稿功能

## 技术栈

- **Vue 3**: 使用Composition API
- **TypeScript**: 完整的类型支持
- **Element Plus**: UI组件库
- **Vue Router**: 路由管理
- **Vite**: 构建工具

## 项目结构

```
src/
├── api/                 # API服务
│   └── index.ts        # API接口定义
├── components/          # 公共组件
├── router/             # 路由配置
│   └── index.ts
├── views/              # 页面组件
│   ├── dcy/           # 活动管理相关页面
│   │   ├── ActivityRegistration.vue  # 活动报名设置
│   │   ├── Registration.vue          # 报名信息查看
│   │   └── ...
│   ├── wsj/           # 发布相关页面
│   │   ├── PublishEvent.vue         # 活动发布页面
│   │   └── PublishNormal.vue
│   └── ...
└── main.ts            # 应用入口
```

## API接口

### 活动相关API
- `POST /api/activity/publish` - 发布活动
- `POST /api/event/publish` - 发布赛事
- `POST /api/activity/draft` - 保存草稿
- `POST /api/upload/image` - 上传图片
- `GET /api/sport/tags` - 获取运动标签
- `POST /api/sport/tags` - 添加运动标签

### 报名相关API
- `POST /api/registration/publish` - 发布报名设置
- `POST /api/registration/draft` - 保存报名草稿
- `GET /api/region/provinces` - 获取省份列表
- `GET /api/region/cities` - 获取城市列表
- `GET /api/region/districts` - 获取区县列表

## 开发指南

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 使用说明

### 发布活动/赛事
1. 访问 `/dashboard/activity/publish-event`
2. 选择活动或赛事类型
3. 填写标题（5-30字符）
4. 选择或新增运动标签
5. 使用富文本编辑器编写内容简介
6. 上传封面图片
7. 点击"发布"或"保存草稿"

### 设置活动报名
1. 访问 `/dashboard/activity/registration-form`
2. 设置报名人数上限（可选）
3. 设置报名起止时间和活动起止时间
4. 添加报名项目/费用
5. 选择是否需要购买保险
6. 填写咨询电话（可选）
7. 选择活动地址
8. 设置报名表单字段
9. 点击"发布"或"存草稿"

## 注意事项

1. **API配置**: 确保后端API接口正确配置，可在 `src/api/index.ts` 中修改API基础URL
2. **环境变量**: 可通过 `VITE_API_BASE_URL` 环境变量配置API地址
3. **文件上传**: 图片上传功能需要后端支持，建议图片大小不超过2MB
4. **富文本编辑器**: 使用浏览器原生contenteditable实现，支持基本的文本格式化功能
5. **表单验证**: 所有必填字段都有相应的验证规则

## 扩展功能

- 支持更多文件格式上传
- 集成更强大的富文本编辑器（如Quill、TinyMCE）
- 添加图片压缩和裁剪功能
- 支持批量操作
- 添加数据统计和报表功能
