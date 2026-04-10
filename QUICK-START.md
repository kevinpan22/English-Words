# 🚀 快速开始指南

## 📦 GitHub 仓库信息

- **仓库地址**：https://github.com/kevinpan22/English-Words
- **类型**：私有仓库
- **分支**：main

---

## 🏠 在另一台电脑上使用

### 1. 首次克隆

```bash
# 克隆仓库
git clone https://github.com/kevinpan22/English-Words.git

# 进入项目目录
cd English-Words
```

### 2. 启动应用

```bash
# 进入应用目录
cd app

# 启动服务器
./start-fresh.sh
# 或
python3 -m http.server 8000
```

### 3. 访问应用

浏览器打开：`http://localhost:8000`

---

## 🔄 同步工作流程

### 在电脑 A（当前电脑）修改后

```bash
# 1. 查看修改状态
git status

# 2. 添加所有修改
git add .

# 3. 提交修改
git commit -m "修改说明（如：添加新单词、修复bug等）"

# 4. 推送到GitHub
git push
```

### 在电脑 B（另一台电脑）同步

```bash
# 拉取最新代码
git pull

# 如果有冲突，解决后再次提交
```

---

## 💡 常用命令

### 提交并推送（一行命令）

```bash
git add . && git commit -m "更新内容" && git push
```

### 查看提交历史

```bash
git log --oneline
```

### 查看远程仓库

```bash
git remote -v
```

### 撤销未提交的修改

```bash
# 撤销所有修改（危险！）
git reset --hard

# 撤销单个文件
git checkout -- 文件名
```

---

## 📱 在手机/平板上访问

### 使用局域网访问

1. **电脑上启动**（任意一台）：
   ```bash
   cd app
   ./start.sh
   # 选择 2（局域网访问）
   ```

2. **手机/平板访问**：
   - 连接同一WiFi
   - 浏览器输入：`http://你的IP:8000`
   - 例如：`http://192.168.1.100:8000`

---

## 🔧 故障排除

### 问题1：看到单词翻译混乱

**原因**：浏览器缓存了旧代码

**解决**：
- 方法1：`Cmd/Ctrl + Shift + R` 强制刷新
- 方法2：访问 `http://localhost:8000/clear-cache.html`

### 问题2：git push 失败

**原因**：可能需要先 `git pull`

**解决**：
```bash
git pull
# 解决冲突（如果有）
git add .
git commit -m "合并冲突"
git push
```

### 问题3：忘记了GitHub仓库地址

**解决**：
```bash
git remote -v
```

---

## 📚 项目结构

```
English-Words/
├── app/                    # 新版本（v2.0）⭐
│   ├── index.html          # 主页面
│   ├── app.js              # 核心逻辑（360+单词）
│   ├── style.css           # 响应式样式
│   ├── wordlist.js         # 默认词库
│   ├── clear-cache.html    # 清除缓存工具
│   ├── test-*.html         # 测试页面
│   ├── start.sh            # 启动脚本
│   └── *.md                # 文档
│
├── old app/                # 老版本（v1.0）
│   └── ...
│
├── README.md               # 项目说明
├── CHANGELOG.md            # 更新日志
└── QUICK-START.md          # 本文件
```

---

## ⚡ 快速测试

```bash
# 测试翻译是否正常
open http://localhost:8000/test-simple.html

# 测试 wonderful 等单词
open http://localhost:8000/test-wonderful.html

# 清除缓存
open http://localhost:8000/clear-cache.html
```

---

## 🎯 重要文件说明

| 文件 | 说明 |
|------|------|
| `app/index.html` | 主应用页面 |
| `app/app.js` | 核心逻辑（360+预设词典） |
| `app/style.css` | 响应式样式（手机/平板/电脑） |
| `app/TROUBLESHOOTING.md` | 问题诊断文档 |
| `app/TRANSLATION.md` | 翻译优化说明 |
| `app/NETWORK.md` | 网络访问指南 |

---

## 🆘 需要帮助？

1. **查看文档**：`app/` 目录下的 `*.md` 文件
2. **测试页面**：`app/test-*.html`
3. **问题诊断**：`app/TROUBLESHOOTING.md`

---

**祝使用愉快！回家继续改吧！** 🎉
