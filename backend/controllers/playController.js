const { PlayHistory, PlayState, Music } = require('../models');
const ApiError = require('../utils/ApiError');
const Response = require('../utils/response');
const audioUtil = require('../utils/audio');

class PlayController {
  static async savePlayHistory(req, res, next) {
    try {
      const userId = req.userId;
      const { music_id, progress } = req.body;

      if (!music_id) {
        throw ApiError.badRequest('音乐ID不能为空');
      }

      const music = await Music.findOne({ where: { id: music_id, user_id: userId } });
      if (!music) {
        throw ApiError.notFound('音乐不存在');
      }

      const history = await PlayHistory.create({
        user_id: userId,
        music_id,
        progress: progress || 0,
        played_at: new Date(),
      });

      Response.success(res, history);
    } catch (error) {
      next(error);
    }
  }

  static async getPlayHistory(req, res, next) {
    try {
      const userId = req.userId;
      const { limit = 50, page = 1 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await PlayHistory.findAndCountAll({
        where: { user_id: userId },
        include: [{
          model: Music,
          as: 'music',
          attributes: ['id', 'title', 'artist', 'album', 'duration', 'format', 'file_size', 'bit_rate'],
          where: { status: 1 },
          required: false,
        }],
        order: [['played_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const list = rows.map(item => {
        const musicData = item.music ? {
          id: item.music.id,
          title: item.music.title,
          artist: item.music.artist,
          album: item.music.album,
          duration: item.music.duration,
          durationFormatted: audioUtil.formatDuration(item.music.duration),
          format: item.music.format,
          fileSize: item.music.file_size,
          fileSizeFormatted: audioUtil.formatFileSize(item.music.file_size),
          bitRate: item.music.bit_rate,
          url: `/api/music/${item.music.id}/play`,
          isLocal: false,
        } : null;

        return {
          id: item.id,
          music_id: item.music_id,
          progress: item.progress,
          played_at: item.played_at,
          music: musicData,
        };
      });

      Response.success(res, {
        list,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(limit),
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearPlayHistory(req, res, next) {
    try {
      const userId = req.userId;

      await PlayHistory.destroy({ where: { user_id: userId } });

      Response.success(res, { message: '历史记录已清空' });
    } catch (error) {
      next(error);
    }
  }

  static async savePlayState(req, res, next) {
    try {
      const userId = req.userId;
      const {
        current_music_id,
        current_index,
        is_playing,
        progress,
        volume,
        play_mode,
        queue,
        recent_play,
      } = req.body;

      const [state, created] = await PlayState.findOrCreate({
        where: { user_id: userId },
        defaults: {
          user_id: userId,
          current_music_id,
          current_index: current_index !== undefined ? current_index : -1,
          is_playing: is_playing !== undefined ? is_playing : false,
          progress: progress !== undefined ? progress : 0,
          volume: volume !== undefined ? volume : 70,
          play_mode: play_mode || 'sequence',
          queue: queue ? JSON.stringify(queue) : null,
          recent_play: recent_play ? JSON.stringify(recent_play) : null,
          updated_at: new Date(),
        },
      });

      if (!created) {
        const updateData = {
          updated_at: new Date(),
        };
        if (current_music_id !== undefined) updateData.current_music_id = current_music_id;
        if (current_index !== undefined) updateData.current_index = current_index;
        if (is_playing !== undefined) updateData.is_playing = is_playing;
        if (progress !== undefined) updateData.progress = progress;
        if (volume !== undefined) updateData.volume = volume;
        if (play_mode !== undefined) updateData.play_mode = play_mode;
        if (queue !== undefined) updateData.queue = JSON.stringify(queue);
        if (recent_play !== undefined) updateData.recent_play = JSON.stringify(recent_play);

        await state.update(updateData);
      }

      Response.success(res, { message: '播放状态已保存' });
    } catch (error) {
      next(error);
    }
  }

  static async getPlayState(req, res, next) {
    try {
      const userId = req.userId;

      const state = await PlayState.findOne({
        where: { user_id: userId },
      });

      if (!state) {
        return Response.success(res, {
          current_music_id: null,
          current_index: -1,
          is_playing: false,
          progress: 0,
          volume: 70,
          play_mode: 'sequence',
          queue: [],
          recent_play: [],
          updated_at: null,
        });
      }

      Response.success(res, {
        current_music_id: state.current_music_id,
        current_index: state.current_index,
        is_playing: state.is_playing,
        progress: state.progress,
        volume: state.volume,
        play_mode: state.play_mode,
        queue: state.queue ? JSON.parse(state.queue) : [],
        recent_play: state.recent_play ? JSON.parse(state.recent_play) : [],
        updated_at: state.updated_at,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PlayController;
