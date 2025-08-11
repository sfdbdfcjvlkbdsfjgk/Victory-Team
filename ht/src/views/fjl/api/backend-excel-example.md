# 后端Excel导入导出API接口说明

## 1. Excel导入接口

**POST** `/banner/import`

### 请求参数
- `file`: 上传的Excel文件 (multipart/form-data)

### 请求示例
```javascript
const formData = new FormData();
formData.append('file', file);
fetch('/banner/import', {
  method: 'POST',
  body: formData
})
```

### 响应格式
```json
{
  "code": 200,
  "msg": "导入成功",
  "data": {
    "successCount": 150,
    "failCount": 5,
    "errors": [
      {
        "row": 3,
        "field": "标题",
        "message": "标题不能为空"
      }
    ]
  }
}
```

### 后端处理要点
- 验证Excel文件格式
- 解析Excel数据，验证必填字段
- 批量插入数据库
- 记录成功/失败统计
- 大文件处理：建议使用流式处理
- 错误处理：记录具体错误行和错误信息

---

## 2. Excel导出接口

**POST** `/banner/export`

### 请求参数
```json
{
  "selectedIds": ["id1", "id2"],  // 可选：指定导出的ID
  "filters": {                   // 可选：筛选条件
    "title": "关键词",
    "status": "已发布",
    "locationType": "首页banner位",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

### 响应格式
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="运营位数据_2024-01-01.xlsx"`
- 直接返回Excel文件流

### 后端处理要点
- 根据参数查询数据
- 生成Excel文件（推荐使用xlsx库）
- 设置合适的响应头
- 大数据量处理：分批查询，流式输出
- 文件名包含时间戳避免缓存

---

## 3. 模板下载接口

**GET** `/banner/template`

### 响应格式
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="运营位导入模板.xlsx"`
- 返回预定义的Excel模板文件

### 模板格式
| 标题 | 跳转类型 | 跳转地址 | 开始时间 | 结束时间 | 位置类型 |
|------|----------|----------|----------|----------|----------|
| 示例活动 | 内部 | /activity/123 | 2024-01-01 09:00 | 2024-12-31 18:00 | 首页banner位 |

### 后端处理要点
- 创建标准模板文件
- 包含示例数据和说明
- 设置数据验证规则
- 可以添加下拉选项

---

## 4. 任务状态查询接口（可选）

**GET** `/banner/task/{taskId}`

用于大文件异步处理时查询进度

### 响应格式
```json
{
  "code": 200,
  "data": {
    "status": "processing", // pending, processing, completed, failed
    "progress": 65,         // 进度百分比
    "message": "正在处理第1500行...",
    "result": null          // 完成时返回结果
  }
}
```

---

## 技术实现建议

### Node.js 示例（使用 xlsx 库）

```javascript
const XLSX = require('xlsx');
const multer = require('multer');

// 导入处理
app.post('/banner/import', upload.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const results = await processBatchImport(data);
    
    res.json({
      code: 200,
      msg: '导入成功',
      data: results
    });
  } catch (error) {
    res.json({
      code: 500,
      msg: error.message
    });
  }
});

// 导出处理
app.post('/banner/export', async (req, res) => {
  try {
    const data = await queryBannerData(req.body);
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '运营位数据');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="export.xlsx"');
    res.send(buffer);
  } catch (error) {
    res.json({
      code: 500,
      msg: error.message
    });
  }
});
```

### 性能优化建议

1. **大文件处理**
   - 使用流式处理，避免内存溢出
   - 分批处理数据，每批1000-5000条
   - 使用异步处理，返回任务ID

2. **错误处理**
   - 详细记录错误行和错误原因
   - 提供部分成功的导入结果
   - 支持错误数据的重新导入

3. **文件限制**
   - 限制文件大小（建议10-50MB）
   - 限制行数（建议最大10万行）
   - 验证文件格式

4. **缓存优化**
   - 模板文件可以缓存
   - 导出结果可以短期缓存
   - 使用CDN分发静态文件 