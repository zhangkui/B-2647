const sequelize = require('../config/database');
const { User, Music } = require('../models');

async function initDatabase() {
  try {
    console.log('正在连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    console.log('正在同步数据表...');
    await sequelize.sync({ alter: true });
    console.log('数据表同步完成！');

    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      console.log('正在创建默认管理员账户...');
      await User.create({
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
        nickname: '管理员',
      });
      console.log('默认管理员账户创建成功！');
      console.log('用户名: admin');
      console.log('密码: admin123');
    }

    console.log('\n数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

initDatabase();
