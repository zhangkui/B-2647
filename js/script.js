const API_BASE = '/api';

class ApiService {
    static getToken() {
        return localStorage.getItem('token');
    }

    static setToken(token) {
        localStorage.setItem('token', token);
    }

    static removeToken() {
        localStorage.removeItem('token');
    }

    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static removeUser() {
        localStorage.removeItem('user');
    }

    static async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(API_BASE + url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (data.code !== 0) {
            if (data.code === 401) {
                this.removeToken();
                this.removeUser();
                if (!url.includes('/login') && !url.includes('/register')) {
                    window.dispatchEvent(new CustomEvent('auth:expired'));
                }
            }
            throw new Error(data.message || '请求失败');
        }

        return data.data;
    }

    static async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        this.setToken(data.token);
        this.setUser(data.user);

        return data;
    }

    static async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        this.setToken(data.token);
        this.setUser(data.user);

        return data;
    }

    static async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
            });
        } finally {
            this.removeToken();
            this.removeUser();
        }
    }

    static async getProfile() {
        return this.request('/auth/profile');
    }

    static async getMusicList(page = 1, pageSize = 100) {
        return this.request(`/music?page=${page}&pageSize=${pageSize}&sortBy=created_at&order=DESC`);
    }

    static async uploadMusic(file, onProgress) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('music', file);

            const xhr = new XMLHttpRequest();
            const token = this.getToken();

            xhr.open('POST', API_BASE + '/music/upload');

            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    onProgress(percent);
                }
            };

            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (data.code === 0) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.message || '上传失败'));
                    }
                } catch (e) {
                    reject(new Error('上传失败'));
                }
            };

            xhr.onerror = () => {
                reject(new Error('网络错误，上传失败'));
            };

            xhr.send(formData);
        });
    }

    static async deleteMusic(id) {
        return this.request(`/music/${id}`, {
            method: 'DELETE',
        });
    }

    static async getMusicStats() {
        return this.request('/music/statistics');
    }

    static getMusicPlayUrl(id) {
        const token = this.getToken();
        return `${API_BASE}/music/${id}/play?token=${encodeURIComponent(token || '')}`;
    }

    static async savePlayHistory(musicId, progress) {
        return this.request('/play/history', {
            method: 'POST',
            body: JSON.stringify({ music_id: musicId, progress }),
        });
    }

    static async getPlayHistory(page = 1, limit = 50) {
        return this.request(`/play/history?page=${page}&limit=${limit}`);
    }

    static async clearPlayHistory() {
        return this.request('/play/history', {
            method: 'DELETE',
        });
    }

    static async savePlayState(state) {
        return this.request('/play/state', {
            method: 'POST',
            body: JSON.stringify(state),
        });
    }

    static async getPlayState() {
        return this.request('/play/state');
    }

    static getLocalPlayState() {
        const state = localStorage.getItem('playState');
        return state ? JSON.parse(state) : null;
    }

    static setLocalPlayState(state) {
        localStorage.setItem('playState', JSON.stringify(state));
    }

    static removeLocalPlayState() {
        localStorage.removeItem('playState');
    }
}

class MusicPlayer {
    constructor() {
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
        this.queueList = document.getElementById('queueList');
        this.recentList = document.getElementById('recentList');
        this.queueCount = document.getElementById('queueCount');
        this.fileInput = document.getElementById('fileInput');
        this.toast = document.getElementById('toast');

        this.playlistStats = document.getElementById('playlistStats');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressText = document.getElementById('progressText');
        this.progressBarFill = document.getElementById('progressBarFill');
        this.musicInfoCard = document.getElementById('musicInfoCard');

        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.clearQueueBtn = document.getElementById('clearQueueBtn');
        this.clearRecentBtn = document.getElementById('clearRecentBtn');

        this.songs = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isDragging = false;

        this.currentMusicInfo = null;

        this.playMode = 'sequence';
        this.playQueue = [];
        this.recentPlay = [];
        this.shuffleOrder = [];
        this.shuffleIndex = -1;

        this.stateSyncTimer = null;
        this.historySyncTimer = null;

        this.init();
    }

    async init() {
        this.audio.volume = this.volumeSlider.value / 100;
        this.bindEvents();
        await this.loadMusicList();
        await this.syncStateFromServer();
        this.startStateSyncTimer();
    }

    bindEvents() {
        this.centerPlayBtn.addEventListener('click', () => this.togglePlay());
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('error', (e) => this.handleError(e));
        this.audio.addEventListener('play', () => this.syncStateToStorage());
        this.audio.addEventListener('pause', () => this.syncStateToStorage());

        this.progressBar.addEventListener('mousedown', (e) => this.startDrag(e));
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());

        this.progressBar.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.drag(e.touches[0]);
            }
        });
        document.addEventListener('touchend', () => this.stopDrag());

        this.volumeSlider.addEventListener('input', () => {
            this.updateVolume();
            this.syncStateToStorage();
        });
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setPlayMode(btn.dataset.mode));
        });

        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        this.clearQueueBtn.addEventListener('click', () => this.clearQueue());
        this.clearRecentBtn.addEventListener('click', () => this.clearRecent());

        window.addEventListener('beforeunload', () => this.syncStateToServer());
        window.addEventListener('focus', () => this.syncStateFromServer());
    }

    setPlayMode(mode) {
        this.playMode = mode;
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        const modeNames = {
            sequence: '顺序播放',
            loop: '列表循环',
            single: '单曲循环',
            shuffle: '随机播放'
        };
        this.showToast(`已切换为${modeNames[mode]}`);
        if (mode === 'shuffle') {
            this.generateShuffleOrder();
        }
        this.syncStateToStorage();
    }

    generateShuffleOrder() {
        this.shuffleOrder = Array.from({ length: this.songs.length }, (_, i) => i);
        for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
        }
        this.shuffleIndex = this.shuffleOrder.indexOf(this.currentIndex);
        if (this.shuffleIndex === -1) {
            this.shuffleIndex = 0;
        }
    }

    switchTab(tab) {
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tab}`);
        });
        if (tab === 'queue') {
            this.updateQueueUI();
        } else if (tab === 'recent') {
            this.updateRecentUI();
        }
    }

    addToQueue(song) {
        const exists = this.playQueue.find(s => s.id === song.id);
        if (exists) {
            this.showToast('该歌曲已在队列中');
            return;
        }
        this.playQueue.push({ ...song, addedAt: Date.now() });
        this.updateQueueCount();
        this.syncStateToStorage();
        this.showToast(`已添加到播放队列: ${song.title}`);
    }

    removeFromQueue(index) {
        this.playQueue.splice(index, 1);
        this.updateQueueCount();
        this.updateQueueUI();
        this.syncStateToStorage();
    }

    moveQueueItem(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.playQueue.length) return;
        [this.playQueue[index], this.playQueue[newIndex]] = [this.playQueue[newIndex], this.playQueue[index]];
        this.updateQueueUI();
        this.syncStateToStorage();
    }

    clearQueue() {
        if (this.playQueue.length === 0) {
            this.showToast('播放队列为空');
            return;
        }
        if (!confirm('确定要清空播放队列吗？')) return;
        this.playQueue = [];
        this.updateQueueCount();
        this.updateQueueUI();
        this.syncStateToStorage();
        this.showToast('播放队列已清空');
    }

    updateQueueCount() {
        this.queueCount.textContent = this.playQueue.length;
    }

    updateQueueUI() {
        this.queueList.innerHTML = '';
        if (this.playQueue.length === 0) {
            this.queueList.innerHTML = '<div style="text-align: center; padding: 30px; color: #999;">播放队列为空，点击歌曲右侧的"+"按钮添加</div>';
            return;
        }
        this.playQueue.forEach((song, index) => {
            const item = this.createPlaylistItem(song, -1, 'queue', index);
            this.queueList.appendChild(item);
        });
    }

    addToRecent(song) {
        const existsIndex = this.recentPlay.findIndex(s => s.id === song.id);
        if (existsIndex !== -1) {
            this.recentPlay.splice(existsIndex, 1);
        }
        this.recentPlay.unshift({
            ...song,
            playedAt: Date.now()
        });
        if (this.recentPlay.length > 50) {
            this.recentPlay = this.recentPlay.slice(0, 50);
        }
        this.syncStateToStorage();
        this.syncHistoryToServer(song.id, this.audio.currentTime);
    }

    clearRecent() {
        if (this.recentPlay.length === 0) {
            this.showToast('最近播放记录为空');
            return;
        }
        if (!confirm('确定要清空最近播放记录吗？')) return;
        this.recentPlay = [];
        this.updateRecentUI();
        this.syncStateToStorage();
        ApiService.clearPlayHistory().catch(() => {});
        this.showToast('最近播放记录已清空');
    }

    updateRecentUI() {
        this.recentList.innerHTML = '';
        if (this.recentPlay.length === 0) {
            this.recentList.innerHTML = '<div style="text-align: center; padding: 30px; color: #999;">暂无播放记录</div>';
            return;
        }
        this.recentPlay.forEach((song, index) => {
            const item = this.createPlaylistItem(song, this.currentIndex, 'recent', index);
            this.recentList.appendChild(item);
        });
    }

    formatRecentTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;

        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    createPlaylistItem(song, currentIndex, listType = 'playlist', itemIndex = 0) {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        if (this.currentIndex >= 0 && this.songs[this.currentIndex]?.id === song.id) {
            item.classList.add('active');
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'playlist-item-info';

        const title = document.createElement('div');
        title.className = 'playlist-item-title';
        if (listType === 'playlist') {
            title.textContent = `${itemIndex + 1}. ${song.title}`;
        } else {
            title.textContent = song.title;
        }

        const meta = document.createElement('div');
        meta.className = 'playlist-item-meta';
        const artist = song.artist || '未知艺术家';
        const duration = song.durationFormatted || '--:--';
        meta.textContent = `${artist} · ${duration}`;

        infoDiv.appendChild(title);
        infoDiv.appendChild(meta);

        if (listType === 'recent' && song.playedAt) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'recent-time';
            timeDiv.textContent = this.formatRecentTime(song.playedAt);
            infoDiv.appendChild(timeDiv);
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'playlist-item-actions';

        if (listType === 'playlist') {
            const addQueueBtn = document.createElement('button');
            addQueueBtn.className = 'add-queue-btn';
            addQueueBtn.textContent = '+队列';
            addQueueBtn.title = '添加到播放队列';
            addQueueBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToQueue(song);
            });
            actionsDiv.appendChild(addQueueBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'playlist-item-delete';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSong(itemIndex);
            });
            actionsDiv.appendChild(deleteBtn);
        } else if (listType === 'queue') {
            const queueActions = document.createElement('div');
            queueActions.className = 'queue-item-actions';

            const moveUpBtn = document.createElement('button');
            moveUpBtn.className = 'queue-move-btn';
            moveUpBtn.innerHTML = '↑';
            moveUpBtn.disabled = itemIndex === 0;
            moveUpBtn.title = '上移';
            moveUpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveQueueItem(itemIndex, -1);
            });
            queueActions.appendChild(moveUpBtn);

            const moveDownBtn = document.createElement('button');
            moveDownBtn.className = 'queue-move-btn';
            moveDownBtn.innerHTML = '↓';
            moveDownBtn.disabled = itemIndex === this.playQueue.length - 1;
            moveDownBtn.title = '下移';
            moveDownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveQueueItem(itemIndex, 1);
            });
            queueActions.appendChild(moveDownBtn);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'queue-remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.title = '从队列移除';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromQueue(itemIndex);
            });
            queueActions.appendChild(removeBtn);

            actionsDiv.appendChild(queueActions);
        }

        item.appendChild(infoDiv);
        item.appendChild(actionsDiv);

        item.addEventListener('click', () => {
            const songIndex = this.songs.findIndex(s => s.id === song.id);
            if (songIndex !== -1) {
                this.playSong(songIndex);
            } else {
                this.showToast('歌曲不存在');
            }
        });

        return item;
    }

    async syncStateFromServer() {
        try {
            const state = await ApiService.getPlayState();
            if (state) {
                this.applyPlayState(state);
            }
        } catch (error) {
            const localState = ApiService.getLocalPlayState();
            if (localState) {
                this.applyPlayState(localState);
            }
        }
    }

    applyPlayState(state) {
        if (state.play_mode) {
            this.playMode = state.play_mode;
            this.modeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === state.play_mode);
            });
        }
        if (state.queue && Array.isArray(state.queue)) {
            this.playQueue = state.queue;
            this.updateQueueCount();
        }
        if (state.recent_play && Array.isArray(state.recent_play)) {
            this.recentPlay = state.recent_play;
        }
        if (state.volume !== undefined && state.volume !== null) {
            this.volumeSlider.value = state.volume;
            this.updateVolume();
        }
        if (state.current_music_id && this.songs.length > 0) {
            const songIndex = this.songs.findIndex(s => s.id === state.current_music_id);
            if (songIndex !== -1) {
                this.currentIndex = songIndex;
                const song = this.songs[songIndex];
                this.audio.src = song.url;
                this.songTitle.textContent = song.title;
                this.currentMusicInfo = song;
                this.showMusicInfo(song);
                this.updatePlaylistUI();
                if (state.progress > 0) {
                    this.audio.currentTime = state.progress;
                }
                if (state.is_playing) {
                    this.play();
                } else {
                    this.updatePlayButton(false);
                }
            }
        }
        if (this.playMode === 'shuffle') {
            this.generateShuffleOrder();
        }
    }

    syncStateToStorage() {
        const state = {
            current_music_id: this.currentIndex >= 0 ? this.songs[this.currentIndex]?.id : null,
            current_index: this.currentIndex,
            is_playing: this.isPlaying,
            progress: this.audio.currentTime,
            volume: parseInt(this.volumeSlider.value),
            play_mode: this.playMode,
            queue: this.playQueue,
            recent_play: this.recentPlay,
        };
        ApiService.setLocalPlayState(state);
    }

    async syncStateToServer() {
        const state = {
            current_music_id: this.currentIndex >= 0 ? this.songs[this.currentIndex]?.id : null,
            current_index: this.currentIndex,
            is_playing: this.isPlaying,
            progress: this.audio.currentTime,
            volume: parseInt(this.volumeSlider.value),
            play_mode: this.playMode,
            queue: this.playQueue,
            recent_play: this.recentPlay,
        };
        try {
            await ApiService.savePlayState(state);
        } catch (error) {
            console.error('同步状态到服务器失败:', error);
        }
    }

    async syncHistoryToServer(musicId, progress) {
        try {
            await ApiService.savePlayHistory(musicId, progress);
        } catch (error) {
            console.error('同步历史到服务器失败:', error);
        }
    }

    startStateSyncTimer() {
        if (this.stateSyncTimer) {
            clearInterval(this.stateSyncTimer);
        }
        this.stateSyncTimer = setInterval(() => {
            this.syncStateToStorage();
            this.syncStateToServer();
        }, 30000);
    }

    async loadMusicList() {
        try {
            const result = await ApiService.getMusicList(1, 100);
            this.songs = result.list.map(item => ({
                ...item,
                url: ApiService.getMusicPlayUrl(item.id),
                isLocal: false,
            }));
            if (this.playMode === 'shuffle') {
                this.generateShuffleOrder();
            }
            this.updatePlaylistUI();
        } catch (error) {
            this.showToast(error.message || '加载音乐列表失败');
        }
    }

    async handleFileSelect(e) {
        const files = Array.from(e.target.files);

        if (files.length === 0) return;

        for (const file of files) {
            if (!file.type.startsWith('audio/')) {
                this.showToast(`${file.name} 不是有效的音频文件`);
                continue;
            }

            try {
                await this.uploadFile(file);
            } catch (error) {
                this.showToast(`${file.name} 上传失败: ${error.message}`);
            }
        }

        e.target.value = '';
        await this.loadMusicList();
    }

    async uploadFile(file) {
        return new Promise((resolve, reject) => {
            this.showUploadProgress();
            this.updateProgressText(`正在上传: ${file.name}`);

            ApiService.uploadMusic(file, (percent) => {
                this.updateProgressBar(percent);
                this.updateProgressText(`正在上传: ${file.name} (${percent}%)`);
            }).then((data) => {
                this.hideUploadProgress();
                this.showToast(`上传成功: ${data.title}`);
                resolve(data);
            }).catch((error) => {
                this.hideUploadProgress();
                reject(error);
            });
        });
    }

    showUploadProgress() {
        this.uploadProgress.style.display = 'block';
        this.updateProgressBar(0);
    }

    hideUploadProgress() {
        this.uploadProgress.style.display = 'none';
    }

    updateProgressText(text) {
        this.progressText.textContent = text;
    }

    updateProgressBar(percent) {
        this.progressBarFill.style.width = percent + '%';
    }

    togglePlay() {
        if (this.songs.length === 0) {
            this.showToast('请先上传音乐文件');
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

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton(false);
        this.vinylRecord.classList.remove('playing');
        this.tonearm.classList.remove('playing');
    }

    playSong(index) {
        if (index < 0 || index >= this.songs.length) return;

        this.currentIndex = index;
        const song = this.songs[index];

        this.audio.src = song.url;
        this.songTitle.textContent = song.title;
        this.currentMusicInfo = song;
        this.showMusicInfo(song);
        this.addToRecent(song);
        this.updatePlaylistUI();
        this.updateQueueUI();
        this.updateRecentUI();
        this.play();
        this.syncStateToStorage();
    }

    showMusicInfo(song) {
        document.getElementById('infoTitle').textContent = song.title || '-';
        document.getElementById('infoArtist').textContent = song.artist || '-';
        document.getElementById('infoAlbum').textContent = song.album || '-';
        document.getElementById('infoDuration').textContent = song.durationFormatted || '-';
        document.getElementById('infoFormat').textContent = song.format ? song.format.toUpperCase() : '-';
        document.getElementById('infoSize').textContent = song.fileSizeFormatted || '-';
        document.getElementById('infoBitRate').textContent = song.bitRate ? (song.bitRate / 1000).toFixed(0) + ' kbps' : '-';

        this.musicInfoCard.style.display = 'block';
    }

    playPrevious() {
        if (this.songs.length === 0) return;

        if (this.playQueue.length > 0) {
            this.showToast('队列模式下请使用下一曲');
            return;
        }

        let newIndex;

        if (this.playMode === 'shuffle') {
            this.shuffleIndex--;
            if (this.shuffleIndex < 0) {
                this.shuffleIndex = this.shuffleOrder.length - 1;
            }
            newIndex = this.shuffleOrder[this.shuffleIndex];
        } else {
            newIndex = this.currentIndex - 1;
            if (newIndex < 0) {
                if (this.playMode === 'sequence') {
                    this.showToast('已经是第一首了');
                    return;
                }
                newIndex = this.songs.length - 1;
            }
        }

        this.playSong(newIndex);
    }

    playNext() {
        if (this.songs.length === 0) return;

        if (this.playQueue.length > 0) {
            const nextSong = this.playQueue.shift();
            this.updateQueueCount();
            this.updateQueueUI();
            const songIndex = this.songs.findIndex(s => s.id === nextSong.id);
            if (songIndex !== -1) {
                this.playSong(songIndex);
                return;
            }
        }

        let newIndex;

        if (this.playMode === 'single') {
            this.audio.currentTime = 0;
            this.play();
            return;
        }

        if (this.playMode === 'shuffle') {
            this.shuffleIndex++;
            if (this.shuffleIndex >= this.shuffleOrder.length) {
                if (this.playMode === 'sequence') {
                    this.showToast('播放列表已播放完毕');
                    this.pause();
                    return;
                }
                this.generateShuffleOrder();
                this.shuffleIndex = 0;
            }
            newIndex = this.shuffleOrder[this.shuffleIndex];
        } else {
            newIndex = this.currentIndex + 1;
            if (newIndex >= this.songs.length) {
                if (this.playMode === 'sequence') {
                    this.showToast('播放列表已播放完毕');
                    this.pause();
                    return;
                }
                newIndex = 0;
            }
        }

        this.playSong(newIndex);
    }

    handleSongEnd() {
        if (this.currentIndex >= 0) {
            const currentSong = this.songs[this.currentIndex];
            if (currentSong) {
                this.syncHistoryToServer(currentSong.id, this.audio.duration || 0);
            }
        }
        this.playNext();
    }

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

    updateProgress() {
        if (this.isDragging) return;

        const progress = (this.audio.currentTime / this.audio.duration) * 100 || 0;
        this.progressFill.style.width = progress + '%';
        this.progressThumb.style.left = progress + '%';

        this.currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.durationDisplay.textContent = this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    startDrag(e) {
        this.isDragging = true;
        this.seek(e);
    }

    drag(e) {
        if (!this.isDragging) return;
        this.seek(e);
    }

    stopDrag() {
        this.isDragging = false;
    }

    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, offsetX / rect.width));

        this.audio.currentTime = progress * this.audio.duration;

        const percentage = progress * 100;
        this.progressFill.style.width = percentage + '%';
        this.progressThumb.style.left = percentage + '%';
    }

    updateVolume() {
        const volume = this.volumeSlider.value / 100;
        this.audio.volume = volume;
        this.volumeValue.textContent = this.volumeSlider.value + '%';
    }

    updatePlaylistUI() {
        this.playlist.innerHTML = '';
        this.playlistStats.textContent = `共 ${this.songs.length} 首`;

        if (this.songs.length === 0) {
            this.playlist.innerHTML = '<div style="text-align: center; padding: 30px; color: #999;">暂无音乐，请上传音乐文件</div>';
            return;
        }

        this.songs.forEach((song, index) => {
            const item = this.createPlaylistItem(song, this.currentIndex, 'playlist', index);
            this.playlist.appendChild(item);
        });
    }

    async deleteSong(index) {
        const song = this.songs[index];

        try {
            await ApiService.deleteMusic(song.id);

            this.playQueue = this.playQueue.filter(s => s.id !== song.id);
            this.recentPlay = this.recentPlay.filter(s => s.id !== song.id);
            this.updateQueueCount();

            if (index === this.currentIndex) {
                this.pause();

                if (this.songs.length > 1) {
                    const nextIndex = index >= this.songs.length - 1 ? 0 : index;
                    this.songs.splice(index, 1);
                    this.currentIndex = nextIndex >= this.songs.length ? this.songs.length - 1 : nextIndex;
                    if (this.currentIndex >= 0) {
                        this.playSong(this.currentIndex);
                    } else {
                        this.currentIndex = -1;
                        this.songTitle.textContent = '未播放';
                        this.audio.src = '';
                        this.musicInfoCard.style.display = 'none';
                    }
                } else {
                    this.songs = [];
                    this.currentIndex = -1;
                    this.songTitle.textContent = '未播放';
                    this.audio.src = '';
                    this.musicInfoCard.style.display = 'none';
                }
            } else {
                this.songs.splice(index, 1);

                if (index < this.currentIndex) {
                    this.currentIndex--;
                }
            }

            if (this.playMode === 'shuffle') {
                this.generateShuffleOrder();
            }

            this.updatePlaylistUI();
            this.updateQueueUI();
            this.updateRecentUI();
            this.syncStateToStorage();
            this.showToast('删除成功');
        } catch (error) {
            this.showToast(error.message || '删除失败');
        }
    }

    handleKeyboard(e) {
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

    handleError(e) {
        console.error('音频错误:', e);
        let errorMsg = '播放出错';

        if (this.audio.error) {
            switch (this.audio.error.code) {
                case 1:
                    errorMsg = '音频加载被中止';
                    break;
                case 2:
                    errorMsg = '网络错误，请检查网络连接';
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

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    refresh() {
        const wasPlaying = this.isPlaying;
        const currentSongId = this.currentIndex >= 0 ? this.songs[this.currentIndex]?.id : null;
        const currentProgress = this.audio.currentTime;

        this.loadMusicList().then(() => {
            if (currentSongId) {
                const newIndex = this.songs.findIndex(s => s.id === currentSongId);
                if (newIndex >= 0) {
                    this.currentIndex = newIndex;
                    this.audio.src = this.songs[newIndex].url;
                    this.audio.currentTime = currentProgress;
                    if (wasPlaying) {
                        this.play();
                    }
                }
            }
            this.syncStateFromServer();
            this.showToast('刷新成功');
        });
    }

    reset() {
        try {
            if (this.stateSyncTimer) {
                clearInterval(this.stateSyncTimer);
                this.stateSyncTimer = null;
            }

            if (this.audio) {
                this.audio.pause();
                this.audio.src = '';
                this.audio.currentTime = 0;
                this.audio.load();
            }

            this.isPlaying = false;
            this.currentIndex = -1;
            this.songs = [];
            this.currentMusicInfo = null;
            this.playMode = 'sequence';
            this.playQueue = [];
            this.recentPlay = [];
            this.shuffleOrder = [];
            this.shuffleIndex = -1;

            const buttons = [this.centerPlayBtn, this.playBtn];
            buttons.forEach(btn => {
                const playIcon = btn.querySelector('.play-icon');
                const pauseIcon = btn.querySelector('.pause-icon');
                if (playIcon) playIcon.style.display = 'block';
                if (pauseIcon) pauseIcon.style.display = 'none';
            });

            if (this.vinylRecord) {
                this.vinylRecord.classList.remove('playing');
            }
            if (this.tonearm) {
                this.tonearm.classList.remove('playing');
            }

            if (this.songTitle) {
                this.songTitle.textContent = '未播放';
            }

            if (this.progressFill) {
                this.progressFill.style.width = '0%';
            }
            if (this.progressThumb) {
                this.progressThumb.style.left = '0%';
            }
            if (this.currentTimeDisplay) {
                this.currentTimeDisplay.textContent = '0:00';
            }
            if (this.durationDisplay) {
                this.durationDisplay.textContent = '0:00';
            }

            if (this.musicInfoCard) {
                this.musicInfoCard.style.display = 'none';
            }

            if (this.modeButtons) {
                this.modeButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.mode === 'sequence');
                });
            }

            this.updateQueueCount();
            this.updatePlaylistUI();
            this.updateQueueUI();
            this.updateRecentUI();

            ApiService.removeLocalPlayState();
        } catch (e) {
            console.error('重置播放器失败:', e);
        }
    }
}

class AuthManager {
    constructor() {
        this.authContainer = document.getElementById('authContainer');
        this.mainContainer = document.getElementById('mainContainer');
        this.authTabs = document.querySelectorAll('.auth-tab');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');

        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.goToRegister = document.getElementById('goToRegister');
        this.goToLogin = document.getElementById('goToLogin');

        this.userName = document.getElementById('userName');
        this.userEmail = document.getElementById('userEmail');
        this.userAvatar = document.getElementById('userAvatar');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.statsBtn = document.getElementById('statsBtn');
        this.statsModal = document.getElementById('statsModal');
        this.closeStats = document.getElementById('closeStats');

        this.player = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();

        window.addEventListener('auth:expired', () => {
            this.showToast('登录已过期，请重新登录');
            this.showAuth();
        });
    }

    bindEvents() {
        this.authTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        this.goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('register');
        });

        this.goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('login');
        });

        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.registerBtn.addEventListener('click', () => this.handleRegister());

        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());
        this.statsBtn.addEventListener('click', () => this.handleStats());
        this.closeStats.addEventListener('click', () => this.hideStats());

        ['loginUsername', 'loginPassword'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        });

        ['regUsername', 'regPassword', 'regConfirmPassword', 'regEmail', 'regNickname'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleRegister();
            });
        });

        this.statsModal.addEventListener('click', (e) => {
            if (e.target === this.statsModal) this.hideStats();
        });
    }

    switchTab(tab) {
        this.authTabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        this.loginForm.classList.remove('active');
        this.registerForm.classList.remove('active');

        if (tab === 'login') {
            this.loginForm.classList.add('active');
        } else {
            this.registerForm.classList.add('active');
        }
    }

    async checkAuth() {
        const token = ApiService.getToken();
        const user = ApiService.getUser();

        if (token && user) {
            try {
                await ApiService.getProfile();
                this.showMain(user);
            } catch (error) {
                ApiService.removeToken();
                ApiService.removeUser();
                this.showAuth();
            }
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        this.authContainer.style.display = 'flex';
        this.mainContainer.style.display = 'none';

        this.resetPlayerState();
        ApiService.removeLocalPlayState();

        this.clearAuthForms();
    }

    showMain(user) {
        this.authContainer.style.display = 'none';
        this.mainContainer.style.display = 'block';

        this.updateUserInfo(user);

        if (!this.player) {
            this.player = new MusicPlayer();
            window.musicPlayer = this.player;
        } else {
            this.player.reset();
            this.player.loadMusicList().then(() => {
                this.player.syncStateFromServer();
                this.player.startStateSyncTimer();
            });
        }
    }

    resetPlayerState() {
        if (this.player) {
            try {
                if (this.player.stateSyncTimer) {
                    clearInterval(this.player.stateSyncTimer);
                    this.player.stateSyncTimer = null;
                }

                if (this.player.audio) {
                    this.player.audio.pause();
                    this.player.audio.src = '';
                    this.player.audio.currentTime = 0;
                    this.player.audio.load();
                }

                this.player.isPlaying = false;
                this.player.currentIndex = -1;
                this.player.songs = [];
                this.player.currentMusicInfo = null;
                this.player.playMode = 'sequence';
                this.player.playQueue = [];
                this.player.recentPlay = [];
                this.player.shuffleOrder = [];
                this.player.shuffleIndex = -1;

                const playBtns = [this.player.centerPlayBtn, this.player.playBtn];
                playBtns.forEach(btn => {
                    const playIcon = btn.querySelector('.play-icon');
                    const pauseIcon = btn.querySelector('.pause-icon');
                    if (playIcon) playIcon.style.display = 'block';
                    if (pauseIcon) pauseIcon.style.display = 'none';
                });

                if (this.player.vinylRecord) {
                    this.player.vinylRecord.classList.remove('playing');
                }
                if (this.player.tonearm) {
                    this.player.tonearm.classList.remove('playing');
                }

                if (this.player.songTitle) {
                    this.player.songTitle.textContent = '未播放';
                }

                if (this.player.progressFill) {
                    this.player.progressFill.style.width = '0%';
                }
                if (this.player.progressThumb) {
                    this.player.progressThumb.style.left = '0%';
                }
                if (this.player.currentTimeDisplay) {
                    this.player.currentTimeDisplay.textContent = '0:00';
                }
                if (this.player.durationDisplay) {
                    this.player.durationDisplay.textContent = '0:00';
                }

                if (this.player.musicInfoCard) {
                    this.player.musicInfoCard.style.display = 'none';
                }

                if (this.player.modeButtons) {
                    this.player.modeButtons.forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.mode === 'sequence');
                    });
                }

                this.player.updateQueueCount();
                this.player.updatePlaylistUI();
                this.player.updateQueueUI();
                this.player.updateRecentUI();
            } catch (e) {
                console.error('重置播放器状态时出错:', e);
            }
        }
    }

    clearAuthForms() {
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regConfirmPassword').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regNickname').value = '';
    }

    updateUserInfo(user) {
        this.userName.textContent = user.nickname || user.username;
        this.userEmail.textContent = user.email || '';
        this.userAvatar.textContent = (user.nickname || user.username).charAt(0).toUpperCase();
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showToast('请输入用户名和密码');
            return;
        }

        this.setButtonLoading(this.loginBtn, true);

        try {
            const data = await ApiService.login(username, password);
            this.showToast('登录成功');
            this.showMain(data.user);
        } catch (error) {
            this.showToast(error.message || '登录失败');
        } finally {
            this.setButtonLoading(this.loginBtn, false);
        }
    }

    async handleRegister() {
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const email = document.getElementById('regEmail').value.trim();
        const nickname = document.getElementById('regNickname').value.trim();

        if (!username || !password || !confirmPassword) {
            this.showToast('请填写必填项');
            return;
        }

        if (username.length < 3 || username.length > 20) {
            this.showToast('用户名长度需在3-20个字符之间');
            return;
        }

        if (password.length < 6) {
            this.showToast('密码长度不能少于6位');
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('两次输入的密码不一致');
            return;
        }

        this.setButtonLoading(this.registerBtn, true);

        try {
            const data = await ApiService.register({
                username,
                password,
                email: email || null,
                nickname: nickname || null,
            });
            this.showToast('注册成功');
            this.showMain(data.user);
        } catch (error) {
            this.showToast(error.message || '注册失败');
        } finally {
            this.setButtonLoading(this.registerBtn, false);
        }
    }

    async handleLogout() {
        if (!confirm('确定要退出登录吗？')) return;

        try {
            await ApiService.logout();
            this.showToast('已退出登录');
            this.showAuth();
        } catch (error) {
            this.showToast(error.message || '退出失败');
        }
    }

    handleRefresh() {
        if (this.player) {
            this.player.refresh();
        }
    }

    async handleStats() {
        try {
            const stats = await ApiService.getMusicStats();
            document.getElementById('statCount').textContent = stats.totalCount;
            document.getElementById('statSize').textContent = stats.totalSizeFormatted;
            document.getElementById('statDuration').textContent = stats.totalDurationFormatted;
            this.statsModal.style.display = 'flex';
        } catch (error) {
            this.showToast(error.message || '获取统计信息失败');
        }
    }

    hideStats() {
        this.statsModal.style.display = 'none';
    }

    setButtonLoading(btn, loading) {
        if (loading) {
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.dataset.originalText = originalText;
            btn.innerHTML = '<span class="loading"></span>处理中...';
        } else {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText || btn.textContent;
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();
    window.authManager = authManager;
});
