const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const sequelize = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth');
const musicRoutes = require('./routes/music');
const playRoutes = require('./routes/play');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.get('/', (req, res) => {
  res.json({
    code: 0,
    message: '音乐管理系统 API 服务运行中',
    data: {
      version: '1.0.0',
      env: config.env,
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: '服务正常',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/play', playRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ alter: true });
    console.log('数据表同步完成');

    app.listen(config.port, () => {
      console.log(`\n🚀 音乐管理系统后端服务启动成功！`);
      console.log(`📍 服务地址: http://localhost:${config.port}`);
      console.log(`🌱 环境: ${config.env}`);
      console.log(`📚 数据库: ${config.db.database}`);
      console.log(`\n📋 API 文档:`);
      console.log(`   GET  /                - 服务信息`);
      console.log(`   GET  /health          - 健康检查`);
      console.log(`   POST /api/auth/register - 用户注册`);
      console.log(`   POST /api/auth/login    - 用户登录`);
      console.log(`   POST /api/auth/logout   - 用户退出`);
      console.log(`   GET  /api/music       - 获取音乐列表`);
      console.log(`   POST /api/music/upload - 上传音乐`);
      console.log(`   GET  /api/music/:id   - 音乐详情`);
      console.log(`   GET  /api/music/:id/play - 播放音乐`);
      console.log(`   DELETE /api/music/:id - 删除音乐`);
      console.log(`   POST /api/play/history - 保存播放历史`);
      console.log(`   GET  /api/play/history - 获取播放历史`);
      console.log(`   DELETE /api/play/history - 清空播放历史`);
      console.log(`   POST /api/play/state   - 保存播放状态`);
      console.log(`   GET  /api/play/state   - 获取播放状态`);
      console.log(`\n`);
    });
  } catch (error) {
    console.error('服务启动失败:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
