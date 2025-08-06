var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const {Activitymanage}=require('../models/index');

router.get('/list',async(req,res)=>{
    const data = await Activitymanage.find();
    res.send({
        code:200,
        data:data,
        message:'获取成功'
    });
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
