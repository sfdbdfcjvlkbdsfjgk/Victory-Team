var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileUpload = require('express-fileupload');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var wsjRouter = require('./routes/wsj/hd');
var videosRouter = require('./routes/api/videos');
var uploadRouter = require('./routes/api/upload');
var chunkUploadRouter = require('./routes/api/chunkUpload');
var txsRouter=require('./routes/txs')
var uploadRouter = require('./routes/upload');
var uploadSimpleRouter = require('./routes/upload-simple'); // 简化上传路由
var sportsRouter = require('./routes/sports');
var weatherRouter = require('./routes/weather');
var sportsEventsRouter = require('./routes/sports-events');
var apiRouter = require('./routes/api'); // 新增API路由
var cors = require('cors');
var app = express();
// CORS配置 - 允许大文件上传
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
// 增大请求体限制以支持大文件上传和高速模式
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false, limit: '500mb' }));
app.use(cookieParser());

app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 500 * 1024 * 1024 // 修改为500MB，与视频上传限制一致
  }
}));

// 静态文件服务配置
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.mp4') || path.endsWith('.avi') || path.endsWith('.mov') || path.endsWith('.wmv')) {
      res.set({
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range'
      });
    }
  }
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/wsj', wsjRouter);
app.use('/txs',txsRouter)
app.use('/api/upload', uploadRouter);
app.use('/api/upload-simple', uploadSimpleRouter); // 简化上传路由
app.use('/sports', sportsRouter);
app.use('/weather', weatherRouter);
app.use('/sports-events', sportsEventsRouter);
app.use('/api', apiRouter); // 挂载API路由

// 静态文件服务 - 提供上传的文件访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', videosRouter);
app.use('/api', uploadRouter);
app.use('/api', chunkUploadRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
