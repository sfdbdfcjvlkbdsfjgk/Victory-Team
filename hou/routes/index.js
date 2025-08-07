var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { Activitymanage, activityEvent,teamForm,individualForm,familyForm } = require('../models/index');


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

module.exports = router;
