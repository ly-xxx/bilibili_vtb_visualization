# 构建和部署指南

## 本地构建

### 1. 准备环境

```bash
# 安装 Node.js（建议版本 14+）
node --version

# 安装项目依赖
npm install
```

### 2. 获取数据

```bash
# 方式 A：从零开始爬取所有数据（耗时很长）
npm run crawler

# 方式 B：仅更新今日数据
node update_today.js
```

### 3. 启动本地服务器

```bash
npm run serve
# 或
npx http-server

# 在浏览器中打开 http://localhost:8080
```

## 部署选项

### 选项 1: GitHub Pages（推荐用于静态网站）

#### 前置条件
- GitHub 账户
- 项目已托管在 GitHub

#### 部署步骤

1. **在项目根目录创建 `.github/workflows/deploy.yml`**:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
```

2. **在 `package.json` 中添加**:
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/vtuber-fan-chart",
  "scripts": {
    "predeploy": "npm run crawler",
    "deploy": "gh-pages -d ."
  }
}
```

3. **推送到 GitHub**:
```bash
git push origin main
```

### 选项 2: Vercel（支持动态更新）

#### 前置条件
- Vercel 账户
- 项目托管在 GitHub

#### 部署步骤

1. **访问** [vercel.com](https://vercel.com)
2. **点击 "New Project"**
3. **导入你的 GitHub 仓库**
4. **配置环境变量**（如需要）
5. **点击 Deploy**

#### API 路由设置（可选）

创建 `api/update.js` 用于定时更新：

```javascript
export default async (req, res) => {
  try {
    const { exec } = require('child_process');
    exec('node update_today.js', (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(200).json({ message: 'Updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 选项 3: 自有服务器

#### 使用 PM2 进程管理

```bash
# 安装 PM2
npm install -g pm2

# 创建 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vtuber-chart',
    script: './update_today.js',
    cron_restart: '0 0 * * *',  // 每天午夜运行
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

#### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 选项 4: Docker 容器化

#### 创建 `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "run", "serve"]
```

#### 创建 `docker-compose.yml`

```yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data.csv:/app/data.csv
    environment:
      - NODE_ENV=production
```

#### 运行容器

```bash
docker-compose up -d
```

## 数据更新策略

### 方案 1: 手动更新

```bash
npm run crawler
```

### 方案 2: 定时更新（每日）

使用系统 cron（Linux/Mac）:
```bash
crontab -e

# 添加每天午夜运行
0 0 * * * cd /path/to/project && npm run update-today
```

Windows 任务计划器：
1. 打开 "任务计划程序"
2. 创建基本任务
3. 设置时间触发器为每日
4. 操作为执行 `node update_today.js`

### 方案 3: Webhook 更新

创建更新端点并设置 GitHub Webhook：

```javascript
// server.js
const express = require('express');
const { exec } = require('child_process');
const app = express();

app.post('/webhook/update', (req, res) => {
  exec('npm run update-today', (error, stdout) => {
    if (error) return res.status(500).send(error);
    res.status(200).json({ message: 'Updated' });
  });
});

app.listen(3000);
```

## 性能监控

### 监控数据爬虫

```javascript
// 在 crawler.js 中添加性能统计
const startTime = Date.now();
// ... 爬虫代码 ...
const duration = (Date.now() - startTime) / 1000;
console.log(`Crawling completed in ${duration.toFixed(2)}s`);
```

### 监控前端加载

使用 Google Analytics 或类似服务追踪用户访问。

## 故障恢复

### 备份数据

```bash
# 定期备份 CSV 文件
cp data.csv data.backup.$(date +%Y%m%d).csv
```

### 清理旧数据

```bash
# 保留最近 30 天的备份
find . -name "data.backup.*" -mtime +30 -delete
```

## 常见部署问题

### 问题 1: 跨域问题

**解决方案**: 使用本地服务器或配置 CORS

### 问题 2: 数据过大

**解决方案**: 启用 gzip 压缩，使用 `bake.js` 优化数据

### 问题 3: 爬虫超时

**解决方案**: 增加 `DELAY_MS` 参数

## 安全建议

1. **不提交敏感信息**: 使用 `.gitignore` 排除配置文件
2. **定期更新依赖**: `npm audit`, `npm update`
3. **使用环境变量**: 存储 API 密钥和敏感配置
4. **启用 HTTPS**: 在生产环境中使用 SSL/TLS

## 版本管理

```bash
# 标记发布版本
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# 在 package.json 中更新版本号
npm version minor  # 1.0.0 -> 1.1.0
npm version patch  # 1.0.0 -> 1.0.1
```

---

需要帮助？提交 Issue 或查看 [CONTRIBUTING.md](CONTRIBUTING.md)！
