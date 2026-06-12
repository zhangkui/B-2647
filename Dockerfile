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
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    # 添加CORS支持 \
    add_header Access-Control-Allow-Origin *; \
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS"; \
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range"; \
}' > /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
