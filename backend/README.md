# 🎵 音乐管理系统后端服务

基于 Node.js + Express + MySQL + JWT 实现的音乐管理系统后端服务。

## ✨ 功能特性

### 用户管理
- 用户注册、登录、退出
- JWT 身份认证
- 用户信息管理
- 密码修改

### 音乐管理
- 音频文件上传
- 音乐列表查询
- 音乐详情获取
- 音乐在线播放（支持断点续传）
- 音乐删除
- 批量删除
- 音乐统计信息

### 音频解析
- 自动解析歌曲名称、艺术家、专辑
- 自动获取音频时长、格式、文件大小
- 支持多种音频格式：MP3、WAV、OGG、M4A、FLAC、AAC

### 异常处理
- 统一的错误响应格式
- 上传失败错误提示
- 格式不支持错误提示
- 文件不存在错误提示
- 参数验证错误提示

## 🛠️ 技术栈

- **Node.js** - 服务端运行环境
- **Express** - Web 应用框架
- **MySQL** - 关系型数据库
- **Sequelize** - ORM 框架
- **JWT** - 身份认证
- **Multer** - 文件上传
- **music-metadata** - 音频元数据解析
- **bcryptjs** - 密码加密
- **CORS** - 跨域支持

## 📦 项目结构

```
backend/
├── config/
│   ├── index.js          # 配置文件
│   └── database.js       # 数据库配置
├── controllers/
│   ├── authController.js   # 用户认证控制器
│   └── musicController.js # 音乐管理控制器
├── middleware/
│   ├── auth.js           # JWT 认证中间件
│   ├── upload.js         # 文件上传中间件
│   └── error.js          # 错误处理中间件
├── models/
│   ├── index.js          # 模型关联
│   ├── User.js           # 用户模型
│   └── Music.js          # 音乐模型
├── routes/
│   ├── auth.js           # 用户认证路由
│   └── music.js          # 音乐管理路由
├── scripts/
│   └── init-db.js       # 数据库初始化脚本
├── utils/
│   ├── ApiError.js       # 自定义错误类
│   ├── audio.js          # 音频处理工具
│   ├── jwt.js            # JWT 工具
│   └── response.js       # 响应格式化工具
├── uploads/               # 上传文件目录（运行时创建）
├── .env                   # 环境变量配置
├── .gitignore
├── app.js                 # 应用入口
├── package.json
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7
- npm 或 yarn

### 安装步骤

1. **进入后端目录**
   ```bash
   cd backend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   
   编辑 `.env` 文件，根据实际情况修改数据库配置：
   ```env
   PORT=3000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=123456
   DB_NAME=music_db

   JWT_SECRET=music-server-secret-key-2024
   JWT_EXPIRES_IN=7d

   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=20971520
   ALLOWED_AUDIO_TYPES=mp3,wav,ogg,m4a,flac,aac
   ```

4. **创建数据库**
   
   在 MySQL 中创建数据库：
   ```sql
   CREATE DATABASE music_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **初始化数据库**
   ```bash
   npm run init-db
   ```
   
   该命令会自动创建数据表和默认管理员账户。

6. **启动服务**
   ```bash
   # 生产模式
   npm start

   # 开发模式（需要 nodemon）
   npm run dev
   ```

   服务将在 `http://localhost:3000` 启动。

### 默认账户

- 用户名：`admin`
- 密码：`admin123`

## 📡 API 接口

### 统一响应格式

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {}
}
```

- `code`: 状态码，0 表示成功，其他表示失败
- `message`: 提示信息
- `data`: 响应数据

### 错误响应格式

```json
{
  "code": 400,
  "message": "错误信息",
  "errors": null
}
```

### 用户认证接口

#### 1. 用户注册

- **接口**: `POST /api/auth/register`
- **是否需要登录**: 否
- **请求参数**:
  ```json
  {
    "username": "testuser",
    "password": "123456",
    "email": "test@example.com",
    "nickname": "测试用户"
  }
  ```
- **响应示例**:
  ```json
  {
    "code": 0,
    "message": "注册成功",
    "data": {
      "user": {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com",
        "nickname": "测试用户",
        "avatar": null,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### 2. 用户登录

- **接口**: `POST /api/auth/login`
- **是否需要登录**: 否
- **请求参数**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **响应示例**:
  ```json
  {
    "code": 0,
    "message": "登录成功",
    "data": {
      "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "nickname": "管理员",
        "avatar": null
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### 3. 用户退出

- **接口**: `POST /api/auth/logout`
- **是否需要登录**: 是
- **请求头**: `Authorization: Bearer <token>`

#### 4. 获取当前用户信息

- **接口**: `GET /api/auth/profile`
- **是否需要登录**: 是

#### 5. 更新用户信息

- **接口**: `PUT /api/auth/profile`
- **是否需要登录**: 是
- **请求参数**:
  ```json
  {
    "nickname": "新昵称",
    "email": "new@example.com"
  }
  ```

#### 6. 修改密码

- **接口**: `POST /api/auth/change-password`
- **是否需要登录**: 是
- **请求参数**:
  ```json
  {
    "oldPassword": "旧密码",
    "newPassword": "新密码"
  }
  ```

### 音乐管理接口

#### 1. 上传音乐

- **接口**: `POST /api/music/upload`
- **是否需要登录**: 是
- **Content-Type**: `multipart/form-data`
- **请求参数**:
  - `music`: 音频文件（表单字段）
- **响应示例**:
  ```json
  {
    "code": 0,
    "message": "上传成功",
    "data": {
      "id": 1,
      "title": "歌曲名称",
      "artist": "艺术家",
      "album": "专辑",
      "duration": 240,
      "durationFormatted": "4:00",
      "format": "mp3",
      "fileSize": 5242880,
      "fileSizeFormatted": "5 MB",
      "mimeType": "audio/mpeg",
      "bitRate": 320000,
      "sampleRate": 44100,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 2. 获取音乐列表

- **接口**: `GET /api/music`
- **是否需要登录**: 是
- **请求参数**:
  - `page`: 页码，默认 1
  - `pageSize`: 每页数量，默认 10
  - `keyword`: 搜索关键词（可选）
  - `sortBy`: 排序字段，默认 `created_at`
  - `order`: 排序方式，默认 `DESC`
- **响应示例**:
  ```json
  {
    "code": 0,
    "message": "操作成功",
    "data": {
      "list": [...],
      "total": 100,
      "page": 1,
      "pageSize": 10,
      "totalPages": 10
    }
  }
  ```

#### 3. 获取音乐详情

- **接口**: `GET /api/music/:id`
- **是否需要登录**: 是

#### 4. 播放音乐

- **接口**: `GET /api/music/:id/play`
- **是否需要登录**: 是
- **说明**: 支持断点续传（Range 请求头）

#### 5. 删除音乐

- **接口**: `DELETE /api/music/:id`
- **是否需要登录**: 是

#### 6. 批量删除音乐

- **接口**: `POST /api/music/batch-delete`
- **是否需要登录**: 是
- **请求参数**:
  ```json
  {
    "ids": [1, 2, 3]
  }
  ```

#### 7. 获取音乐统计

- **接口**: `GET /api/music/statistics`
- **是否需要登录**: 是
- **响应示例**:
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "totalCount": 50,
      "totalSize": 1073741824,
      "totalSizeFormatted": "1 GB",
      "totalDuration": 86400,
      "totalDurationFormatted": "24 小时"
    }
  }
  ```

### 其他接口

#### 健康检查

- **接口**: `GET /health`
- **是否需要登录**: 否

## 🔐 认证方式

所有需要登录的接口，需要在请求头中携带 JWT Token：

```
Authorization: Bearer <your-token>
```

或者通过 URL 参数传递：

```
GET /api/music?token=<your-token>
```

## 📝 错误码说明

| 状态码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 / 登录已过期 |
| 403 | 没有权限访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| DB_HOST | 数据库地址 | localhost |
| DB_PORT | 数据库端口 | 3306 |
| DB_USER | 数据库用户名 | root |
| DB_PASSWORD | 数据库密码 | 123456 |
| DB_NAME | 数据库名 | music_db |
| JWT_SECRET | JWT 密钥 | music-server-secret-key |
| JWT_EXPIRES_IN | Token 有效期 | 7d |
| UPLOAD_DIR | 上传目录 | uploads |
| MAX_FILE_SIZE | 最大文件大小（字节） | 20971520 (20MB) |
| ALLOWED_AUDIO_TYPES | 允许的音频格式 | mp3,wav,ogg,m4a,flac,aac |

## 🧪 测试

可以使用 Postman 或 curl 进行接口测试。

### 测试示例：

```bash
# 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 获取音乐列表
curl -X GET http://localhost:3000/api/music \
  -H "Authorization: Bearer <your-token>"

# 上传音乐
curl -X POST http://localhost:3000/api/music/upload \
  -H "Authorization: Bearer <your-token>" \
  -F "music=@/path/to/song.mp3"
```

## 📄 许可证

MIT License
