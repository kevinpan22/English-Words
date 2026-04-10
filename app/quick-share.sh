#!/bin/bash
# 快速分享脚本

echo "🌐 快速分享 - 背单词神器"
echo "========================"
echo ""

# 获取IP地址
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$IP" ]; then
    echo "❌ 无法获取IP地址，请检查网络连接"
    exit 1
fi

PORT=8000

echo "✅ 你的访问地址："
echo ""
echo "   📱 分享这个地址："
echo "   ┌─────────────────────────────────┐"
echo "   │  http://$IP:$PORT  │"
echo "   └─────────────────────────────────┘"
echo ""
echo "📋 使用说明："
echo "   1. 让对方连接到同一WiFi"
echo "   2. 分享上面的地址"
echo "   3. 对方用浏览器打开即可"
echo ""
echo "⚠️  按 Ctrl+C 可随时停止分享"
echo ""
echo "🚀 启动服务器..."
echo ""

python3 -m http.server $PORT --bind 0.0.0.0
