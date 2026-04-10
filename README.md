# 📚 背单词神器 - English Words Learning App

一个支持手机、平板、电脑全平台的英语单词学习应用。

## 🎯 项目说明

### 📁 目录结构
```
English-Words/
├── app/              ← 新版本（v2.0 推荐使用）
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── wordlist.js
│   ├── manifest.json
│   ├── sw.js
│   ├── icon-192.png
│   ├── README.md
│   └── start.sh
├── old app/          ← 老版本（v1.0）
│   ├── wordmaster.html
│   ├── wordmaster.css
│   ├── wordmaster.js
│   └── wordlist.js
├── CHANGELOG.md      ← 版本更新日志
└── README.md         ← 本文件
```

### ✨ 版本对比

| 特性 | v1.0 (old app) | v2.0 (app) |
|------|----------------|------------|
| 响应式设计 | 基础 iPad 适配 | ✅ 手机/平板/电脑完美适配 |
| 翻译 API | 百度/有道（需配置） | ✅ MyMemory（免费） |
| 代码量 | 750行 | 600行（优化20%） |
| UI设计 | 基础 | ✅ 现代渐变设计 |
| 依赖 | CryptoJS | ✅ 零依赖 |
| PWA | 基础 | ✅ 完整支持 |

### 🚀 快速开始

#### 方法1：直接使用（推荐）
```bash
cd app
./start.sh
```

#### 方法2：手动启动
```bash
cd app
python3 -m http.server 8000
# 访问 http://localhost:8000
```

#### 方法3：直接打开
双击 `app/index.html` 文件

### 📱 安装为应用

**iOS/iPadOS**：
1. Safari 打开应用
2. 点击分享 → 添加到主屏幕

**Android**：
1. Chrome 打开应用
2. 菜单 → 添加到主屏幕

**桌面 (Chrome/Edge)**：
1. 地址栏右侧点击安装图标
2. 或菜单 → 安装应用

### 🎓 核心功能

- ✅ **拼写游戏**：拖拽/点击字母拼写单词
- ✅ **智能复习**：基于遗忘曲线的间隔重复算法
- ✅ **错词本**：自动收集错误单词
- ✅ **批量导入**：支持自定义词库
- ✅ **语音播放**：单词发音 + 中文鼓励
- ✅ **学习统计**：总分、连续、已学数、正确率
- ✅ **AI 助手**：DeepSeek 智能问答（可选）

### 🔧 技术栈

- **前端**：原生 HTML5/CSS3/JavaScript (ES6+)
- **存储**：LocalStorage
- **PWA**：Service Worker + Web App Manifest
- **API**：
  - [Dictionary API](https://dictionaryapi.dev) - 单词查询（免费）
  - [MyMemory](https://mymemory.translated.net) - 翻译（免费）
  - [DeepSeek](https://deepseek.com) - AI助手（可选，需配置）

### 📖 详细文档

- [新版本说明](app/README.md) - v2.0 功能详解
- [更新日志](CHANGELOG.md) - 版本变化和改进

### 🔑 配置说明

**无需配置即可使用**：
- 单词查询和翻译完全免费
- AI 助手为可选功能

**如需使用 AI 助手**：
1. 获取 [DeepSeek API Key](https://platform.deepseek.com)
2. 应用内点击 ⚙️ 按钮配置
3. 即可使用智能问答功能

### 📊 学习数据

所有学习进度保存在浏览器本地：
- 词库数据：`localStorage.customWords`
- 学习进度：`localStorage.learningProgress`
- API Key：`localStorage.deepseekApiKey`

**备份数据**（浏览器控制台）：
```javascript
// 导出
JSON.stringify(localStorage)

// 导入
Object.keys(backup).forEach(key => {
    localStorage.setItem(key, backup[key])
})
```

### 🐛 问题反馈

如遇到问题，请检查：
1. 浏览器是否支持（建议 Chrome/Safari/Edge）
2. 是否允许 JavaScript 执行
3. 网络连接是否正常（查询单词需要联网）

### 📝 开发计划

**v2.1**：
- [ ] 暗色模式
- [ ] 选择题模式
- [ ] 学习报告图表
- [ ] 词库分类（四六级、托福等）

**v2.2**：
- [ ] 云端同步（可选）
- [ ] 导出学习记录
- [ ] 自定义主题

### 📄 许可证

MIT License - 自由使用、修改和分发

### 🙏 致谢

- Dictionary API - 免费的英语词典
- MyMemory - 免费的翻译服务
- DeepSeek - AI 对话服务

---

**开始学习**：进入 `app` 文件夹开始使用新版本！
