# VTuber 粉丝数变化动态排行榜

这是一个完整的虚拟主播粉丝数可视化项目，包含数据爬取和前端动态图表展示。

## 项目结构

```
├── package.json          # 项目配置
├── crawler.js            # 数据爬取脚本
├── index.html            # 前端可视化页面
├── data.csv              # 生成的数据文件（运行爬虫后）
└── README.md             # 本文档
```

## 快速开始

### 1. 环境准备

确保已安装 Node.js 和 npm。在项目目录中打开终端，执行：

```bash
npm install
```

这将安装 `axios` 库用于数据爬取。

### 2. 运行爬虫脚本获取数据

执行以下命令开始爬取数据：

```bash
npm run crawler
```

或直接：

```bash
node crawler.js
```

**脚本会：**
- 从 `https://api.vtbs.moe/v1/short` 获取所有虚拟主播列表
- 逐个获取每位主播从 2021-06-01 开始的粉丝历史数据
- 每天保留一条粉丝数记录（去重）
- 生成 `data.csv` 文件

**预计耗时：** 由于 API 限制和礼貌延迟（200ms），获取所有主播数据需要较长时间。可根据需要修改 `crawler.js` 中的 `DELAY_MS` 和 `START_TIME`。

### 3. 启动本地服务器

使用本地服务器打开 `index.html`（防止跨域问题）：

#### 方式 A：使用内置 http-server（推荐）

```bash
npm run serve
```

然后在浏览器中打开 `http://localhost:8080`

#### 方式 B：使用 VSCode Live Server 扩展

- 在 VSCode 中安装 `Live Server` 扩展
- 右键点击 `index.html` 并选择 "Open with Live Server"

#### 方式 C：Python 简易服务器

```bash
python -m http.server 8000
```

然后打开 `http://localhost:8000`

### 4. 查看可视化

打开上述任一地址后，你将看到：

- **顶部（600px）：** Top 1-30 的动态条形图
- **底部左上（480×480）：** Top 31-50
- **底部右上（480×480）：** Top 51-70
- **底部左下（480×480）：** Top 71-90
- **底部右下（480×480）：** Top 91-110

图表会根据日期动态更新，展示粉丝数变化排名。

## 自定义配置

### 修改爬虫时间范围

在 `crawler.js` 中修改：

```javascript
const START_TIME = new Date('2021-06-01T00:00:00Z').getTime();
```

### 修改爬虫延迟

```javascript
const DELAY_MS = 200; // 增加此数值可以降低 API 请求频率
```

### 修改图表样式

编辑 `index.html` 中的 CSS 部分可以自定义：
- 颜色配置（`colorThief` 自动提取）
- 动画速度（`frameDelay`）
- 布局和尺寸

## 项目文件说明

| 文件 | 说明 |
|-----|------|
| `crawler.js` | 数据爬虫：从 VTBs API 获取粉丝历史数据 |
| `bake.js` | 数据处理：压缩和整理爬虫数据 |
| `generate_list.js` | 生成特定时段的主播列表 |
| `update_today.js` | 每日更新：获取最新的粉丝数据 |
| `merge_csv.js` | 合并多个 CSV 文件 |
| `fix_color.js` | 修复头像颜色值 |
| `index.html` | 前端可视化页面（使用 AniChart 库） |
| `package.json` | Node.js 项目配置 |

## 数据来源

本项目使用的数据来自开源的 [VTBs API](https://api.vtbs.moe/)，该 API 提供虚拟主播的粉丝历史数据。

## 关键特性

✨ **完整的数据管道**
- 自动爬取虚拟主播粉丝历史数据
- 智能去重和数据清理
- 支持增量更新

📊 **动态可视化展示**
- 实时动态排行榜展示
- 自动提取头像主题色
- 响应式多面板布局
- 流畅的动画过渡

🔧 **高度可定制**
- 灵活的时间范围配置
- 可调节的爬虫延迟参数
- 易于修改的样式和配置

## 故障排除

### 爬虫超时或获取失败

- 增加 `DELAY_MS` 的值（默认 250ms）
- 检查网络连接
- VTBs API 服务器偶尔会有访问限制，可以稍后重试

### 跨域问题

确保使用本地服务器而不是直接打开 HTML 文件。

### 图表不显示

- 检查浏览器控制台是否有错误
- 确保 `data.csv` 文件存在且格式正确
- 尝试清空浏览器缓存

## 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 贡献

欢迎提交 Issue 和 Pull Request！请参考 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献指南。

## 致谢

- [VTBs API](https://api.vtbs.moe/) 提供的数据服务
- [AniChart](https://github.com/anichart/anichart.js) 动画图表库

### 调整图表排名范围

在 `index.html` 中修改 `createChart()` 的调用参数：

```javascript
createChart('canvas-top', 1, 30, 'Top 1-30');  // startRank=1, endRank=30
createChart('canvas-b1', 31, 50, 'Top 31-50'); // startRank=31, endRank=50
```

### 调整动画播放速度

在 `createChart()` 中修改 `aniTime`：

```javascript
aniTime: [0, 5000],  // 更改为 [0, 10000] 以放慢动画
```

## 数据 CSV 格式

生成的 `data.csv` 文件格式：

```csv
date,name,value
2021-06-01,主播A,100000
2021-06-01,主播B,95000
2021-06-02,主播A,102000
...
```

- **date**：数据日期（YYYY-MM-DD 格式）
- **name**：虚拟主播名称
- **value**：粉丝数

## 性能优化建议

1. **数据量过大导致浏览器卡顿：**
   - 在爬虫脚本中只保留 Top N 主播的数据
   - 或修改爬虫只获取特定日期范围的数据

2. **API 请求超时：**
   - 增加 `DELAY_MS` 延迟
   - 减少爬虫并发请求数

3. **图表渲染优化：**
   - 降低 FPS：`stage.options.fps = 20;`
   - 减少展示的主播数量

## 免责声明

- 请遵守 vtbs.moe API 使用条款，不要滥用接口
- 不要将数据用于恶意舆论引导或侵犯他人权益
- 本项目仅供学习和研究使用

## 技术栈

- **后端：** Node.js + Axios
- **前端：** HTML5 + Canvas
- **可视化库：** Anichart.js v3
- **数据解析：** D3-DSV

## 故障排除

### 无法加载 data.csv
- 确保已运行爬虫脚本 `npm run crawler`
- 确保使用本地服务器打开页面，而非直接打开文件

### 图表不显示
- 检查浏览器控制台是否有错误信息
- 确保 Anichart 和 D3 CDN 可访问
- 尝试刷新页面或清除浏览器缓存

### 爬虫速度过慢
- 这是正常的，因为脚本遵守礼貌延迟规则
- 可根据需要在 `crawler.js` 中调整 `DELAY_MS`

## 许可证

MIT
