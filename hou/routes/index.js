var express = require('express');
var router = express.Router();
const { Banner } = require('../models/index');
const multer = require('multer');
const xlsx = require('node-xlsx');
const path = require('path');
const fs = require('fs');

// 配置multer用于文件上传
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // 使用时间戳生成唯一文件名
      const uniqueName = `import_${Date.now()}_${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    // 只允许Excel文件
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件格式'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

// Banner API接口
// 获取Banner列表
router.get('/banner/list', async (req, res) => {
  try {
    const { title, status, locationType } = req.query;
    const query = {};

    if (title) {
      query.title = new RegExp(title, 'i');
    }

    if (status) {
      query.status = status;
    }

    if (locationType) {
      query.locationType = locationType;
    }

    // 获取数据并进行混合排序：已发布的按sortOrder，其他按创建时间
    const data = await Banner.find(query);
    
    // 手动排序：已发布的按sortOrder升序，其他按创建时间倒序
    data.sort((a, b) => {
      if (a.status === '已发布' && b.status === '已发布') {
        // 两个都是已发布，按sortOrder排序
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      } else if (a.status === '已发布' && b.status !== '已发布') {
        // a是已发布，b不是，a排在前面
        return -1;
      } else if (a.status !== '已发布' && b.status === '已发布') {
        // b是已发布，a不是，b排在前面
        return 1;
      } else {
        // 两个都不是已发布，按创建时间倒序
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    res.send({ code: 200, data });
  } catch (err) {
    res.send({ code: 500, msg: '获取数据失败', error: err.message });
  }
});

// 添加Banner
router.post('/banner/add', async (req, res) => {
  try {
    console.log('收到添加Banner请求:', req.body);
    
    // 检查必填字段
    const { title, imageUrl, startTime, endTime } = req.body;
    if (!title || !imageUrl || !startTime || !endTime) {
      console.log('缺少必要参数:', { title, imageUrl, startTime, endTime });
      return res.send({ code: 400, msg: '缺少必要参数' });
    }

    // 转换时间格式
    const bannerData = {
      ...req.body,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    };
    
    console.log('处理后的Banner数据:', bannerData);
    
    const banner = new Banner(bannerData);
    await banner.save();
    console.log('Banner保存成功:', banner);
    res.send({ code: 200, msg: '添加成功', data: banner });
  } catch (err) {
    console.error('添加Banner失败:', err);
    res.send({ code: 500, msg: '添加失败', error: err.message });
  }
});

// 更新Banner
router.post('/banner/update', async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    if (!_id) {
      return res.send({ code: 400, msg: '缺少ID参数' });
    }

    const result = await Banner.findByIdAndUpdate(_id, updateData, { new: true });
    if (!result) {
      return res.send({ code: 404, msg: '未找到该Banner' });
    }
    res.send({ code: 200, msg: '更新成功', data: result });
  } catch (err) {
    res.send({ code: 500, msg: '更新失败', error: err.message });
  }
});

// 删除Banner
router.post('/banner/delete', async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.send({ code: 400, msg: '缺少ID参数' });
    }

    const result = await Banner.findByIdAndDelete(_id);
    if (!result) {
      return res.send({ code: 404, msg: '未找到该Banner' });
    }
    res.send({ code: 200, msg: '删除成功' });
  } catch (err) {
    res.send({ code: 500, msg: '删除失败', error: err.message });
  }
});

// 获取单个Banner详情
router.get('/banner/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.send({ code: 404, msg: '未找到该Banner' });
    }
    res.send({ code: 200, data: banner });
  } catch (err) {
    res.send({ code: 500, msg: '获取数据失败', error: err.message });
  }
});

// 更新Banner状态（上线/下线）
router.post('/banner/updateStatus', async (req, res) => {
  try {
    const { _id, status } = req.body;
    if (!_id || !status) {
      return res.send({ code: 400, msg: '缺少必要参数' });
    }

    const result = await Banner.findByIdAndUpdate(_id, { status }, { new: true });
    if (!result) {
      return res.send({ code: 404, msg: '未找到该Banner' });
    }
    
    let statusMsg = '';
    if (status === '已发布') {
      statusMsg = 'Banner已发布';
    } else if (status === '已下线') {
      statusMsg = 'Banner已下线';
    } else if (status === '待发布') {
      statusMsg = 'Banner已设为待发布';
    }
    
    res.send({ code: 200, msg: statusMsg, data: result });
  } catch (err) {
    res.send({ code: 500, msg: '更新失败', error: err.message });
  }
});

// 更新Banner排序
router.post('/banner/updateSort', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.send({ code: 400, msg: '缺少排序数据' });
    }

    console.log('收到排序更新请求:', items);

    // 批量更新排序
    const updatePromises = items.map(item => {
      if (!item._id || typeof item.sortOrder !== 'number') {
        throw new Error('排序数据格式错误');
      }
      return Banner.findByIdAndUpdate(item._id, { sortOrder: item.sortOrder });
    });

    await Promise.all(updatePromises);
    console.log('排序更新成功');
    
    res.send({ code: 200, msg: '排序更新成功' });
  } catch (err) {
    console.error('排序更新失败:', err);
    res.send({ code: 500, msg: '排序更新失败', error: err.message });
  }
});

// Excel导入接口
router.post('/banner/import', upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.send({ code: 400, msg: '请选择要导入的Excel文件' });
    }

    filePath = req.file.path;
    console.log('开始处理Excel文件:', filePath);

    // 解析Excel文件
    const workbook = xlsx.parse(filePath);
    const worksheet = workbook[0]; // 取第一个工作表
    
    if (!worksheet || !worksheet.data || worksheet.data.length < 2) {
      return res.send({ code: 400, msg: 'Excel文件格式不正确或无数据' });
    }

    const headers = worksheet.data[0]; // 表头
    const dataRows = worksheet.data.slice(1); // 数据行

    // 验证表头
    const requiredHeaders = ['标题', '跳转类型', '跳转地址', '开始时间', '结束时间', '位置类型'];
    const headerMap = {};
    
    requiredHeaders.forEach(header => {
      const index = headers.indexOf(header);
      if (index === -1) {
        throw new Error(`缺少必要的列：${header}`);
      }
      headerMap[header] = index;
    });

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // 处理每一行数据
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // Excel行号（从第2行开始）

      try {
        // 跳过空行
        if (!row || row.length === 0 || !row[headerMap['标题']]) {
          continue;
        }

        // 构造Banner数据
        const bannerData = {
          title: row[headerMap['标题']],
          redirectType: row[headerMap['跳转类型']] === '外部' ? '外部' : '内部',
          redirectUrl: row[headerMap['跳转地址']],
          startTime: new Date(row[headerMap['开始时间']]),
          endTime: new Date(row[headerMap['结束时间']]),
          locationType: row[headerMap['位置类型']] || '首页banner位',
          status: '待发布',
          imageUrl: '', // 导入时图片为空，需要后续上传
          sortOrder: 0
        };

        // 数据验证
        if (!bannerData.title) {
          throw new Error('标题不能为空');
        }
        if (!bannerData.redirectUrl) {
          throw new Error('跳转地址不能为空');
        }
        if (isNaN(bannerData.startTime.getTime())) {
          throw new Error('开始时间格式不正确');
        }
        if (isNaN(bannerData.endTime.getTime())) {
          throw new Error('结束时间格式不正确');
        }
        if (bannerData.startTime >= bannerData.endTime) {
          throw new Error('结束时间必须晚于开始时间');
        }

        // 保存到数据库
        const banner = new Banner(bannerData);
        await banner.save();
        successCount++;

      } catch (error) {
        failCount++;
        errors.push({
          row: rowNum,
          title: row[headerMap['标题']] || '未知',
          message: error.message
        });
        console.error(`第${rowNum}行导入失败:`, error.message);
      }
    }

    console.log(`导入完成: 成功${successCount}条，失败${failCount}条`);

    res.send({
      code: 200,
      msg: '导入完成',
      data: {
        successCount,
        failCount,
        errors: errors.slice(0, 50) // 最多返回50个错误
      }
    });

  } catch (error) {
    console.error('Excel导入失败:', error);
    res.send({
      code: 500,
      msg: `导入失败: ${error.message}`
    });
  } finally {
    // 清理临时文件
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('临时文件已清理:', filePath);
      } catch (err) {
        console.error('清理临时文件失败:', err);
      }
    }
  }
});

// Excel导出接口
router.post('/banner/export', async (req, res) => {
  try {
    const { selectedIds, filters } = req.body;
    let query = {};

    // 如果指定了特定ID，则只导出这些记录
    if (selectedIds && selectedIds.length > 0) {
      query._id = { $in: selectedIds };
    } else if (filters) {
      // 否则根据筛选条件导出
      if (filters.title) {
        query.title = new RegExp(filters.title, 'i');
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.locationType) {
        query.locationType = filters.locationType;
      }
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }
    }

    console.log('导出查询条件:', query);

    // 查询数据
    const banners = await Banner.find(query).sort({ createdAt: -1 });
    
    if (banners.length === 0) {
      return res.send({ code: 400, msg: '没有数据可导出' });
    }

    // 准备Excel数据
    const excelData = [
      // 表头
      ['序号', 'ID', '标题', '状态', '跳转类型', '跳转地址', '开始时间', '结束时间', '创建时间', '位置类型', '排序']
    ];

    // 数据行
    banners.forEach((banner, index) => {
      excelData.push([
        index + 1,
        banner._id.toString(),
        banner.title,
        banner.status,
        banner.redirectType,
        banner.redirectUrl,
        banner.startTime ? new Date(banner.startTime).toLocaleString('zh-CN') : '',
        banner.endTime ? new Date(banner.endTime).toLocaleString('zh-CN') : '',
        banner.createdAt ? new Date(banner.createdAt).toLocaleString('zh-CN') : '',
        banner.locationType,
        banner.sortOrder || 0
      ]);
    });

    // 生成Excel文件
    const buffer = xlsx.build([{
      name: '运营位数据',
      data: excelData,
      options: {
        '!cols': [
          { wch: 6 },   // 序号
          { wch: 10 },  // ID
          { wch: 20 },  // 标题
          { wch: 8 },   // 状态
          { wch: 8 },   // 跳转类型
          { wch: 30 },  // 跳转地址
          { wch: 18 },  // 开始时间
          { wch: 18 },  // 结束时间
          { wch: 18 },  // 创建时间
          { wch: 12 },  // 位置类型
          { wch: 6 }    // 排序
        ]
      }
    }]);

    // 设置响应头
    const fileName = `运营位数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', buffer.length);

    console.log(`导出成功: ${banners.length}条数据，文件: ${fileName}`);
    res.send(buffer);

  } catch (error) {
    console.error('Excel导出失败:', error);
    res.send({
      code: 500,
      msg: `导出失败: ${error.message}`
    });
  }
});

// 下载Excel模板接口
router.get('/banner/template', (req, res) => {
  try {
    // 创建模板数据
    const templateData = [
      // 表头
      ['标题', '跳转类型', '跳转地址', '开始时间', '结束时间', '位置类型'],
      // 示例数据
      ['示例活动标题', '内部', '/activity/detail/123', '2024-01-01 09:00', '2024-12-31 18:00', '首页banner位'],
      ['外部链接示例', '外部', 'https://www.example.com', '2024-02-01 10:00', '2024-02-28 20:00', '首页banner位'],
      // 空行
      [''],
      ['填写说明：'],
      ['1. 标题：必填，运营位标题'],
      ['2. 跳转类型：必填，选择"内部"或"外部"'],
      ['3. 跳转地址：必填，内部链接以"/"开头，外部链接以"http"开头'],
      ['4. 开始时间：必填，格式：YYYY-MM-DD HH:mm'],
      ['5. 结束时间：必填，格式：YYYY-MM-DD HH:mm'],
      ['6. 位置类型：必填，通常为"首页banner位"'],
      [''],
      ['注意：'],
      ['- 请不要修改表头'],
      ['- 导入后状态默认为"待发布"'],
      ['- 图片需要在导入后单独上传']
    ];

    // 生成Excel文件
    const buffer = xlsx.build([{
      name: '运营位导入模板',
      data: templateData,
      options: {
        '!cols': [
          { wch: 20 },  // 标题
          { wch: 10 },  // 跳转类型
          { wch: 30 },  // 跳转地址
          { wch: 18 },  // 开始时间
          { wch: 18 },  // 结束时间
          { wch: 15 }   // 位置类型
        ]
      }
    }]);

    // 设置响应头
    const fileName = '运营位导入模板.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', buffer.length);

    console.log('模板下载成功');
    res.send(buffer);

  } catch (error) {
    console.error('模板下载失败:', error);
    res.send({
      code: 500,
      msg: `模板下载失败: ${error.message}`
    });
  }
});

module.exports = router;