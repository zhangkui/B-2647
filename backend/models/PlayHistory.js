const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlayHistory = sequelize.define('PlayHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  music_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '音乐ID',
    references: {
      model: 'musics',
      key: 'id',
    },
  },
  played_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '播放时间',
  },
  progress: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '播放进度（秒）',
  },
}, {
  tableName: 'play_history',
  indexes: [
    {
      name: 'idx_user_id',
      fields: ['user_id'],
    },
    {
      name: 'idx_user_music',
      fields: ['user_id', 'music_id'],
    },
    {
      name: 'idx_played_at',
      fields: ['played_at'],
    },
  ],
});

module.exports = PlayHistory;
