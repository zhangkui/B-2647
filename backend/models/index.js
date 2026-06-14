const User = require('./User');
const Music = require('./Music');
const PlayHistory = require('./PlayHistory');
const PlayState = require('./PlayState');

User.hasMany(Music, {
  foreignKey: 'user_id',
  as: 'musics',
  onDelete: 'CASCADE',
});

Music.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(PlayHistory, {
  foreignKey: 'user_id',
  as: 'playHistory',
  onDelete: 'CASCADE',
});

PlayHistory.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

PlayHistory.belongsTo(Music, {
  foreignKey: 'music_id',
  as: 'music',
  onDelete: 'CASCADE',
});

User.hasOne(PlayState, {
  foreignKey: 'user_id',
  as: 'playState',
  onDelete: 'CASCADE',
});

PlayState.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = {
  User,
  Music,
  PlayHistory,
  PlayState,
};
