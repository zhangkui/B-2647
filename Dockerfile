# 使用nginx作为基础镜像
FROM nginx:alpine

# 将应用文件复制到nginx的html目录
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

# 创建自定义nginx配置
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
        proxy_pass http://music-server:3000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_connect_timeout 300s; \
        proxy_send_timeout 300s; \
        proxy_read_timeout 300s; \
        client_max_body_size 50M; \
    } \
    \
    location /health { \
        proxy_pass http://music-server:3000/health; \
        proxy_set_header Host $host; \
    } \
    \
    add_header Access-Control-Allow-Origin *; \
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"; \
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"; \
    add_header Access-Control-Expose-Headers "Content-Length,Content-Range"; \
    \
    if ($request_method = OPTIONS) { \
        return 204; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
