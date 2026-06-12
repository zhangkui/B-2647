const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Music = sequelize.define('Music', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属用户ID',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '歌曲名称',
  },
  artist: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '艺术家',
  },
  album: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '专辑',
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '时长（秒）',
  },
  format: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '音频格式',
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '文件大小（字节）',
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '文件存储路径',
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '原始文件名',
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'MIME类型',
  },
  bit_rate: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '比特率',
  },
  sample_rate: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '采样率',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1-正常，0-删除',
  },
}, {
  tableName: 'musics',
  indexes: [
    {
      name: 'idx_user_id',
      fields: ['user_id'],
    },
    {
      name: 'idx_title',
      fields: ['title'],
    },
  ],
});

module.exports = Music;
