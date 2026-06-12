require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'music_db',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'music-server-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520', 10),
    allowedTypes: (process.env.ALLOWED_AUDIO_TYPES || 'mp3,wav,ogg,m4a,flac,aac').split(','),
  },
};

module.exports = config;
