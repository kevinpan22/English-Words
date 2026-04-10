#!/bin/bash

# 清除缓存后启动服务器

echo "🔄 背单词神器 - 清除缓存启动"
echo "================================"
echo ""

PORT=8000

echo "📌 提示："
echo "   如果浏览器显示的内容混乱（中英文混杂）"
echo "   说明浏览器缓存了旧版本的代码"
echo ""
echo "✅ 解决方案："
echo "   1. 启动服务器后，先打开：http://localhost:$PORT/clear-cache.html"
echo "   2. 点击【一键清除所有缓存】"
echo "   3. 或使用强制刷新：Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)"
echo ""

read -p "按回车键继续启动服务器..."

# 获取本机 IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
else
    IP=$(hostname -I | awk '{print $1}' || echo "localhost")
fi

echo ""
echo "🚀 服务器启动中..."
echo ""
echo "📱 访问地址："
echo "   本机访问: http://localhost:$PORT"
if [ "$IP" != "localhost" ]; then
    echo "   局域网访问: http://$IP:$PORT"
fi
echo ""
echo "🔧 清除缓存页面："
echo "   http://localhost:$PORT/clear-cache.html"
echo ""
echo "🧪 快速测试页面："
echo "   http://localhost:$PORT/test-simple.html"
echo ""
echo "⚠️  如果看到内容混乱，请先访问清除缓存页面！"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

python3 -m http.server $PORT --bind 0.0.0.0
