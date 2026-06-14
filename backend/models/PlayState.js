const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlayState = sequelize.define('PlayState', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: '用户ID',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  current_music_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '当前播放音乐ID',
  },
  current_index: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: -1,
    comment: '当前播放索引',
  },
  is_playing: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: '是否正在播放',
  },
  progress: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    comment: '播放进度（秒）',
  },
  volume: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 70,
    comment: '音量（0-100）',
  },
  play_mode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'sequence',
    comment: '播放模式：sequence顺序，loop列表循环，single单曲循环，shuffle随机',
  },
  queue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '播放队列（JSON格式）',
  },
  recent_play: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '最近播放（JSON格式）',
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '更新时间',
  },
}, {
  tableName: 'play_state',
  timestamps: false,
  indexes: [
    {
      name: 'idx_user_id',
      fields: ['user_id'],
      unique: true,
    },
  ],
});

module.exports = PlayState;
