// ========== 全局状态 ==========
let currentWord = null;
let score = 0;
let streak = 0;
let mistakesList = [];
let statistics = {
    totalLearned: 0,
    correctRate: 0,
    totalAttempts: 0,
    successfulAttempts: 0,
    learnedWords: [],
    lastStudyDate: null
};
let reviewSchedule = {
    intervals: [1, 2, 4, 7, 15, 30], // 间隔重复算法（天）
    words: {}
};

// ========== 点选交互状态 ==========
let draggingLid = null; // 当前拖拽的字母唯一 ID

// ========== 音效 ==========
const correctSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSp+zPDTiTYIG2W58OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a68OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBQ==');
const wrongSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSp+zPDTiTYIG2W58OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a68OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBSd+zPDSiTYIG2a78OScTgwNUKzn77ViFQU7k9n0yXkqBQ==');

// ========== 初始化 ==========
window.addEventListener('load', () => {
    loadProgress();
    setTimeout(() => {
        document.getElementById('splashScreen').classList.add('hide');
    }, 2000);
    newWord();
    setInterval(checkReviewWords, 60 * 60 * 1000); // 每小时检查复习
    checkReviewWords();
});

// ========== 进度管理 ==========
function loadProgress() {
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            score = progress.score || 0;
            streak = progress.streak || 0;
            mistakesList = progress.mistakesList || [];
            statistics = progress.statistics || statistics;
            reviewSchedule = progress.reviewSchedule || reviewSchedule;
            updateDisplay();
        } catch (e) {
            console.error('加载进度失败:', e);
        }
    }
}

function saveProgress() {
    const progress = {
        score,
        streak,
        mistakesList,
        statistics,
        reviewSchedule,
        timestamp: Date.now()
    };
    localStorage.setItem('learningProgress', JSON.stringify(progress));
}

function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('streak').textContent = streak;
    document.getElementById('totalLearned').textContent = statistics.totalLearned;
    document.getElementById('correctRate').textContent = statistics.correctRate + '%';
}

// ========== 核心游戏逻辑 ==========
function newWord() {
    if (!wordList || wordList.length === 0) {
        showFeedback('❌ 词库为空，请先添加单词');
        return;
    }
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];
    document.getElementById('currentWord').textContent = '?????';
    document.getElementById('phonetic').textContent = currentWord.phonetic;
    document.getElementById('meaning').textContent = currentWord.meaning;
    document.getElementById('memoryTip').textContent = currentWord.memoryTip;
    document.getElementById('feedback').textContent = '';

    // 词组走认读模式，单词走拼写游戏
    if (currentWord.word.includes(' ')) {
        showRecognitionMode();
    } else {
        setupGame();
    }
}

// ========== 词组认读模式 ==========
function showRecognitionMode() {
    document.getElementById('slots').innerHTML = '';
    document.getElementById('letters').innerHTML = '';
    document.getElementById('currentWord').textContent = currentWord.word;
    showFeedback('📖 词组认读 — 记住后点击下方按钮');
    document.getElementById('recognitionBtn').style.display = 'inline-block';
}

function confirmRecognition() {
    document.getElementById('recognitionBtn').style.display = 'none';
    // 计入已学统计，但不计入正确率（无答题过程）
    if (!statistics.learnedWords.includes(currentWord.word)) {
        statistics.totalLearned++;
        statistics.learnedWords.push(currentWord.word);
    }
    updateReviewSchedule();
    updateDisplay();
    saveProgress();
    updateScore(2);
    showFeedback('👍 已记住！');
    setTimeout(newWord, 1200);
}

function setupGame() {
    const letters = currentWord.word.split('').sort(() => Math.random() - 0.5);
    const slotsContainer = document.getElementById('slots');
    const lettersContainer = document.getElementById('letters');

    // 创建空槽（支持点击回退）
    slotsContainer.innerHTML = letters.map(() =>
        '<div class="slot" onclick="slotClick(this)" ondrop="drop(event)" ondragover="allowDrop(event)"></div>'
    ).join('');

    // 创建字母（data-lid 唯一标识，解决重复字母问题）
    lettersContainer.innerHTML = letters.map((letter, i) =>
        `<div class="letter" data-lid="${i}" draggable="true"
              onclick="letterClick(this)" ondragstart="drag(event)"
              ontouchstart="touchStart(event)" ontouchmove="touchMove(event)"
              ontouchend="touchEnd(event)">${letter}</div>`
    ).join('');
}

// ========== 拖拽功能 ==========
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.textContent);
    draggingLid = ev.target.dataset.lid;
    ev.target.classList.add('dragging');
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const targetSlot = ev.target.classList.contains('slot') ? ev.target : ev.target.parentNode;

    // 用 textContent 判断是否为空，避免重复字母时覆盖已填槽
    if (!targetSlot.textContent) {
        targetSlot.textContent = data;
        targetSlot.dataset.lid = draggingLid || '';
        // 用 lid 精准移除对应字母，防止重复字母误删
        document.querySelectorAll('.letter').forEach(letter => {
            if (letter.dataset.lid === draggingLid) letter.remove();
        });
        draggingLid = null;
        checkAnswer();
    }
}

// ========== 触摸支持 ==========
let touchElement = null;
let touchClone = null;

function touchStart(event) {
    event.preventDefault();
    touchElement = event.target;
    touchClone = touchElement.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '1000';
    touchClone.style.opacity = '0.8';
    touchClone.style.pointerEvents = 'none';
    document.body.appendChild(touchClone);
    touchElement.style.opacity = '0.3';
}

function touchMove(event) {
    if (!touchClone) return;
    event.preventDefault();
    const touch = event.touches[0];
    touchClone.style.left = (touch.pageX - 25) + 'px';
    touchClone.style.top = (touch.pageY - 25) + 'px';
}

function touchEnd(event) {
    if (!touchElement || !touchClone) return;

    const touch = event.changedTouches[0];
    const slots = document.querySelectorAll('.slot');
    let dropped = false;

    slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        if (touch.pageX >= rect.left && touch.pageX <= rect.right &&
            touch.pageY >= rect.top && touch.pageY <= rect.bottom &&
            !slot.textContent) {
            slot.textContent = touchElement.textContent;
            slot.dataset.lid = touchElement.dataset.lid || '';
            touchElement.remove();
            dropped = true;
            checkAnswer();
        }
    });

    if (!dropped) {
        touchElement.style.opacity = '1';
    }

    touchClone.remove();
    touchElement = null;
    touchClone = null;
}

// ========== 点选交互 ==========
// 点击待选区字母 → 放入第一个空槽
function letterClick(letterEl) {
    const slots = document.querySelectorAll('.slot');
    for (const slot of slots) {
        if (!slot.textContent) {
            slot.textContent = letterEl.textContent;
            slot.dataset.lid = letterEl.dataset.lid || '';
            letterEl.remove();
            checkAnswer();
            return;
        }
    }
}

// 点击已填格子 → 字母回到待选区末尾
function slotClick(slotEl) {
    if (!slotEl.textContent) return;

    const letter = document.createElement('div');
    letter.className = 'letter';
    letter.textContent = slotEl.textContent;
    letter.dataset.lid = slotEl.dataset.lid || '';
    letter.setAttribute('draggable', 'true');
    letter.setAttribute('onclick', 'letterClick(this)');
    letter.setAttribute('ondragstart', 'drag(event)');
    letter.setAttribute('ontouchstart', 'touchStart(event)');
    letter.setAttribute('ontouchmove', 'touchMove(event)');
    letter.setAttribute('ontouchend', 'touchEnd(event)');

    document.getElementById('letters').appendChild(letter);

    slotEl.textContent = '';
    delete slotEl.dataset.lid;
}

// ========== 答案检查 ==========
function checkAnswer() {
    const slots = [...document.querySelectorAll('.slot')];
    const answer = slots.map(slot => slot.textContent).join('');

    if (!slots.every(s => s.textContent)) return; // 未填满

    statistics.totalAttempts++;

    if (answer === currentWord.word) {
        handleCorrect();
    } else {
        handleWrong();
    }
}

function handleCorrect() {
    statistics.successfulAttempts++;
    statistics.correctRate = (statistics.successfulAttempts / statistics.totalAttempts * 100).toFixed(1);

    if (!statistics.learnedWords.includes(currentWord.word)) {
        statistics.totalLearned++;
        statistics.learnedWords.push(currentWord.word);
    }

    updateReviewSchedule();
    updateDisplay();
    saveProgress();

    document.getElementById('currentWord').textContent = currentWord.word;
    showFeedback('🎉 太棒了！');

    correctSound.play().then(() => {
        speakText('你真棒', 'zh-CN');
        setTimeout(() => playCurrentWord(), 1000);
    });

    updateScore(5 * (currentWord.difficulty || 1));
    updateStreak(true);
    setTimeout(newWord, 3000);
}

function handleWrong() {
    showFeedback('❌ 再试试~');
    wrongSound.play().then(() => {
        speakText('加油，再试一次', 'zh-CN');
    });

    if (!mistakesList.find(w => w.word === currentWord.word)) {
        mistakesList.push(currentWord);
    }

    updateStreak(false);
    saveProgress();
    setTimeout(() => {
        document.querySelectorAll('.slot').forEach(s => s.textContent = '');
        setupGame();
    }, 1500);
}

function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
}

function updateStreak(correct) {
    streak = correct ? streak + 1 : 0;
    document.getElementById('streak').textContent = streak;
}

function showFeedback(message) {
    document.getElementById('feedback').textContent = message;
}

function updateReviewSchedule() {
    const now = Date.now();
    const wordSchedule = reviewSchedule.words[currentWord.word] || { stage: 0 };
    const nextStage = Math.min(wordSchedule.stage + 1, reviewSchedule.intervals.length - 1);
    reviewSchedule.words[currentWord.word] = {
        nextReview: now + reviewSchedule.intervals[nextStage] * 24 * 60 * 60 * 1000,
        stage: nextStage
    };
}

function checkReviewWords() {
    const now = Date.now();
    const count = Object.keys(reviewSchedule.words).filter(word =>
        now >= reviewSchedule.words[word].nextReview
    ).length;

    if (count > 0) {
        console.log(`有 ${count} 个单词需要复习`);
    }
}

// ========== 语音功能 ==========
function playCurrentWord() {
    if (currentWord && 'speechSynthesis' in window) {
        speakText(currentWord.word, 'en-US', 0.8);
    }
}

function speakText(text, lang = 'en-US', rate = 1) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    speechSynthesis.speak(utterance);
}

// ========== 辅助功能 ==========
function showHint() {
    document.getElementById('currentWord').textContent = currentWord.word;
    setTimeout(() => {
        if (document.getElementById('currentWord').textContent === currentWord.word) {
            document.getElementById('currentWord').textContent = '?????';
        }
    }, 1000);
}

function reviewMistakes() {
    const now = Date.now();
    const wordsToReview = [];

    // 收集需要复习的单词
    for (let word in reviewSchedule.words) {
        if (now >= reviewSchedule.words[word].nextReview) {
            const wordData = wordList.find(w => w.word === word);
            if (wordData) wordsToReview.push(wordData);
        }
    }

    // 合并错词
    wordsToReview.push(...mistakesList);

    if (wordsToReview.length > 0) {
        currentWord = wordsToReview[Math.floor(Math.random() * wordsToReview.length)];
        mistakesList = mistakesList.filter(w => w.word !== currentWord.word);
        document.getElementById('currentWord').textContent = '?????';
        document.getElementById('phonetic').textContent = currentWord.phonetic;
        document.getElementById('meaning').textContent = currentWord.meaning;
        document.getElementById('memoryTip').textContent = currentWord.memoryTip;
        showFeedback('📚 复习模式');
        setupGame();
    } else {
        showFeedback('✅ 没有需要复习的单词');
        setTimeout(() => showFeedback(''), 2000);
    }
}

// ========== API 集成 ==========

// 常用单词简短翻译词典（适合小学中学生）
const commonWordsMeanings = {
    // 动物
    'cat': '猫', 'dog': '狗', 'bird': '鸟', 'fish': '鱼', 'rabbit': '兔子',
    'elephant': '大象', 'tiger': '老虎', 'lion': '狮子', 'monkey': '猴子',
    'panda': '熊猫', 'bear': '熊', 'duck': '鸭子', 'chicken': '鸡',
    'pig': '猪', 'cow': '牛', 'sheep': '羊', 'horse': '马',

    // 水果
    'apple': '苹果', 'banana': '香蕉', 'orange': '橙子', 'grape': '葡萄',
    'watermelon': '西瓜', 'strawberry': '草莓', 'peach': '桃子', 'pear': '梨',
    'lemon': '柠檬', 'cherry': '樱桃', 'mango': '芒果',

    // 颜色
    'red': '红色', 'blue': '蓝色', 'green': '绿色', 'yellow': '黄色',
    'black': '黑色', 'white': '白色', 'purple': '紫色', 'pink': '粉色',
    'brown': '棕色', 'gray': '灰色', 'orange': '橙色',

    // 数字
    'one': '一', 'two': '二', 'three': '三', 'four': '四', 'five': '五',
    'six': '六', 'seven': '七', 'eight': '八', 'nine': '九', 'ten': '十',
    'hundred': '百', 'thousand': '千',

    // 家庭
    'father': '父亲', 'mother': '母亲', 'brother': '兄弟', 'sister': '姐妹',
    'grandpa': '爷爷', 'grandma': '奶奶', 'family': '家庭', 'baby': '婴儿',
    'dad': '爸爸', 'mom': '妈妈', 'son': '儿子', 'daughter': '女儿',

    // 身体部位
    'head': '头', 'hand': '手', 'foot': '脚', 'eye': '眼睛', 'ear': '耳朵',
    'nose': '鼻子', 'mouth': '嘴巴', 'arm': '手臂', 'leg': '腿',
    'finger': '手指', 'face': '脸', 'hair': '头发', 'tooth': '牙齿',

    // 常用动词
    'go': '去', 'come': '来', 'eat': '吃', 'drink': '喝', 'sleep': '睡觉',
    'run': '跑', 'walk': '走', 'jump': '跳', 'swim': '游泳', 'fly': '飞',
    'read': '读', 'write': '写', 'play': '玩', 'study': '学习',
    'like': '喜欢', 'love': '爱', 'want': '想要', 'need': '需要',
    'have': '有', 'make': '制作', 'do': '做', 'see': '看见', 'hear': '听见',
    'say': '说', 'tell': '告诉', 'know': '知道', 'think': '想',
    'give': '给', 'take': '拿', 'get': '得到', 'put': '放',

    // 常用形容词
    'big': '大的', 'small': '小的', 'long': '长的', 'short': '短的',
    'tall': '高的', 'hot': '热的', 'cold': '冷的', 'new': '新的', 'old': '旧的',
    'good': '好的', 'bad': '坏的', 'happy': '开心的', 'sad': '伤心的',
    'beautiful': '美丽的', 'ugly': '丑的', 'clean': '干净的', 'dirty': '脏的',
    'fast': '快的', 'slow': '慢的', 'easy': '容易的', 'difficult': '困难的',

    // 学校
    'school': '学校', 'teacher': '老师', 'student': '学生', 'book': '书',
    'pen': '笔', 'pencil': '铅笔', 'desk': '书桌', 'chair': '椅子',
    'class': '班级', 'classroom': '教室', 'homework': '作业', 'test': '测试',

    // 地点
    'home': '家', 'house': '房子', 'room': '房间', 'park': '公园',
    'hospital': '医院', 'store': '商店', 'library': '图书馆',
    'zoo': '动物园', 'farm': '农场', 'city': '城市', 'country': '国家',

    // 时间
    'day': '天', 'week': '星期', 'month': '月', 'year': '年',
    'today': '今天', 'tomorrow': '明天', 'yesterday': '昨天',
    'morning': '早上', 'afternoon': '下午', 'evening': '晚上', 'night': '夜晚',
    'monday': '星期一', 'tuesday': '星期二', 'wednesday': '星期三',
    'thursday': '星期四', 'friday': '星期五', 'saturday': '星期六', 'sunday': '星期日',

    // 天气
    'sun': '太阳', 'rain': '雨', 'wind': '风', 'snow': '雪',
    'cloud': '云', 'weather': '天气', 'sunny': '晴朗的', 'rainy': '下雨的',

    // 食物
    'food': '食物', 'rice': '米饭', 'bread': '面包', 'egg': '鸡蛋',
    'milk': '牛奶', 'water': '水', 'juice': '果汁', 'tea': '茶',
    'cake': '蛋糕', 'candy': '糖果', 'meat': '肉', 'vegetable': '蔬菜',

    // 其他常用词
    'hello': '你好', 'goodbye': '再见', 'thank': '感谢', 'sorry': '对不起',
    'yes': '是', 'no': '不', 'please': '请', 'welcome': '欢迎',
    'friend': '朋友', 'name': '名字', 'age': '年龄', 'boy': '男孩', 'girl': '女孩',
    'man': '男人', 'woman': '女人', 'people': '人们', 'world': '世界',
    'time': '时间', 'place': '地方', 'thing': '东西', 'way': '方法',
    'life': '生活', 'work': '工作', 'money': '钱', 'music': '音乐',
    'game': '游戏', 'sport': '运动', 'ball': '球', 'toy': '玩具',

    // 更多常用动物（扩展）
    'mouse': '老鼠', 'rat': '老鼠', 'snake': '蛇', 'frog': '青蛙',
    'butterfly': '蝴蝶', 'bee': '蜜蜂', 'ant': '蚂蚁', 'spider': '蜘蛛',
    'whale': '鲸鱼', 'dolphin': '海豚', 'shark': '鲨鱼', 'turtle': '乌龟',
    'penguin': '企鹅', 'owl': '猫头鹰', 'eagle': '老鹰', 'parrot': '鹦鹉',
    'wolf': '狼', 'fox': '狐狸', 'deer': '鹿', 'giraffe': '长颈鹿',
    'zebra': '斑马', 'kangaroo': '袋鼠', 'koala': '考拉', 'crocodile': '鳄鱼',

    // 常用物品
    'table': '桌子', 'door': '门', 'window': '窗户', 'bed': '床',
    'phone': '电话', 'computer': '电脑', 'camera': '相机', 'watch': '手表',
    'clock': '时钟', 'lamp': '灯', 'mirror': '镜子', 'picture': '图画',
    'bag': '包', 'box': '盒子', 'bottle': '瓶子', 'cup': '杯子',
    'plate': '盘子', 'spoon': '勺子', 'fork': '叉子', 'knife': '刀',
    'car': '汽车', 'bus': '公交车', 'train': '火车', 'plane': '飞机',
    'boat': '船', 'bike': '自行车', 'subway': '地铁', 'taxi': '出租车',

    // 自然和天气（扩展）
    'tree': '树', 'flower': '花', 'grass': '草', 'leaf': '叶子',
    'mountain': '山', 'river': '河', 'sea': '海', 'ocean': '海洋',
    'lake': '湖', 'beach': '海滩', 'island': '岛', 'forest': '森林',
    'star': '星星', 'moon': '月亮', 'sky': '天空', 'earth': '地球',
    'fire': '火', 'ice': '冰', 'stone': '石头', 'sand': '沙子',

    // 衣物
    'clothes': '衣服', 'shirt': '衬衫', 'pants': '裤子', 'dress': '连衣裙',
    'skirt': '裙子', 'shoe': '鞋子', 'hat': '帽子', 'coat': '外套',
    'jacket': '夹克', 'socks': '袜子', 'gloves': '手套', 'scarf': '围巾',

    // 常用形容词（扩展）
    'cute': '可爱的', 'smart': '聪明的', 'kind': '善良的', 'brave': '勇敢的',
    'strong': '强壮的', 'weak': '弱的', 'rich': '富有的', 'poor': '贫穷的',
    'busy': '忙碌的', 'free': '空闲的', 'tired': '累的', 'hungry': '饿的',
    'thirsty': '渴的', 'full': '饱的', 'empty': '空的', 'cheap': '便宜的',
    'expensive': '贵的', 'important': '重要的', 'famous': '著名的',
    'wonderful': '精彩的', 'great': '很棒的', 'amazing': '惊人的', 'excellent': '优秀的',
    'perfect': '完美的', 'nice': '好的', 'fine': '不错的', 'terrible': '糟糕的',
    'awful': '可怕的', 'interesting': '有趣的', 'boring': '无聊的', 'exciting': '激动的',

    // 常用动词（扩写）
    'stand': '站', 'sit': '坐', 'lie': '躺', 'wait': '等待',
    'watch': '观看', 'listen': '听', 'speak': '说话', 'talk': '交谈',
    'ask': '问', 'answer': '回答', 'help': '帮助', 'teach': '教',
    'learn': '学习', 'understand': '理解', 'remember': '记住', 'forget': '忘记',
    'open': '打开', 'close': '关闭', 'begin': '开始', 'finish': '完成',
    'buy': '买', 'sell': '卖', 'pay': '支付', 'spend': '花费',
    'wear': '穿', 'wash': '洗', 'clean': '清洁', 'cook': '烹饪'
};

// 1. 免费单词查询 API (dictionaryapi.dev)
async function fetchWordInfo(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!response.ok) throw new Error('单词未找到');

        const data = await response.json();
        const wordInfo = data[0];
        const phonetic = wordInfo.phonetic || wordInfo.phonetics[0]?.text || '';
        const englishMeaning = wordInfo.meanings[0]?.definitions[0]?.definition || '';

        return { word, phonetic, englishMeaning };
    } catch (e) {
        console.error('查询单词失败:', word, e);
        return null;
    }
}

// 2. 免费翻译 API (MyMemory)
async function translateToZh(text) {
    if (!text) return '';

    // 只取第一句，限制在 120 字符以内，避免 API 截断
    const firstSentence = text.split(/[.;]/)[0].trim();
    const toTranslate = firstSentence.length > 120 ? firstSentence.substring(0, 120) : firstSentence;

    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(toTranslate)}&langpair=en|zh-CN`
        );
        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            const translation = data.responseData.translatedText;
            // 确认结果包含中文
            if (!/[\u4e00-\u9fa5]/.test(translation)) return '';
            return translation;
        }
        return '';
    } catch (e) {
        console.error('翻译失败:', e);
        return '';
    }
}

// 3. 完整单词信息获取（优先使用预设词典）
async function fetchCompleteWordInfo(word) {
    const lowerWord = word.toLowerCase();

    // 优先使用预设词典（常用单词，简短翻译）
    if (commonWordsMeanings[lowerWord]) {
        showFeedback(`✅ 查询成功：${word}`);

        // 即使有预设翻译，也尝试获取音标和英文释义（作为记忆提示）
        const info = await fetchWordInfo(lowerWord);

        return {
            word: lowerWord,
            phonetic: info?.phonetic || '',
            meaning: commonWordsMeanings[lowerWord],
            memoryTip: info?.englishMeaning || '',
            difficulty: Math.min(Math.ceil(lowerWord.length / 3), 5)
        };
    }

    // 不在预设词典中，使用API查询
    showFeedback(`🔍 查询中：${word}...`);

    const info = await fetchWordInfo(lowerWord);
    if (!info) {
        return {
            word: lowerWord,
            phonetic: '',
            meaning: lowerWord,
            memoryTip: '',
            difficulty: Math.min(Math.ceil(lowerWord.length / 3), 5)
        };
    }

    // 翻译英文释义
    const chineseMeaning = await translateToZh(info.englishMeaning);

    return {
        word: info.word,
        phonetic: info.phonetic,
        meaning: chineseMeaning || info.englishMeaning,
        memoryTip: info.englishMeaning || '',
        difficulty: Math.min(Math.ceil(lowerWord.length / 3), 5)
    };
}

// ========== 批量导入 ==========
function showImportDialog() {
    document.getElementById('importDialog').style.display = 'flex';
}

function closeImportDialog() {
    document.getElementById('importDialog').style.display = 'none';
}

async function importWords() {
    const input = document.getElementById('wordInput').value;
    const lines = input.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        showFeedback('⚠️ 请输入单词');
        return;
    }

    showFeedback('📥 正在导入...');
    const newWords = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(s => s.trim());
        const wordName = parts[0].toLowerCase();
        if (!wordName) continue;

        // 完整格式：第一项,/音标/,释义,...
        const isFullFormat = parts.length >= 3 && parts[1].startsWith('/');
        // 逗号分隔词表：多个项，第二项不是音标也不含中文
        const isCommaWordList = parts.length >= 2 && !isFullFormat
                                && !parts[1].startsWith('/')
                                && !/[\u4e00-\u9fa5]/.test(parts[1]);

        if (isFullFormat) {
            // 完整格式直接使用
            newWords.push({
                word: wordName,
                phonetic: parts[1] || '',
                meaning: parts[2] || '',
                memoryTip: parts[3] || '',
                difficulty: parseInt(parts[4]) || 1
            });
        } else if (isCommaWordList) {
            // 逗号分隔词表，每项单独查询
            for (const item of parts) {
                const w = item.trim().toLowerCase();
                if (!w) continue;
                showFeedback(`🔍 查询中：${w}...`);
                const wordInfo = await fetchCompleteWordInfo(w);
                newWords.push(wordInfo);
                await new Promise(r => setTimeout(r, 500));
            }
        } else {
            // 单词或词组，自动查询
            showFeedback(`🔍 查询中：${wordName} (${i + 1}/${lines.length})`);
            const wordInfo = await fetchCompleteWordInfo(wordName);
            newWords.push(wordInfo);
            await new Promise(r => setTimeout(r, 500)); // 防止API限流
        }
    }

    const replaceMode = document.getElementById('replaceMode')?.checked;
    if (replaceMode) {
        wordList = newWords;
    } else {
        newWords.forEach(word => {
            if (!wordList.some(w => w.word === word.word)) {
                wordList.push(word);
            }
        });
    }

    localStorage.setItem('customWords', JSON.stringify(wordList));
    closeImportDialog();
    showFeedback(`✅ 成功导入 ${newWords.length} 个单词`);
    setTimeout(() => showFeedback(''), 3000);
    document.getElementById('wordInput').value = '';
}

// ========== 多模型 AI 助手 ==========
const AI_PROVIDERS = {
    deepseek: {
        name: 'DeepSeek',
        url: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        hint: '👉 platform.deepseek.com 注册获取，价格超低'
    },
    zhipu: {
        name: '智谱 GLM',
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        model: 'glm-4-flash',
        hint: '👉 open.bigmodel.cn 注册获取，有免费额度可用'
    },
    moonshot: {
        name: 'Kimi',
        url: 'https://api.moonshot.cn/v1/chat/completions',
        model: 'moonshot-v1-8k',
        hint: '👉 platform.moonshot.cn 注册获取'
    }
};

function getAIConfig() {
    const provider = localStorage.getItem('aiProvider') || 'deepseek';
    // 兼容旧版 deepseekApiKey 存储方式
    const key = localStorage.getItem(`aiKey_${provider}`)
             || (provider === 'deepseek' ? localStorage.getItem('deepseekApiKey') : '')
             || '';
    return { provider, key, ...AI_PROVIDERS[provider] };
}

function selectProvider(provider) {
    localStorage.setItem('aiProvider', provider);
    document.querySelectorAll('.provider-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.provider === provider);
    });
    document.getElementById('providerHint').textContent = AI_PROVIDERS[provider].hint;
    // 显示该服务已存的 Key
    const saved = localStorage.getItem(`aiKey_${provider}`)
               || (provider === 'deepseek' ? localStorage.getItem('deepseekApiKey') : '')
               || '';
    document.getElementById('apiKeyInput').value = saved;
}

function showAPIKeyDialog() {
    const config = getAIConfig();
    document.querySelectorAll('.provider-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.provider === config.provider);
    });
    document.getElementById('providerHint').textContent = config.hint;
    document.getElementById('apiKeyInput').value = config.key;
    document.getElementById('apiKeyDialog').style.display = 'flex';
}

function closeAPIKeyDialog() {
    document.getElementById('apiKeyDialog').style.display = 'none';
}

function saveAISettings() {
    const provider = localStorage.getItem('aiProvider') || 'deepseek';
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key) {
        showFeedback('⚠️ 请输入 API Key');
        return;
    }
    localStorage.setItem(`aiKey_${provider}`, key);
    // 同步写旧 key，保持向后兼容
    if (provider === 'deepseek') localStorage.setItem('deepseekApiKey', key);
    closeAPIKeyDialog();
    showFeedback(`✅ ${AI_PROVIDERS[provider].name} Key 已保存`);
    setTimeout(() => showFeedback(''), 2000);
}

function showAIChat() {
    if (!currentWord) {
        showFeedback('⚠️ 请先选择一个单词');
        return;
    }
    const config = getAIConfig();
    if (!config.key) {
        showFeedback('⚠️ 请先配置 AI Key（点右下角 ⚙️）');
        setTimeout(() => showAPIKeyDialog(), 1000);
        return;
    }
    document.getElementById('aiChatWord').textContent = currentWord.word;
    document.getElementById('aiChatHistory').innerHTML =
        `<p style="color:#aaa">用 ${config.name} 来帮你～可以问造句、词根、近义词…</p>`;
    document.getElementById('aiChatInput').value = '';
    document.getElementById('aiChatDialog').style.display = 'flex';
    document.getElementById('aiChatInput').focus();
}

function closeAIChat() {
    document.getElementById('aiChatDialog').style.display = 'none';
}

async function sendAIQuestion() {
    const input = document.getElementById('aiChatInput');
    const question = input.value.trim();
    if (!question || !currentWord) return;

    const config = getAIConfig();
    if (!config.key) {
        showFeedback('⚠️ 请先配置 API Key');
        return;
    }

    const history = document.getElementById('aiChatHistory');
    history.innerHTML += `<p><strong>你：</strong>${question}</p>`;
    history.innerHTML += `<p id="aiThinking" style="color:#aaa">${config.name} 思考中…</p>`;
    history.scrollTop = history.scrollHeight;
    input.value = '';

    try {
        const response = await fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是英语单词学习助手，回答时中英文结合：英文例句/词汇用英文写，后面紧跟中文翻译或解释。格式简洁，适合中小学生阅读。'
                    },
                    {
                        role: 'user',
                        content: `单词：${currentWord.word}（${currentWord.meaning}）\n问题：${question}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();
        document.getElementById('aiThinking')?.remove();

        if (data.error) throw new Error(data.error.message);

        const answer = data.choices[0]?.message?.content || '无法获取回答';
        history.innerHTML += `<p><strong>${config.name}：</strong>${answer.replace(/\n/g, '<br>')}</p>`;
    } catch (e) {
        document.getElementById('aiThinking')?.remove();
        history.innerHTML += `<p style="color:#e53935">错误：${e.message}</p>`;
    }

    history.scrollTop = history.scrollHeight;
}

// ========== 课本单元 ==========
let selectedGrade = '三年级';
let selectedTerm  = '上学期';
let selectedUnit  = null;

function showCurriculumDialog() {
    selectedGrade = '三年级';
    selectedTerm  = '上学期';
    selectedUnit  = null;
    refreshGradeTab();
    refreshTermTab();
    renderUnitList();
    document.getElementById('unitPreview').style.display = 'none';
    document.getElementById('curriculumDialog').style.display = 'flex';
}

function closeCurriculumDialog() {
    document.getElementById('curriculumDialog').style.display = 'none';
}

function selectGrade(grade) {
    selectedGrade = grade;
    selectedUnit  = null;
    refreshGradeTab();
    refreshTermTab();
    renderUnitList();
    document.getElementById('unitPreview').style.display = 'none';
}

function selectTerm(term) {
    selectedTerm = term;
    selectedUnit = null;
    refreshTermTab();
    renderUnitList();
    document.getElementById('unitPreview').style.display = 'none';
}

function refreshGradeTab() {
    document.querySelectorAll('#gradeTab .cur-tab').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === selectedGrade);
    });
}

function refreshTermTab() {
    document.querySelectorAll('#termTab .cur-tab').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === selectedTerm);
    });
}

function renderUnitList() {
    const units = curriculum[selectedGrade]?.[selectedTerm];
    if (!units) return;
    document.getElementById('unitList').innerHTML = Object.keys(units).map(unit =>
        `<button class="unit-btn" onclick="selectUnit('${unit.replace(/'/g, "\\'")}')">${unit}</button>`
    ).join('');
}

function selectUnit(unit) {
    selectedUnit = unit;
    // 高亮选中
    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === unit);
    });
    // 预览单词
    const words = curriculum[selectedGrade]?.[selectedTerm]?.[unit] || [];
    document.getElementById('previewCount').textContent = `（${words.length} 个单词）`;
    document.getElementById('previewWords').innerHTML = words.map(w =>
        `<span class="preview-chip">${w.word} <small>${w.meaning}</small></span>`
    ).join('');
    document.getElementById('unitPreview').style.display = 'block';
}

function loadUnitWords(mode) {
    if (!selectedUnit) {
        showFeedback('⚠️ 请先选择一个单元');
        return;
    }
    const words = curriculum[selectedGrade]?.[selectedTerm]?.[selectedUnit] || [];
    if (words.length === 0) return;

    if (mode === 'replace') {
        wordList = [...words];
    } else {
        words.forEach(w => {
            if (!wordList.some(existing => existing.word === w.word)) {
                wordList.push(w);
            }
        });
    }
    localStorage.setItem('customWords', JSON.stringify(wordList));
    closeCurriculumDialog();
    showFeedback(`✅ 已加载「${selectedUnit}」${words.length} 个单词`);
    setTimeout(() => { showFeedback(''); newWord(); }, 1500);
}

// ========== 词库加载 ==========
window.addEventListener('DOMContentLoaded', () => {
    const savedWords = localStorage.getItem('customWords');
    if (savedWords) {
        try {
            const customWords = JSON.parse(savedWords);
            if (Array.isArray(customWords) && customWords.length > 0) {
                wordList = customWords;
            }
        } catch (e) {
            console.error('加载自定义词库失败:', e);
        }
    }
});
