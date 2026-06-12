const path = require('path');
const fs = require('fs');
const { Music } = require('../models');
const ApiError = require('../utils/ApiError');
const Response = require('../utils/response');
const audioUtil = require('../utils/audio');
const config = require('../config');

const musicController = {
  async uploadMusic(req, res, next) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('请选择要上传的音频文件');
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;

      if (!audioUtil.isValidAudioFile(originalName)) {
        fs.unlinkSync(filePath);
        throw ApiError.badRequest(
          `不支持的音频格式，支持的格式：${config.upload.allowedTypes.join('、')}`
        );
      }

      const audioInfo = await audioUtil.parseAudioFile(filePath);

      const music = await Music.create({
        user_id: req.userId,
        title: audioInfo.title,
        artist: audioInfo.artist,
        album: audioInfo.album,
        duration: audioInfo.duration,
        format: audioInfo.format,
        file_size: audioInfo.fileSize,
        file_path: filePath,
        file_name: originalName,
        mime_type: audioInfo.mimeType,
        bit_rate: audioInfo.bitRate,
        sample_rate: audioInfo.sampleRate,
      });

      const result = formatMusicInfo(music);

      Response.success(res, result, '上传成功', 201);
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  },

  async getMusicList(req, res, next) {
    try {
      const { page = 1, pageSize = 10, keyword = '', sortBy = 'created_at', order = 'DESC' } = req.query;

      const where = {
        user_id: req.userId,
        status: 1,
      };

      if (keyword) {
        where.$or = [
          { title: { $like: `%${keyword}%` } },
          { artist: { $like: `%${keyword}%` } },
          { album: { $like: `%${keyword}%` } },
        ];
      }

      const { count, rows } = await Music.findAndCountAll({
        where,
        order: [[sortBy, order]],
        offset: (page - 1) * pageSize,
        limit: parseInt(pageSize, 10),
      });

      const list = rows.map(music => formatMusicInfo(music));

      Response.paginate(res, list, count, parseInt(page, 10), parseInt(pageSize, 10));
    } catch (error) {
      next(error);
    }
  },

  async getMusicDetail(req, res, next) {
    try {
      const { id } = req.params;

      const music = await Music.findOne({
        where: { id, user_id: req.userId, status: 1 },
      });

      if (!music) {
        throw ApiError.notFound('音乐不存在');
      }

      const result = formatMusicInfo(music, true);

      Response.success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async playMusic(req, res, next) {
    try {
      const { id } = req.params;

      const music = await Music.findOne({
        where: { id, user_id: req.userId, status: 1 },
      });

      if (!music) {
        throw ApiError.notFound('音乐不存在');
      }

      const filePath = music.file_path;

      if (!fs.existsSync(filePath)) {
        throw ApiError.notFound('音频文件不存在');
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      const mimeType = audioUtil.getAudioMimeType(music.format);

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const file = fs.createReadStream(filePath, { start, end });

        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
        };

        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      next(error);
    }
  },

  async deleteMusic(req, res, next) {
    try {
      const { id } = req.params;

      const music = await Music.findOne({
        where: { id, user_id: req.userId },
      });

      if (!music) {
        throw ApiError.notFound('音乐不存在');
      }

      if (fs.existsSync(music.file_path)) {
        fs.unlinkSync(music.file_path);
      }

      await Music.destroy({ where: { id } });

      Response.success(res, null, '删除成功');
    } catch (error) {
      next(error);
    }
  },

  async batchDeleteMusic(req, res, next) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw ApiError.badRequest('请选择要删除的音乐');
      }

      const musics = await Music.findAll({
        where: {
          id: ids,
          user_id: req.userId,
        },
      });

      for (const music of musics) {
        if (fs.existsSync(music.file_path)) {
          fs.unlinkSync(music.file_path);
        }
      }

      await Music.destroy({
        where: {
          id: ids,
          user_id: req.userId,
        },
      });

      Response.success(res, null, `成功删除 ${musics.length} 个音乐文件`);
    } catch (error) {
      next(error);
    }
  },

  async getStatistics(req, res, next) {
    try {
      const count = await Music.count({
        where: { user_id: req.userId, status: 1 },
      });

      const musics = await Music.findAll({
        where: { user_id: req.userId, status: 1 },
        attributes: ['file_size', 'duration'],
      });

      let totalSize = 0;
      let totalDuration = 0;

      for (const music of musics) {
        totalSize += parseInt(music.file_size || 0, 10);
        totalDuration += parseInt(music.duration || 0, 10);
      }

      Response.success(res, {
        totalCount: count,
        totalSize,
        totalSizeFormatted: audioUtil.formatFileSize(totalSize),
        totalDuration,
        totalDurationFormatted: formatDuration(totalDuration),
      }, '获取成功');
    } catch (error) {
      next(error);
    }
  },
};

function formatMusicInfo(music, includePath = false) {
  const info = {
    id: music.id,
    title: music.title,
    artist: music.artist,
    album: music.album,
    duration: music.duration,
    durationFormatted: audioUtil.formatDuration(music.duration),
    format: music.format,
    fileSize: music.file_size,
    fileSizeFormatted: audioUtil.formatFileSize(music.file_size),
    mimeType: music.mime_type,
    bitRate: music.bit_rate,
    sampleRate: music.sample_rate,
    createdAt: music.created_at,
    updatedAt: music.updated_at,
  };

  if (includePath) {
    info.filePath = music.file_path;
    info.fileName = music.file_name;
  }

  return info;
}

function formatDuration(seconds) {
  if (!seconds) return '0 秒';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分 ${secs} 秒`;
  } else if (minutes > 0) {
    return `${minutes} 分 ${secs} 秒`;
  } else {
    return `${secs} 秒`;
  }
}

module.exports = musicController;
