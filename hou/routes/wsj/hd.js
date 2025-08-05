var express = require('express');
var router = express.Router();
var {releaseactivity,addlabel,activityEvent,teamForm,individualForm,familyForm}=require('../../models/index');



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


//图片上传
router.post('/upload/image',async (req,res)=>{
  try {
    // 检查是否有文件上传
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const uploadedFile = req.files.file;
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(uploadedFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: '只支持图片文件格式'
      });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = uploadedFile.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    // 设置上传路径
    const uploadPath = `./public/uploads/${fileName}`;
    
    // 确保上传目录存在
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.dirname(uploadPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // 移动文件到目标位置
    await uploadedFile.mv(uploadPath);
    
    // 返回图片URL
    const imageUrl = `/uploads/${fileName}`;
    
    res.json({
      success: true,
      data: {
        url: imageUrl
      },
      message: '图片上传成功'
    });
    
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败'
    });
  }
})





//新增标签
router.post('/addlabel',async (req,res)=>{
  const {sport_tag}=req.body;
  const data=new addlabel({sport_tag});
  await data.save();
// console.log(sport_tag,2222222)
  res.send({
    code:200,
    msg:'发布成功',
    data:data
});
})

//删除标签
router.post('/deletelabel',async (req,res)=>{
  const {id}=req.body;
  // console.log(id,1111111)
  await addlabel.findByIdAndDelete(id);
  res.send({
    code:200,
    msg:'删除成功'
  });
})

//获取标签
router.get('/getlabel',async (req,res)=>{
//   const {sport_tag}=req.query;
  const data=await addlabel.find();
//   console.log(data,3333333)
  res.send({
    code:200,
    msg:'获取成功',
    data:data
});
})



//发布活动不含函赛事
router.post('/releaseactivity',async (req,res)=>{
  try {
    const activityData = req.body;
    // console.log('前端数据:', req.body,11111111);
    
    // 现在字段名一致，直接保存
    const data = new releaseactivity(activityData);
    await data.save();
    
    res.send({
      code: 200,
      msg: '发布成功',
      data: data
    });
  } catch (error) {
    console.error('发布活动失败:', error);
    res.status(500).send({
      code: 500,
      msg: '发布失败',
      error: error.message
    });
  }
})




//获取活动不含赛事
router.get('/releaseactivitylist',async(req,res)=>{
  const data=await releaseactivity.find();

  console.log(data,20000)

  res.send({
    code:200,
    msg:"获取成功",
    data:data
  })
})






//发布活动含赛事
router.post('/noreleaseactivity',async (req,res)=>{
  try {
    const activityData = req.body;
    // console.log('前端数据:', activityData,11111111);
    
    // 现在字段名一致，直接保存
    const data = new activityEvent(activityData);
    await data.save();
    
    res.send({
      code: 200,
      msg: '发布成功',
      data: data
    });
  } catch (error) {
    console.error('发布活动失败:', error);
    res.status(500).send({
      code: 500,
      msg: '发布失败',
      error: error.message
    });
  }
})



//获取发布活动含赛事
router.get('/ss',async(req,res)=>{
  const data=await activityEvent.find();

  // console.log(data,30000)

  res.send({
    code:200,
    msg:"获取成功",
    data:data
  })
})




//根据ID获取单个活动详情
router.get('/ss/:activityId',async(req,res)=>{
  try {
    const { activityId } = req.params;
    const _id=activityId
    const data = await activityEvent.findById(_id);
    
    if (!data) {
      return res.status(404).send({
        code: 404,
        msg: "活动不存在"
      });
    }

    // 获取该活动对应的报名表单数据
    const formData = await teamForm.find({ activityId: _id });
    console.log('找到的表单数据:', formData);

    // 格式化时间字段
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // 创建格式化后的数据对象
    const formattedData = {
      ...data.toObject(),
      createdAt: formatDate(data.createdAt),
      updatedAt: formatDate(data.updatedAt),
      formdata: formData, // 添加表单数据
      // 如果有其他时间字段，也可以在这里格式化
      // startTime: formatDate(data.startTime),
      // endTime: formatDate(data.endTime),
    };

    console.log('获取活动详情:', formattedData);

    res.send({
      code: 200,
      msg: "获取成功",
      data: formattedData
    });
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).send({
      code: 500,
      msg: "获取活动详情失败",
      error: error.message
    });
  }
})


//团队添加活动人员表单
router.post('/register/team',async(req,res)=>{
  const aaa=req.body;
  // console.log('接收到的数据:', aaa);
  
  // 确保包含activityId
  if (!aaa.activityId) {
    return res.status(400).send({
      code: 400,
      msg: "缺少活动ID"
    });
  }
  
  // 验证和结构化members数据
  if (aaa.members && Array.isArray(aaa.members)) {
    aaa.members = aaa.members.map(member => {
      // 确保每个成员对象都有正确的结构
      return {
        name: member.name || '',
        phone: member.phone || '',
        idCard: member.idCard || '',
        emergencyContact: member.emergencyContact || '',
        age: member.age || '',
        gender: member.gender || ''
      };
    });
  }
  
  console.log('结构化后的数据:', aaa);
  
  // 保存数据
  const data=new teamForm(aaa);
  await data.save();
  
  // console.log('保存成功:', data);
  
  res.send({
    code:200,
    msg:"发布成功",
    data:data
  })
})




//个人添加
router.post('/register/individual',async(req,res)=>{
  const aaa=req.body;
  // console.log('接收到的数据:', aaa);
  console.log(req.body,1111111)
  
  const data=new individualForm(aaa);
  await data.save();
  res.send({
    code:200,
    msg:"发布成功",
    data:data
  })
})


//家庭添加
router.post('/register/family',async(req,res)=>{
  const aaa=req.body;
  console.log('接收到的家庭活动数据:', aaa);
  
  try {
    // 基础验证
    if (!aaa.activityId) {
      return res.status(400).send({
        code: 400,
        msg: "缺少活动ID"
      });
    }
    
    // 验证members数组
    if (!aaa.members || !Array.isArray(aaa.members) || aaa.members.length === 0) {
      return res.status(400).send({
        code: 400,
        msg: "请至少添加一个家庭成员"
      });
    }
    
    // 验证每个成员的数据
    for (let i = 0; i < aaa.members.length; i++) {
      const member = aaa.members[i];
      
      if (!member['姓名'] || !member['手机号'] || !member['证件类型/证件号'] || !member['年龄限制'] || !member['性别限制']) {
        return res.status(400).send({
          code: 400,
          msg: `第${i + 1}个成员信息不完整，请填写所有必填项`
        });
      }
    }
    
    console.log('验证通过，准备保存家庭活动数据:', aaa);
    
    // 保存数据
    const data = new familyForm(aaa);
    await data.save();
    
    console.log('保存成功:', data);
    
    res.send({
      code: 200,
      msg: "发布成功",
      data: data
    });
    
  } catch (error) {
    console.error('保存失败:', error);
    
    // 处理Mongoose验证错误
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).send({
        code: 400,
        msg: "数据验证失败",
        errors: validationErrors
      });
    }
    
    res.status(500).send({
      code: 500,
      msg: "保存失败，请稍后重试",
      error: error.message
    });
  }
})



module.exports = router;