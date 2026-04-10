#!/bin/bash

# 背单词神器 - 快速启动脚本

echo "🚀 背单词神器 - 多设备版 v2.0"
echo "================================"
echo ""
echo "选择启动方式："
echo "1. 本机访问（localhost，仅自己可用）"
echo "2. 局域网访问（允许同网络的其他设备访问）"
echo "3. 直接打开 HTML 文件"
echo ""
read -p "请选择 (1/2/3): " choice

PORT=8000

case $choice in
    1)
        echo ""
        echo "📡 启动服务器（仅本机）"
        echo "访问地址: http://localhost:$PORT"
        echo "按 Ctrl+C 停止服务器"
        echo ""
        python3 -m http.server $PORT --bind 127.0.0.1
        ;;
    2)
        echo ""
        echo "📡 启动服务器（局域网可访问）"
        echo ""

        # 获取本机 IP 地址
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "无法获取IP")
        else
            # Linux
            IP=$(hostname -I | awk '{print $1}')
        fi

        echo "本机访问: http://localhost:$PORT"
        echo "局域网访问: http://$IP:$PORT"
        echo ""
        echo "⚠️  安全提示："
        echo "   - 仅在可信网络（家庭/办公室WiFi）中使用"
        echo "   - 同一WiFi下的设备可以访问"
        echo "   - 按 Ctrl+C 可随时停止服务器"
        echo ""
        echo "📱 手机/平板访问方法："
        echo "   1. 确保连接同一WiFi"
        echo "   2. 浏览器输入: http://$IP:$PORT"
        echo ""
        read -p "按回车键继续..."
        echo ""
        python3 -m http.server $PORT --bind 0.0.0.0
        ;;
    3)
        echo ""
        echo "📂 打开文件..."
        open index.html 2>/dev/null || xdg-open index.html 2>/dev/null || start index.html
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac
