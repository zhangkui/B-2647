# 🎵 黑胶唱片音乐播放器

一款功能完整、界面精美的纯HTML音乐播放器应用，采用黑胶唱片风格设计，支持本地文件和网络音频播放。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

## ✨ 功能特性

### 核心功能
- 🎼 **本地音乐播放** - 支持通过文件选择器导入本地音频文件
- 🌐 **网络音乐播放** - 支持添加URL播放网络音频资源
- ⏯️ **完整播放控制** - 播放/暂停、上一曲/下一曲、音量调节
- 📊 **进度控制** - 显示当前播放进度及总时长，支持进度条拖拽定位
- 📝 **播放列表管理** - 添加、删除、切换歌曲

### 视觉设计
- 💿 **黑胶唱片效果** - 模拟真实黑胶唱片的视觉效果
- 🔄 **旋转动画** - 播放时唱片平滑旋转，暂停时立即停止
- 🎨 **现代UI设计** - 简洁美观的界面，具有立体感和质感
- 🎯 **响应式布局** - 完美适配各种设备屏幕

### 用户体验
- ⌨️ **键盘快捷键** - 空格键播放/暂停，方向键控制进度和音量
- 💡 **加载提示** - 友好的加载状态和错误提示
- 📱 **触摸支持** - 支持移动设备触摸操作
- 🎯 **自动播放** - 歌曲结束自动播放下一曲

## 🎮 键盘快捷键

| 按键 | 功能 |
|------|------|
| `空格` | 播放/暂停 |
| `←` | 后退5秒 |
| `→` | 前进5秒 |
| `↑` | 音量+10% |
| `↓` | 音量-10% |

## 🚀 快速开始

### 方法一：直接使用（推荐体验）

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd label-2647
   ```

2. **直接打开**
   - 双击 `index.html` 文件即可在浏览器中运行
   - 或使用任意HTTP服务器：
     ```bash
     # Python 3
     python -m http.server 8080
     
     # Node.js (需要先安装 http-server: npm install -g http-server)
     http-server -p 8080
     ```

3. **访问应用**
   - 浏览器访问：`http://localhost:8080`

### 方法二：使用Docker（推荐部署）

#### 前置要求
- Docker
- Docker Compose（可选）

#### 使用Docker Compose启动

1. **构建并启动容器**
   ```bash
   docker-compose up -d
   ```

2. **访问应用**
   - 浏览器访问：`http://localhost:8080`

3. **停止应用**
   ```bash
   docker-compose down
   ```

#### 使用Docker命令启动

1. **构建镜像**
   ```bash
   docker build -t vinyl-music-player .
   ```

2. **运行容器**
   ```bash
   docker run -d -p 8080:80 --name music-player vinyl-music-player
   ```

3. **停止容器**
   ```bash
   docker stop music-player
   docker rm music-player
   ```

## 📖 使用指南

### 添加本地音乐
1. 点击「📁 选择本地文件」按钮
2. 在文件选择器中选择一个或多个音频文件
3. 支持的格式：MP3、WAV、OGG、M4A等

### 添加网络音乐
1. 点击「🌐 添加网络音乐」按钮
2. 在弹出的对话框中输入音乐URL
3. （可选）输入歌曲标题
4. 点击「确定」添加

**示例URL：**
```
https://example.com/music/song.mp3
```

### 播放控制
- **播放/暂停**：点击唱片中心按钮或下方播放按钮
- **切换歌曲**：点击播放列表中的歌曲，或使用上一曲/下一曲按钮
- **调整进度**：点击或拖拽进度条
- **调整音量**：拖动音量滑块

### 管理播放列表
- **删除歌曲**：点击播放列表中歌曲右侧的「删除」按钮
- **当前播放**：正在播放的歌曲会高亮显示

## 🏗️ 项目结构

```
label-2647/
├── css/
│   └── style.css           # 样式文件
├── js/
│   └── script.js           # JavaScript逻辑
├── index.html              # 主HTML文件
├── Dockerfile              # Docker镜像配置
├── docker-compose.yml      # Docker Compose配置
├── .dockerignore           # Docker忽略文件
└── README.md               # 项目说明文档
```

## 🛠️ 技术栈

- **HTML5** - 页面结构和Audio API
- **CSS3** - 样式设计和动画效果
- **原生JavaScript** - 业务逻辑实现
- **Docker** - 容器化部署
- **Nginx** - Web服务器

## 🎨 核心技术实现

### 黑胶唱片旋转动画
```css
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.vinyl-record.playing {
    animation: spin 3s linear infinite;
}
```

### HTML5 Audio API
```javascript
const audio = new Audio();
audio.src = 'music.mp3';
audio.play();
audio.addEventListener('timeupdate', updateProgress);
```

### 进度条拖拽
- 支持鼠标拖拽和触摸操作
- 实时更新播放进度
- 平滑的视觉反馈

## 🌟 特色亮点

1. **零依赖** - 纯原生技术实现，无需任何第三方库
2. **高性能** - CSS动画优化，流畅的60fps体验
3. **易部署** - Docker一键部署，开箱即用
4. **响应式** - 完美适配手机、平板、电脑
5. **可扩展** - 清晰的代码结构，易于二次开发

## 📱 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 47+

## 🔧 开发调试

### 打开开发者工具
在浏览器中按 `F12` 打开开发者工具，可以：
- 查看控制台日志
- 调试JavaScript代码
- 检查网络请求
- 查看播放器实例：`window.musicPlayer`

### 常见问题

**Q: 网络音乐无法播放？**
- 确保URL可访问
- 检查目标服务器是否支持CORS
- 某些音频资源可能有防盗链限制

**Q: 本地文件无法播放？**
- 确保文件格式受浏览器支持
- 检查文件是否损坏

**Q: Docker容器无法访问？**
- 检查端口是否被占用：`netstat -ano | findstr :8080`
- 确保Docker服务正常运行
- 查看容器日志：`docker logs music-player`

## 📝 更新日志

### v1.0.0 (2026-02-09)
- ✨ 初始版本发布
- 🎵 支持本地和网络音乐播放
- 💿 黑胶唱片视觉效果
- 🔄 旋转动画实现
- ⌨️ 键盘快捷键支持
- 🐳 Docker部署支持

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 LICENSE 文件

## 👨‍💻 作者

由AI辅助开发，专注于提供优质的开源项目。

## 🙏 致谢

感谢所有为开源社区做出贡献的开发者！

---

**如果这个项目对你有帮助，请给一个⭐️Star支持一下！**

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件反馈

---

**享受音乐，享受生活！🎵**
