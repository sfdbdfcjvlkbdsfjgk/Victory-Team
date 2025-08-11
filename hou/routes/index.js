var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { ActivityPost,Association,UserAssociation,activityEvent,teamForm,individualForm,familyForm } = require('../models/index');


router.get('/list', async (req, res) => {
  const { page = 1, pageSize = 10, title, type, activityprogress, state } = req.query;
  const skip = (page - 1) * pageSize;
  
  // 构建查询条件
  const query = {};
  if (title && title.trim()) {
    query.title = { $regex: title, $options: 'i' }; // 模糊搜索，忽略大小写
  }
  if (type && type.trim()) {
    query.type = type;
  }
  if (activityprogress && activityprogress.trim()) {
    query.activityprogress = activityprogress;
  }
  if (state && state.trim()) {
    query.state = state;
  }
  
  const data = await activityEvent.find(query)
    .sort({ id: 1 })
    .skip(skip)
    .limit(parseInt(pageSize));
  
  const total = await activityEvent.countDocuments(query);
  
  res.send({
    code: 200,
    data: data,
    message: '获取成功',
    total: total
  });
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

router.put('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const result = await activityEvent.findByIdAndUpdate(
            id,
            updateData,
            { new: true } // 返回更新后的文档
        );
        
        if (!result) {
            return res.send({
                code: 404,
                message: '活动不存在'
            });
        }
        
        res.send({
            code: 200,
            data: result,
            message: '编辑成功'
        });
    } catch (error) {
        res.send({
            code: 500,
            message: '编辑失败',
            error: error.message
        });
    }
  });

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
    }
});

router.put('/publish/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await activityEvent.findByIdAndUpdate(
            id,
            { state: '已发布' },
            { new: true }
        );
        
        if (!result) {
            return res.send({
                code: 404,
                message: '活动不存在'
            });
        }
        
        res.send({
            code: 200,
            data: result,
            message: '发布成功'
        });
    } catch (error) {
        res.send({
            code: 500,
            message: '发布失败',
            error: error.message
        });
    }
});

router.put('/offline/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await activityEvent.findByIdAndUpdate(
            id,
            { state: '已下线' ,topstate:0},
            { new: true }
        );
        
        if (!result) {
            return res.send({
                code: 404,
                message: '活动不存在'
            });
        }
        
        res.send({
            code: 200,
            data: result,
            message: '下线成功'
        });
    } catch (error) {
        res.send({
            code: 500,
            message: '下线失败',
            error: error.message
        });
    }
});

// 获取团队报名数据
router.get('/teamforms', async (req, res) => {
    try {
        const { page = 1, pageSize = 10, activityId } = req.query;
        const skip = (page - 1) * pageSize;
        
        const query = {};
        if (activityId && activityId.trim()) {
            query.activityId = activityId;
        }
        
        const data = await teamForm.find(query)
            .sort({ createTime: -1 })
            .skip(skip)
            .limit(parseInt(pageSize));
        
        const total = await teamForm.countDocuments(query);
        
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

// 获取个人报名数据
router.get('/individualforms', async (req, res) => {
    try {
        const { page = 1, pageSize = 10, activityId } = req.query;
        const skip = (page - 1) * pageSize;
        
        const query = {};
        if (activityId && activityId.trim()) {
            query.activityId = activityId;
        }
        
        const data = await individualForm.find(query)
            .sort({ createTime: -1 })
            .skip(skip)
            .limit(parseInt(pageSize));
        
        const total = await individualForm.countDocuments(query);
        
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


// router.post('/login',async (req,res)=>{
//   const {username,password}=req.body;
//   const user=await User.findOne({username,password});
//   if(!user){
//     res.send({code:400,msg:'用户名或密码错误'})
//     return;
//   }
//   res.send({code:200,msg:'登录成功',data:user})
// })

// // router.get('/list',async (req,res)=>{
// //   const {type,title,status} = req.query;
// //   console.log(type,title,status);
  
// //   const obj={}
// //   if(title){
// //     obj.title = new RegExp(title, 'i'); // 'i' 忽略大小写
// //   }

// //   // 状态筛选
// //   if (status) {
// //     if (status === 'onsale') {
// //       obj.isHot = true;
// //       obj.isDeleted = false;
// //       obj.isWarehouse = false;
// //       type ? obj.category = type :'' ;
// //     }
// //     if (status === 'warehouse') {
// //       obj.isWarehouse = true;
// //       obj.isDeleted = false;
// //       type ? obj.category = type :'' ;
// //     }
// //     if (status === 'ended') {
// //       obj.isHot = false;
// //       obj.isDeleted = false;
// //       obj.isWarehouse = false;
// //       type ? obj.category = type :'' ;
// //     }
// //     if (status === 'alert') {
// //       obj.stock = { $lte: 10 };
// //       obj.isDeleted = false;
// //       type ? obj.category = type :'' ;
// //     }
// //     if (status === 'recycle') {
// //       obj.isDeleted = true;
// //       type ? obj.category = type :'' ;
// //     }
// //   }
// //   // console.log(obj);
  
// //   const data=await GoodsList.find(obj);
// //   // console.log(data);
  
// //   res.send({code:200,data:data});
// // })

// router.post('/update', async (req, res) => {
//   const { _id, ids, isHot } = req.body;
//   if (ids && Array.isArray(ids) && ids.length > 0) {
//     // 批量下架
//     await GoodsList.updateMany({ _id: { $in: ids } }, { isHot: isHot });
//   } else if (_id) {
//     // 单个上下架
//     await GoodsList.updateOne({ _id }, { isHot: isHot });
//   }
//   res.send({ code: 200, msg: '更新成功' });
// });

// router.get('/api/product/topinfo', async (req, res) => {
//   const onsale = await GoodsList.countDocuments({ isHot: true, isDeleted: false, isWarehouse: false });
//   const warehouse = await GoodsList.countDocuments({ isWarehouse: true, isDeleted: false });
//   const ended = await GoodsList.countDocuments({ isHot: false, isDeleted: false, isWarehouse: false });
//   const alert = await GoodsList.countDocuments({ stock: { $lte: 10 }, isDeleted: false });
//   const recycle = await GoodsList.countDocuments({ isDeleted: true });
//   res.send({ onsale, warehouse, ended, alert, recycle });
// });

// router.get('/api/category', async (req, res) => {
//   const all = await Category.find().lean();
//   function buildTree(list, parent = null) {
//     return list
//       .filter(item => String(item.parent) === String(parent))
//       .map(item => ({
//         title: item.name,
//         value: String(item._id),
//         children: buildTree(list, item._id)
//       }));
//   }
//   res.send(buildTree(all, null));
//   // res.send(
//   //   {
//   //     code:200,
//   //     data:[]
//   //   }
//   // )
// });

// router.get('/api/menu', async (req, res) => {
//   // 示例静态数据，实际可从数据库查
//   res.send([
//     {
//       key: '/home',
//       icon: 'HomeOutlined',
//       label: '主页'
//     },
//     {
//       key: 'product',
//       icon: 'ShoppingOutlined',
//       label: '商品',
//       children: [
//         { key: '/product-manage', label: '商品管理' },
//         { key: '/product-category', label: '商品分类' },
//         { key: '/product-comment', label: '商品评论' },
//         { key: '/product-spec', label: '商品规格' }
//       ]
//     }
//   ]);
// });





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
module.exports = router;