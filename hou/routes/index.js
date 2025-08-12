var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { ActivityPost,Association,UserAssociation,activityEvent,teamForm,individualForm,familyForm } = require('../models/index');
// const {User,GoodsList,Category}=require('../models/index');
router.post('/login',async (req,res)=>{
  const {username,password}=req.body;
  const user=await User.findOne({username,password});
  if(!user){
    res.send({code:400,msg:'用户名或密码错误'})
    return;
  }
  res.send({code:200,msg:'登录成功',data:user})
})
router.get('/activitypost', async (req, res) => {
    const data =await ActivityPost.find()
    res.send({
        code: 200,
        data: data,
        message: '获取成功',
    })
})

// 获取我的协会（已通过的）
router.get('/association', async (req, res) => {
    try {
        const Associations = await Association.find({
            state: 1
        })
        res.send({
            code: 200,
            data: Associations,
            message: '获取我的协会成功',
        });
    } catch (error) {
        res.send({
            code: 500,
            message: '获取失败',
            error: error.message
        });
    }
});

// 获取发现协会（待审核的）
router.get('/association-discover', async (req, res) => {
    try {
        const userAssociations = await Association.find({
            state: 0
        })
        res.send({
            code: 200,
            data: userAssociations,
            message: '获取待审核协会成功',
        });
    } catch (error) {
        res.send({
            code: 500,
            message: '获取失败',
            error: error.message
        });
    }
});
router.put('/association-join', async (req, res) => {
    console.log(req.query._id, 90);
    
    try {
        const { _id } = req.query;

        if (!_id) {
            return res.send({
                code: 400,
                message: '缺少协会ID'
            });
        }
        // 更新协会状态
        const updatedAssociation = await Association.findByIdAndUpdate(
            _id,
            { state: 1 },
            { new: true }
        );

        res.send({
            code: 200,
            data: updatedAssociation
        });
        
    } catch (error) {
        res.send({
            code: 500,
            message: '操作失败',
            error: error.message
        });
    }
});
router.get('/association/:associationId', async (req, res) => {
  try {
    const { associationId } = req.params;
    
    // 获取协会信息
    const association = await Association.findById(associationId);
    if (!association) {
      return res.status(404).json({ code: 404, msg: '协会不存在或已停用' });
    }
    
    // 直接返回数据库中的数据结构
    res.json({
      code: 200,
      data: {
        _id: association._id,
        id: association.id,
        name: association.name,
        description: association.description,
        avatar: association.avatar,
        coverImage: association.coverImage,
        state: association.state,
        memberCount: association.memberCount,
        maxMembers: association.maxMembers,
        president: association.president,
        needsApproval: association.needsApproval,
        activityCount: association.activityCount,
        createtime: association.createtime
      }
    });
    
  } catch (error) {
    console.error('获取协会详情失败:', error);
    res.status(500).json({ code: 500, msg: '获取协会详情失败' });
  }
});

// router.get('/list',async (req,res)=>{
//   const {type,title,status} = req.query;
//   console.log(type,title,status);
  
//   const obj={}
//   if(title){
//     obj.title = new RegExp(title, 'i'); // 'i' 忽略大小写
//   }

//   // 状态筛选
//   if (status) {
//     if (status === 'onsale') {
//       obj.isHot = true;
//       obj.isDeleted = false;
//       obj.isWarehouse = false;
//       type ? obj.category = type :'' ;
//     }
//   });

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await activityEvent.findByIdAndDelete(id);
        
        if (!result) {
            return res.send({
                code: 404,
                message: '活动不存在'
            });
        }
        
        res.send({
            code: 200,
            message: '删除成功'
        });
    } catch (error) {
        res.send({
            code: 500,
            message: '删除失败',
            error: error.message
        });
    // if (status === 'warehouse') {
    //   obj.isWarehouse = true;
    //   obj.isDeleted = false;
    //   type ? obj.category = type :'' ;

    }
    if (status === 'ended') {
      obj.isHot = false;
      obj.isDeleted = false;
      obj.isWarehouse = false;
      type ? obj.category = type :'' ;
    }
    if (status === 'alert') {
      obj.stock = { $lte: 10 };
      obj.isDeleted = false;
      type ? obj.category = type :'' ;
    }
    if (status === 'recycle') {
      obj.isDeleted = true;
      type ? obj.category = type :'' ;
    }
  }),




router.post('/update', async (req, res) => {
  const { _id, ids, isHot } = req.body;
  if (ids && Array.isArray(ids) && ids.length > 0) {
    // 批量下架
    await GoodsList.updateMany({ _id: { $in: ids } }, { isHot: isHot });
  } else if (_id) {
    // 单个上下架
    await GoodsList.updateOne({ _id }, { isHot: isHot });
  }
  res.send({ code: 200, msg: '更新成功' });
});

router.get('/api/product/topinfo', async (req, res) => {
  const onsale = await GoodsList.countDocuments({ isHot: true, isDeleted: false, isWarehouse: false });
  const warehouse = await GoodsList.countDocuments({ isWarehouse: true, isDeleted: false });
  const ended = await GoodsList.countDocuments({ isHot: false, isDeleted: false, isWarehouse: false });
  const alert = await GoodsList.countDocuments({ stock: { $lte: 10 }, isDeleted: false });
  const recycle = await GoodsList.countDocuments({ isDeleted: true });
  res.send({ onsale, warehouse, ended, alert, recycle });
});

router.get('/api/category', async (req, res) => {
  const all = await Category.find().lean();
  function buildTree(list, parent = null) {
    return list
      .filter(item => String(item.parent) === String(parent))
      .map(item => ({
        title: item.name,
        value: String(item._id),
        children: buildTree(list, item._id)
      }));
  }
  res.send(buildTree(all, null));
  // res.send(
  //   {
  //     code:200,
  //     data:[]
  //   }
  // )
});

router.get('/api/menu', async (req, res) => {
  // 示例静态数据，实际可从数据库查
  res.send([
    {
      key: '/home',
      icon: 'HomeOutlined',
      label: '主页'
    },
    {
      key: 'product',
      icon: 'ShoppingOutlined',
      label: '商品',
      children: [
        { key: '/product-manage', label: '商品管理' },
        { key: '/product-category', label: '商品分类' },
        { key: '/product-comment', label: '商品评论' },
        { key: '/product-spec', label: '商品规格' }
      ]
    }
  ]);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// 获取家庭报名数据
router.get('/familyforms', async (req, res) => {
    try {
        const { page = 1, pageSize = 10, activityId } = req.query;
        const skip = (page - 1) * pageSize;
        
        const query = {};
        if (activityId && activityId.trim()) {
            query.activityId = activityId;
        }
        
        const data = await familyForm.find(query)
            .sort({ createTime: -1 })
            .skip(skip)
            .limit(parseInt(pageSize));
        
        const total = await familyForm.countDocuments(query);
        
        res.send({
            code: 200,
            data: data,
            message: '获取成功',
            total: total
        });
    } catch (error) {
        res.send({
            code: 500,
            message: '获取失败',
            error: error.message
        });
    }
  });

router.post('/community/like/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        
        if (!postId) {
            return res.send({
                code: 400,
                message: '缺少帖子ID'
            });
        }
        
        // 查找帖子
        const post = await ActivityPost.findById(postId);
        
        if (!post) {
            return res.send({
                code: 404,
                message: '帖子不存在'
            });
        }
        
        // 增加点赞数量
        const updatedPost = await ActivityPost.findByIdAndUpdate(
            postId,
            { $inc: { likes: 1 } },
            { new: true }
        );
        
        res.send({
            code: 200,
            data: {
                _id: updatedPost._id,
                id: updatedPost.id,
                likes: updatedPost.likes,
                isLiked: true // 标记为已点赞
            },
            message: '点赞成功'
        });
        
    } catch (error) {
        res.send({
            code: 500,
            message: '点赞失败',
            error: error.message
        });
    }
});
const { Banner, Notification, FeatureIntro, CategoryTag, Content, UserAction } = require('../models/index');
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

// ===== 前端首页API路由 =====

// 获取首页横幅
router.get('/home/banner', async (req, res) => {
  try {
    const banners = await Banner.find({ 
      locationType: '首页banner位',
      status: { $in: ['已发布', 'active'] }
    }).sort({ sortOrder: 1 });
    
    // 转换为前端期望的格式
    const formattedBanners = banners.map(banner => ({
      _id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl.startsWith('/uploads/') 
        ? `http://localhost:3000${banner.imageUrl}` 
        : banner.imageUrl,
      redirectUrl: banner.redirectUrl,
      startTime: banner.startTime,
      endTime: banner.endTime,
      status: banner.status === '已发布' ? 'active' : banner.status,
      createdAt: banner.createdAt
    }));
    
    res.json({
      code: 200,
      message: 'success',
      data: formattedBanners,
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: [],
      success: false
    });
  }
});

// 获取快捷功能
router.get('/home/quick-actions', async (req, res) => {
  try {
    const actions = await Banner.find({
      locationType: '快捷功能',
      status: { $in: ['已发布', 'active'] }
    }).sort({ sortOrder: 1 });
    
    // 转换为前端期望的格式
    const formattedActions = actions.map(action => ({
      _id: action._id,
      title: action.title,
      icon: action.icon,
      type: action.type,
      redirectUrl: action.redirectUrl,
      sortOrder: action.sortOrder,
      status: action.status === '已发布' ? 'active' : action.status
    }));
    
    res.json({
      code: 200,
      message: 'success',
      data: formattedActions,
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: [],
      success: false
    });
  }
});

// 获取通知列表
router.get('/home/notifications', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      code: 200,
      message: 'success',
      data: notifications,
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: [],
      success: false
    });
  }
});

// 获取热门活动
router.get('/home/activities', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await Banner.find({
      locationType: '活动',
      status: { $in: ['已发布', 'active'] }
    }).sort({ participants: -1, createdAt: -1 }).limit(parseInt(limit));
    
    // 转换为前端期望的格式
    const formattedActivities = activities.map(activity => ({
      _id: activity._id,
      title: activity.title,
      description: activity.description,
      imageUrl: activity.imageUrl && activity.imageUrl.startsWith('/uploads/') 
        ? `http://localhost:3000${activity.imageUrl}` 
        : activity.imageUrl,
      participants: activity.participants,
      status: activity.status === '已发布' ? 'active' : activity.status,
      category: activity.category,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      createdAt: activity.createdAt
    }));
    
    res.json({
      code: 200,
      message: 'success',
      data: formattedActivities,
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: [],
      success: false
    });
  }
});

// 获取功能介绍
router.get('/home/feature-intros', async (req, res) => {
  try {
    const features = await FeatureIntro.find({ status: 'active' });
    
    res.json({
      code: 200,
      message: 'success',
      data: features,
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: [],
      success: false
    });
  }
});

// 获取分类标签
router.get('/home/category-tags', async (req, res) => {
  try {
    const tags = await CategoryTag.find().sort({ sortOrder: 1 });
    
    res.json({
      code: 200,
      message: 'success',
      data: tags,
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: [],
      success: false
    });
  }
});

// 活动报名
router.post('/activities/join', async (req, res) => {
  try {
    const { activityId } = req.body;
    
    if (!activityId) {
      return res.json({
        code: 400,
        message: '缺少活动ID',
        success: false
      });
    }
    
    // 更新活动报名人数
    const activity = await Banner.findOneAndUpdate(
      { _id: activityId, locationType: '活动' },
      { $inc: { participants: 1 } },
      { new: true }
    );
    
    if (!activity) {
      return res.json({
        code: 404,
        message: '活动不存在',
        success: false
      });
    }
    
    res.json({
      code: 200,
      message: '报名成功',
      data: { participants: activity.participants },
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      success: false
    });
  }
});

// 消除消息红点提示
router.post('/notifications/clear-red-dot', async (req, res) => {
  try {
    const { category } = req.body; // 'system' 或 'sports' 或 'all'
    
    let updateCondition = {};
    if (category && category !== 'all') {
      updateCondition.category = category;
    }
    
    // 将指定分类的所有消息红点设为不显示
    await Notification.updateMany(
      updateCondition,
      { showRedDot: false }
    );
    
    res.json({
      code: 200,
      message: '红点已清除',
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      success: false
    });
  }
});

// 获取未读消息数量（红点统计）
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const systemCount = await Notification.countDocuments({ 
      category: 'system', 
      showRedDot: true 
    });
    
    const sportsCount = await Notification.countDocuments({ 
      category: 'sports', 
      showRedDot: true 
    });
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        system: systemCount,
        sports: sportsCount,
        total: systemCount + sportsCount
      },
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: { system: 0, sports: 0, total: 0 },
      success: false
    });
  }
});

// ===== 体育内容信息流API =====

// 获取内容列表
router.get('/content/list', async (req, res) => {
  try {
    const { 
      type, // 'article' | 'video' | 'all'
      category, 
      featured, 
      limit = 10, 
      page = 1 
    } = req.query;
    
    let query = { status: 'published' };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    if (category) {
      query.category = category;
    }
    if (featured) {
      query.featured = featured === 'true';
    }
    
    const skip = (page - 1) * limit;
    const contents = await Content.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Content.countDocuments(query);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: contents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: { list: [], pagination: {} },
      success: false
    });
  }
});

// 获取内容详情
router.get('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);
    
    if (!content) {
      return res.json({
        code: 404,
        message: '内容不存在',
        success: false
      });
    }
    
    // 增加浏览量
    await Content.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    content.viewCount += 1;
    
    res.json({
      code: 200,
      message: 'success',
      data: content,
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      success: false
    });
  }
});

// 用户互动：点赞
router.post('/content/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'anonymous' } = req.body;
    
    // 检查是否已经点过赞
    const existingLike = await UserAction.findOne({
      userId,
      contentId: id,
      actionType: 'like'
    });
    
    if (existingLike) {
      // 取消点赞
      await UserAction.deleteOne({ _id: existingLike._id });
      await Content.findByIdAndUpdate(id, { $inc: { likeCount: -1 } });
      
      res.json({
        code: 200,
        message: '取消点赞',
        data: { liked: false },
        success: true
      });
    } else {
      // 新增点赞
      await UserAction.create({
        userId,
        contentId: id,
        actionType: 'like'
      });
      await Content.findByIdAndUpdate(id, { $inc: { likeCount: 1 } });
      
      res.json({
        code: 200,
        message: '点赞成功',
        data: { liked: true },
        success: true
      });
    }
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      success: false
    });
  }
});

// 用户互动：评论
router.post('/content/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'anonymous', commentText } = req.body;
    
    if (!commentText) {
      return res.json({
        code: 400,
        message: '评论内容不能为空',
        success: false
      });
    }
    
    // 添加评论记录
    await UserAction.create({
      userId,
      contentId: id,
      actionType: 'comment',
      commentText
    });
    
    // 增加评论数量
    await Content.findByIdAndUpdate(id, { $inc: { commentCount: 1 } });
    
    res.json({
      code: 200,
      message: '评论成功',
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      success: false
    });
  }
});

// 用户互动：分享
router.post('/content/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'anonymous' } = req.body;
    
    // 添加分享记录
    await UserAction.create({
      userId,
      contentId: id,
      actionType: 'share'
    });
    
    // 增加分享数量
    await Content.findByIdAndUpdate(id, { $inc: { shareCount: 1 } });
    
    res.json({
      code: 200,
      message: '分享成功',
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      success: false
    });
  }
});

// 获取用户对内容的互动状态
router.get('/content/:id/user-actions', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'anonymous' } = req.query;
    
    const actions = await UserAction.find({
      userId,
      contentId: id
    });
    
    const userActions = {
      liked: actions.some(action => action.actionType === 'like'),
      commented: actions.some(action => action.actionType === 'comment'),
      shared: actions.some(action => action.actionType === 'share')
    };
    
    res.json({
      code: 200,
      message: 'success',
      data: userActions,
      success: true
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
      data: { liked: false, commented: false, shared: false },
      success: false
    });
  }
});

module.exports = router;
