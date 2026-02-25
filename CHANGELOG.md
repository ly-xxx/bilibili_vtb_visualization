# 项目 Changelog

## [Unreleased]

## [1.0.0] - 2024-02-26

### Added
- 初始版本发布
- VTuber 粉丝数据爬取功能
  - 支持从 VTBs API 获取历史数据
  - 内置重试和超时机制
  - 自动去重处理
- 数据处理工具集
  - `bake.js` - 数据压缩优化
  - `merge_csv.js` - CSV 文件合并
  - `generate_list.js` - 特定时段列表生成
  - `update_today.js` - 每日数据更新
- 动态排行榜可视化
  - 5 个并行展示的 Top 排行（Top 1-30, 31-50, 51-70, 71-90, 91-110）
  - 流畅的动画过渡效果
  - 自动主题色提取
  - 响应式布局
- 项目文档
  - 详细的 README 和快速开始指南
  - 贡献指南 (CONTRIBUTING.md)
  - 开发文档 (DEVELOPMENT.md)
  - 部署指南 (DEPLOYMENT.md)
  - MIT 开源许可证

### Features

#### 爬虫特性
- ✅ 从 VTBs API 获取所有虚拟主播列表
- ✅ 获取每位主播从 2021-06-01 开始的粉丝历史
- ✅ 智能重试机制（最多 3 次重试）
- ✅ 请求超时保护（15 秒）
- ✅ 礼貌延迟保护服务器（250ms）
- ✅ 详细的错误日志记录

#### 数据处理特性
- ✅ 自动去重（每个主播每天一条记录）
- ✅ 数据验证和清理
- ✅ CSV 文件合并支持
- ✅ 增量数据更新

#### 前端特性
- ✅ AniChart 库支持的流畅动画
- ✅ Color Thief 自动提取头像主题色
- ✅ 多面板并行展示
- ✅ 日期范围选择
- ✅ 实时排名更新动画

### Technical Details

**依赖项:**
- axios ^1.13.5 - HTTP 请求库
- colorthief ^2.6.0 - 颜色提取库
- http-server ^14.1.1 - 本地开发服务器

**Node.js 版本:** 14.0.0 及以上

**浏览器兼容性:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Performance

- 爬虫耗时：约 4-6 小时（爬取所有主播 3 年数据）
- 增量更新：约 5-10 分钟（每日更新）
- 前端加载：< 2 秒
- 数据文件大小：约 5-10 MB

### Known Issues
None

### Contributors
- Project Maintainer

---

## 版本说明

### 语义化版本 (Semantic Versioning)

本项目遵循 [SemVer](https://semver.org/lang/zh-CN/) 规范：

- **主版本号** (Major): 不兼容的 API 修改
- **次版本号** (Minor): 向下兼容的功能新增
- **修订版本号** (Patch): 向下兼容的 bug 修复

### 版本更新政策

- **定期更新**: 每月检查依赖更新
- **安全更新**: 立即发布（修订版本）
- **功能更新**: 季度发布一次（次版本）
- **重大更新**: 年度发布一次（主版本）

---

## 贡献者

感谢所有为本项目做出贡献的人！

### 如何成为贡献者

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

详见 [CONTRIBUTING.md](CONTRIBUTING.md)

---

更新于 2024 年 2 月
