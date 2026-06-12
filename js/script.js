// 音乐播放器类
class MusicPlayer {
    constructor() {
        // DOM元素
        this.audio = document.getElementById('audioPlayer');
        this.vinylRecord = document.getElementById('vinylRecord');
        this.tonearm = document.getElementById('tonearm');
        this.centerPlayBtn = document.getElementById('centerPlayBtn');
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressThumb = document.getElementById('progressThumb');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.durationDisplay = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.songTitle = document.getElementById('songTitle');
        this.playlist = document.getElementById('playlist');
        this.fileInput = document.getElementById('fileInput');
        this.urlBtn = document.getElementById('urlBtn');
        this.urlModal = document.getElementById('urlModal');
        this.urlInput = document.getElementById('urlInput');
        this.urlTitle = document.getElementById('urlTitle');
        this.urlConfirm = document.getElementById('urlConfirm');
        this.urlCancel = document.getElementById('urlCancel');
        this.toast = document.getElementById('toast');

        // 播放列表数据
        this.songs = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isDragging = false;

        // 初始化
        this.init();
    }

    init() {
        // 设置初始音量
        this.audio.volume = this.volumeSlider.value / 100;

        // 绑定事件
        this.bindEvents();

        // 显示欢迎提示
        this.showToast('欢迎使用黑胶唱片播放器 🎵');
    }

    bindEvents() {
        // 播放/暂停按钮
        this.centerPlayBtn.addEventListener('click', () => this.togglePlay());
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // 上一曲/下一曲
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());

        // 音频事件
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('error', (e) => this.handleError(e));
        this.audio.addEventListener('loadstart', () => this.handleLoadStart());
        this.audio.addEventListener('canplay', () => this.handleCanPlay());

        // 进度条拖拽
        this.progressBar.addEventListener('mousedown', (e) => this.startDrag(e));
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());

        // 触摸事件支持
        this.progressBar.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.drag(e.touches[0]);
            }
        });
        document.addEventListener('touchend', () => this.stopDrag());

        // 音量控制
        this.volumeSlider.addEventListener('input', () => this.updateVolume());

        // 文件导入
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // URL导入
        this.urlBtn.addEventListener('click', () => this.showUrlModal());
        this.urlConfirm.addEventListener('click', () => this.addUrlSong());
        this.urlCancel.addEventListener('click', () => this.hideUrlModal());
        
        // URL输入框回车确认
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addUrlSong();
        });
        
        this.urlTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addUrlSong();
        });

        // 模态框背景点击关闭
        this.urlModal.addEventListener('click', (e) => {
            if (e.target === this.urlModal) this.hideUrlModal();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // 播放/暂停切换
    togglePlay() {
        if (this.songs.length === 0) {
            this.showToast('请先添加音乐文件');
            return;
        }

        if (this.currentIndex === -1) {
            this.playSong(0);
            return;
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    // 播放
    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton(true);
            this.vinylRecord.classList.add('playing');
            this.tonearm.classList.add('playing');
        }).catch(err => {
            console.error('播放失败:', err);
            this.showToast('播放失败，请检查音频文件');
        });
    }

    // 暂停
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton(false);
        this.vinylRecord.classList.remove('playing');
        this.tonearm.classList.remove('playing');
    }

    // 播放指定歌曲
    playSong(index) {
        if (index < 0 || index >= this.songs.length) return;

        this.currentIndex = index;
        const song = this.songs[index];
        
        this.audio.src = song.url;
        this.songTitle.textContent = song.title;
        this.updatePlaylistUI();
        this.play();
    }

    // 上一曲
    playPrevious() {
        if (this.songs.length === 0) return;
        
        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) {
            newIndex = this.songs.length - 1;
        }
        this.playSong(newIndex);
    }

    // 下一曲
    playNext() {
        if (this.songs.length === 0) return;
        
        let newIndex = this.currentIndex + 1;
        if (newIndex >= this.songs.length) {
            newIndex = 0;
        }
        this.playSong(newIndex);
    }

    // 歌曲结束处理
    handleSongEnd() {
        // 自动播放下一曲
        this.playNext();
    }

    // 更新播放按钮状态
    updatePlayButton(playing) {
        const buttons = [this.centerPlayBtn, this.playBtn];
        buttons.forEach(btn => {
            const playIcon = btn.querySelector('.play-icon');
            const pauseIcon = btn.querySelector('.pause-icon');
            
            if (playing) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        });
    }

    // 更新进度
    updateProgress() {
        if (this.isDragging) return;

        const progress = (this.audio.currentTime / this.audio.duration) * 100 || 0;
        this.progressFill.style.width = progress + '%';
        this.progressThumb.style.left = progress + '%';
        
        this.currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
    }

    // 更新时长
    updateDuration() {
        this.durationDisplay.textContent = this.formatTime(this.audio.duration);
    }

    // 格式化时间
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 开始拖拽
    startDrag(e) {
        this.isDragging = true;
        this.seek(e);
    }

    // 拖拽中
    drag(e) {
        if (!this.isDragging) return;
        this.seek(e);
    }

    // 停止拖拽
    stopDrag() {
        this.isDragging = false;
    }

    // 进度条点击/拖拽定位
    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, offsetX / rect.width));
        
        this.audio.currentTime = progress * this.audio.duration;
        
        const percentage = progress * 100;
        this.progressFill.style.width = percentage + '%';
        this.progressThumb.style.left = percentage + '%';
    }

    // 更新音量
    updateVolume() {
        const volume = this.volumeSlider.value / 100;
        this.audio.volume = volume;
        this.volumeValue.textContent = this.volumeSlider.value + '%';
    }

    // 处理文件选择
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;

        files.forEach(file => {
            if (!file.type.startsWith('audio/')) {
                this.showToast(`${file.name} 不是有效的音频文件`);
                return;
            }

            const song = {
                title: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
                url: URL.createObjectURL(file),
                isLocal: true
            };

            this.songs.push(song);
        });

        this.updatePlaylistUI();
        this.showToast(`成功添加 ${files.length} 首歌曲`);

        // 如果是第一次添加且未播放，自动播放第一首
        if (this.currentIndex === -1 && this.songs.length > 0) {
            this.playSong(0);
        }

        // 清空文件输入，允许重复选择相同文件
        e.target.value = '';
    }

    // 显示URL模态框
    showUrlModal() {
        this.urlModal.style.display = 'flex';
        this.urlInput.value = '';
        this.urlTitle.value = '';
        this.urlInput.focus();
    }

    // 隐藏URL模态框
    hideUrlModal() {
        this.urlModal.style.display = 'none';
    }

    // 添加URL歌曲
    addUrlSong() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showToast('请输入音乐URL');
            return;
        }

        // 简单的URL验证
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            this.showToast('请输入有效的URL（以http://或https://开头）');
            return;
        }

        const title = this.urlTitle.value.trim() || this.extractFilenameFromUrl(url);

        const song = {
            title: title,
            url: url,
            isLocal: false
        };

        this.songs.push(song);
        this.updatePlaylistUI();
        this.hideUrlModal();
        this.showToast('网络音乐已添加');

        // 如果是第一次添加且未播放，自动播放第一首
        if (this.currentIndex === -1) {
            this.playSong(this.songs.length - 1);
        }
    }

    // 从URL提取文件名
    extractFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            return decodeURIComponent(filename) || '网络音乐';
        } catch {
            return '网络音乐';
        }
    }

    // 更新播放列表UI
    updatePlaylistUI() {
        this.playlist.innerHTML = '';

        if (this.songs.length === 0) {
            this.playlist.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">播放列表为空</div>';
            return;
        }

        this.songs.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === this.currentIndex) {
                item.classList.add('active');
            }

            const title = document.createElement('div');
            title.className = 'playlist-item-title';
            title.textContent = `${index + 1}. ${song.title}`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'playlist-item-delete';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSong(index);
            });

            item.appendChild(title);
            item.appendChild(deleteBtn);

            item.addEventListener('click', () => {
                this.playSong(index);
            });

            this.playlist.appendChild(item);
        });
    }

    // 删除歌曲
    deleteSong(index) {
        const song = this.songs[index];
        
        // 如果是本地文件，释放URL对象
        if (song.isLocal) {
            URL.revokeObjectURL(song.url);
        }

        // 如果删除的是正在播放的歌曲
        if (index === this.currentIndex) {
            this.pause();
            
            // 如果还有其他歌曲，播放下一首
            if (this.songs.length > 1) {
                const nextIndex = index >= this.songs.length - 1 ? 0 : index;
                this.songs.splice(index, 1);
                this.currentIndex = nextIndex >= this.songs.length ? this.songs.length - 1 : nextIndex;
                this.playSong(this.currentIndex);
            } else {
                // 没有其他歌曲了
                this.songs = [];
                this.currentIndex = -1;
                this.songTitle.textContent = '未播放';
                this.audio.src = '';
            }
        } else {
            // 删除的不是当前播放的歌曲
            this.songs.splice(index, 1);
            
            // 调整当前索引
            if (index < this.currentIndex) {
                this.currentIndex--;
            }
        }

        this.updatePlaylistUI();
        this.showToast('已删除');
    }

    // 键盘快捷键
    handleKeyboard(e) {
        // 如果在输入框中，不响应快捷键
        if (e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.volumeSlider.value = Math.min(100, parseInt(this.volumeSlider.value) + 10);
                this.updateVolume();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.volumeSlider.value = Math.max(0, parseInt(this.volumeSlider.value) - 10);
                this.updateVolume();
                break;
        }
    }

    // 加载开始
    handleLoadStart() {
        this.showToast('正在加载音乐...');
    }

    // 可以播放
    handleCanPlay() {
        // 加载完成后自动隐藏提示
    }

    // 错误处理
    handleError(e) {
        console.error('音频错误:', e);
        let errorMsg = '播放出错';
        
        if (this.audio.error) {
            switch (this.audio.error.code) {
                case 1:
                    errorMsg = '音频加载被中止';
                    break;
                case 2:
                    errorMsg = '网络错误';
                    break;
                case 3:
                    errorMsg = '音频解码失败';
                    break;
                case 4:
                    errorMsg = '不支持的音频格式';
                    break;
            }
        }
        
        this.showToast(errorMsg);
        this.pause();
    }

    // 显示提示
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// 页面加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
    
    // 将播放器实例挂载到window对象，方便调试
    window.musicPlayer = player;
});
