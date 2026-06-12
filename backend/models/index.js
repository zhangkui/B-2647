const User = require('./User');
const Music = require('./Music');

User.hasMany(Music, {
  foreignKey: 'user_id',
  as: 'musics',
  onDelete: 'CASCADE',
});

Music.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = {
  User,
  Music,
};
