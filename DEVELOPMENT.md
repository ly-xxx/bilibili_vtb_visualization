# 开发指南

本文档为想要参与项目开发的贡献者提供详细的技术指南。

## 项目架构

```
项目结构：
├── 数据爬取层 (crawler.js)
│   └── 从 VTBs API 获取原始数据
├── 数据处理层 (bake.js, merge_csv.js 等)
│   └── 清理、合并、压缩数据
└── 展示层 (index.html)
    └── 前端可视化和交互
```

## 主要模块说明

### 1. crawler.js - 数据爬虫

**职责**: 从 VTBs API 获取虚拟主播的粉丝历史数据

**关键参数**:
- `START_TIME`: 数据开始时间（默认 2021-06-01）
- `DELAY_MS`: 请求间隔延迟（默认 250ms，保护服务器）
- `MAX_RETRIES`: 失败重试次数（默认 3）

**API 接口**:
- `https://api.vtbs.moe/v1/short` - 获取所有虚拟主播列表
- `https://api.vtbs.moe/v1/data?mid={id}&from={timestamp}&to={timestamp}` - 获取粉丝历史数据

**输出**: `data.csv` 文件，格式为：
```
Date,VTuber_ID,VTuber_Name,Followers
2021-06-01,xxxx,name1,50000
```

### 2. bake.js - 数据优化

**职责**: 压缩和优化爬虫数据

**处理内容**:
- 去除重复数据
- 每天保留一条记录
- 生成优化后的 CSV

**输出**: `baked_data.csv`

### 3. index.html - 前端展示

**使用的库**:
- [AniChart.js](https://github.com/anichart/anichart.js) - 动画图表库
- [Color Thief](https://lokeshdhakar.com/projects/color-thief/) - 主题色提取

**核心变量**:
```javascript
const frameDelay = 100;  // 动画帧延迟（ms）
const chartCount = 5;    // 图表数量（5 个并行显示）
```

## 常见开发任务

### 任务 1: 修改爬虫时间范围

编辑 `crawler.js`:
```javascript
// 修改起始时间
const START_TIME = new Date('2020-01-01T00:00:00Z').getTime();

// 修改截止时间（添加到 fetchData 函数）
const END_TIME = new Date('2024-12-31T23:59:59Z').getTime();
```

### 任务 2: 调整爬虫速度

```javascript
// 降低请求频率（保护服务器）
const DELAY_MS = 500;  // 从 250 增加到 500

// 或减少目标数据量
// 在 fetchData 中仅爬取 Top 100 主播
const vtubers = data.slice(0, 100);
```

### 任务 3: 修改图表布局

编辑 `index.html` 中的 canvas 配置：

```javascript
// 修改图表尺寸
const canvases = [
  { id: 'chart1', width: 800, height: 600 },  // Top 1-30
  // ...
];
```

### 任务 4: 添加新的数据处理脚本

1. 创建新文件 `process_data.js`
2. 读取 `data.csv`
3. 进行处理
4. 输出结果

示例模板：
```javascript
const fs = require('fs');
const path = require('path');

const dataFile = 'data.csv';
const data = fs.readFileSync(dataFile, 'utf-8').split('\n');

// 处理数据...

fs.writeFileSync('processed_data.csv', result);
console.log('处理完成');
```

## 调试技巧

### 1. 爬虫调试

```bash
# 添加详细日志
# 在 crawler.js 中添加 console.log

# 只爬取少数数据进行测试
const vtubers = data.slice(0, 5);  // 仅测试前 5 个主播
```

### 2. 前端调试

- 打开浏览器开发者工具 (F12)
- 查看 Console 标签看是否有错误
- 检查 Network 标签验证数据加载
- 使用 Sources 标签进行逐步调试

### 3. 数据验证

```bash
# 检查 CSV 格式
npm install csv-parser

# 编写简单验证脚本
node -e "
const csv = require('csv-parser');
const fs = require('fs');
fs.createReadStream('data.csv')
  .pipe(csv())
  .on('data', (row) => console.log(row));
"
```

## 性能优化建议

### 爬虫优化

1. **并发请求**: 调整并发数量而非延迟
   ```javascript
   // 使用 Promise.all() 进行并发
   const batchSize = 5;
   ```

2. **缓存机制**: 避免重复请求
   ```javascript
   const cache = new Map();
   ```

3. **增量更新**: 仅获取新数据
   ```javascript
   const lastUpdate = getLastUpdateTime();
   const newData = await fetchSince(lastUpdate);
   ```

### 前端优化

1. **数据点采样**: 减少需要渲染的数据点
2. **懒加载**: 延迟加载不必要的资源
3. **Canvas 优化**: 使用离屏 Canvas 进行预渲染

## 测试

建议添加测试用例：

```bash
npm install --save-dev jest
```

编写 `crawler.test.js`:
```javascript
describe('Crawler', () => {
  test('should fetch vtuber list', async () => {
    // 测试代码
  });
});
```

## 部署

项目可以部署到：

1. **GitHub Pages** - 静态站点托管
2. **Vercel** - 支持 Node.js 的部署
3. **自有服务器** - 使用 PM2 等进程管理

## 联系方式

有技术问题？欢迎：
- 提交 GitHub Issues
- 在 Pull Request 中讨论

感谢你的贡献！
