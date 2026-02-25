# 贡献指南

感谢你对本项目的关注！以下是参与贡献的指南。

## 如何贡献

### 报告 Bug

如果发现问题，请通过以下方式提交：

1. 在 GitHub Issues 中创建新 Issue
2. 清晰地描述问题现象
3. 提供重现步骤
4. 附上相关的日志或截图（如有）
5. 说明你的环境（Node.js 版本、操作系统等）

示例：
```
标题: 爬虫在获取特定主播数据时超时
描述:
环境: Node.js v18.0.0, Windows 11
步骤:
1. npm install
2. node crawler.js
3. 等待约 30 分钟后报错

错误信息: 
timeout of 15000ms exceeded
```

### 提交功能建议

如果有新的功能想法，请：

1. 在 Issues 中提交功能请求
2. 描述预期的行为和使用场景
3. 解释为什么这个功能有用

### 提交代码

1. **Fork 项目**

```bash
# 在 GitHub 上 fork 项目
# 克隆你的 fork
git clone https://github.com/YOUR_USERNAME/vtuber-fan-chart.git
cd vtuber-fan-chart
```

2. **创建功能分支**

```bash
git checkout -b feature/your-feature-name
```

3. **进行修改**

- 遵循现有代码风格
- 添加必要的注释
- 更新相关文档

4. **提交更改**

```bash
git add .
git commit -m "feat: 添加功能描述"
```

提交信息规范：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码风格调整
- `refactor:` 代码重构
- `test:` 测试相关

5. **推送到你的 Fork**

```bash
git push origin feature/your-feature-name
```

6. **提交 Pull Request**

- 在 GitHub 上创建 Pull Request
- 清晰地描述修改内容
- 关联相关的 Issue（如有）

## 开发指南

### 安装依赖

```bash
npm install
```

### 测试爬虫

```bash
# 测试爬虫（可能需要很长时间）
npm run crawler

# 或使用 http-server 启动服务器
npm run serve
```

### 代码规范

- 使用 2 个空格缩进
- 使用有意义的变量和函数名
- 添加适当的注释说明复杂逻辑
- 避免全局变量

### 常见改进方向

- **性能优化**：减少爬虫耗时、优化数据处理
- **功能扩展**：支持更多的数据源或可视化方式
- **用户体验**：改进界面、添加更多交互选项
- **文档完善**：改进 README、添加使用示例
- **测试覆盖**：添加单元测试

## Pull Request 审查

维护者会：
- 审查代码质量
- 验证功能完整性
- 检查是否有测试覆盖
- 提供建设性反馈

请耐心等待审查，我们会尽快回应。

## 行为准则

- 保持尊重和友善的态度
- 接受建设性批评
- 专注于对项目最有益的讨论
- 不容忍骚扰、歧视或其他不当行为

## 许可证

通过提交代码，你同意你的贡献将在 MIT 许可证下发布。

## 问题？

如有任何问题，欢迎在 Issues 中提问！

感谢你的贡献！🎉
