var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const {User,GoodsList,Category}=require('../models/index');

router.post('/login',async (req,res)=>{
  const {username,password}=req.body;
  const user=await User.findOne({username,password});
  if(!user){
    res.send({code:400,msg:'用户名或密码错误'})
    return;
  }
  res.send({code:200,msg:'登录成功',data:user})
})

router.get('/list',async (req,res)=>{
  const {type,title,status} = req.query;
  console.log(type,title,status);
  
  const obj={}
  if(title){
    obj.title = new RegExp(title, 'i'); // 'i' 忽略大小写
  }

  // 状态筛选
  if (status) {
    if (status === 'onsale') {
      obj.isHot = true;
      obj.isDeleted = false;
      obj.isWarehouse = false;
      type ? obj.category = type :'' ;
    }
    if (status === 'warehouse') {
      obj.isWarehouse = true;
      obj.isDeleted = false;
      type ? obj.category = type :'' ;
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
  }
  // console.log(obj);
  
  const data=await GoodsList.find(obj);
  // console.log(data);
  
  res.send({code:200,data:data});
})

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

module.exports = router;
