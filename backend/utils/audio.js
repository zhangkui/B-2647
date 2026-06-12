const path = require('path');
const fs = require('fs');
const { parseFile } = require('music-metadata');
const config = require('../config');

const audioUtil = {
  async parseAudioFile(filePath) {
    try {
      const metadata = await parseFile(filePath);
      const stat = fs.statSync(filePath);

      const ext = path.extname(filePath).slice(1).toLowerCase();
      const fileName = path.basename(filePath, path.extname(filePath));

      return {
        title: metadata.common.title || fileName,
        artist: metadata.common.artist || null,
        album: metadata.common.album || null,
        duration: Math.round(metadata.format.duration || 0),
        format: ext,
        fileSize: stat.size,
        mimeType: metadata.format.container || `audio/${ext}`,
        bitRate: metadata.format.bitrate || null,
        sampleRate: metadata.format.sampleRate || null,
        sampleRate: metadata.format.sampleRate || null,
      };
    } catch (error) {
      const stat = fs.statSync(filePath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const fileName = path.basename(filePath, path.extname(filePath));

      return {
        title: fileName,
        artist: null,
        album: null,
        duration: 0,
        format: ext,
        fileSize: stat.size,
        mimeType: `audio/${ext}`,
        bitRate: null,
        sampleRate: null,
      };
    }
  },

  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  isValidAudioFile(filename) {
    const ext = path.extname(filename).slice(1).toLowerCase();
    return config.upload.allowedTypes.includes(ext);
  },

  getAudioMimeType(format) {
    const mimeTypes = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      flac: 'audio/flac',
      aac: 'audio/aac',
    };
    return mimeTypes[format.toLowerCase()] || 'audio/mpeg';
  },
};

module.exports = audioUtil;
