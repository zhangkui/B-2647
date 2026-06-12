const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const Response = require('../utils/response');
const jwtUtil = require('../utils/jwt');

const authController = {
  async register(req, res, next) {
    try {
      const { username, password, email, nickname } = req.body;

      if (!username || !password) {
        throw ApiError.badRequest('用户名和密码不能为空');
      }

      if (username.length < 3 || username.length > 20) {
        throw ApiError.badRequest('用户名长度需在3-20个字符之间');
      }

      if (password.length < 6) {
        throw ApiError.badRequest('密码长度不能少于6位');
      }

      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        throw ApiError.conflict('用户名已存在');
      }

      if (email) {
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
          throw ApiError.conflict('邮箱已被注册');
        }
      }

      const user = await User.create({
        username,
        password,
        email: email || null,
        nickname: nickname || username,
      });

      const token = jwtUtil.generateToken({
        userId: user.id,
        username: user.username,
      });

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.created_at,
      };

      Response.success(res, {
        user: userData,
        token,
      }, '注册成功', 201);
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw ApiError.badRequest('用户名和密码不能为空');
      }

      const user = await User.findOne({ where: { username } });
      if (!user) {
        throw ApiError.unauthorized('用户名或密码错误');
      }

      if (user.status !== 1) {
        throw ApiError.forbidden('账户已被禁用');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw ApiError.unauthorized('用户名或密码错误');
      }

      const token = jwtUtil.generateToken({
        userId: user.id,
        username: user.username,
      });

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
      };

      Response.success(res, {
        user: userData,
        token,
      }, '登录成功');
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      Response.success(res, null, '退出成功');
    } catch (error) {
      next(error);
    }
  },

  async getCurrentUser(req, res, next) {
    try {
      const user = req.user;

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.created_at,
      };

      Response.success(res, userData, '获取成功');
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { nickname, email } = req.body;
      const user = req.user;

      const updateData = {};
      if (nickname) updateData.nickname = nickname;
      if (email) updateData.email = email;

      if (email) {
        const existingEmail = await User.findOne({
          where: { email, id: { $ne: user.id } },
        });
        if (existingEmail) {
          throw ApiError.conflict('邮箱已被使用');
        }
      }

      await User.update(updateData, { where: { id: user.id } });
      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
      });

      Response.success(res, updatedUser, '更新成功');
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = req.user;

      if (!oldPassword || !newPassword) {
        throw ApiError.badRequest('旧密码和新密码不能为空');
      }

      if (newPassword.length < 6) {
        throw ApiError.badRequest('新密码长度不能少于6位');
      }

      const isPasswordValid = await user.comparePassword(oldPassword);
      if (!isPasswordValid) {
        throw ApiError.badRequest('旧密码错误');
      }

      await User.update(
        { password: newPassword },
        { where: { id: user.id } }
      );

      Response.success(res, null, '密码修改成功');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
