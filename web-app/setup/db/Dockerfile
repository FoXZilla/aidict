# 使用官方的 MySQL 镜像
FROM mysql:5.7

# 设置环境变量
ENV MYSQL_ROOT_PASSWORD=123456
ENV MYSQL_DATABASE=ai_dictionary

# 将初始化脚本添加到 Docker 容器中
ADD init.sql /docker-entrypoint-initdb.d