let currentWord = null;
let score = 0;
let streak = 0;
let mistakesList = [];

// 音效
const correctSound = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFbgCenp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6e//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjM1AAAAAAAAAAAAAAAAJAYAAAAAAAAABWgqf0j/////');
const wrongSound = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFbgCenp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6e//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjM1AAAAAAAAAAAAAAAAJAQAAAAAAAAABWiYxGL/////');

function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
}

function updateStreak(correct) {
    if (correct) {
        streak++;
    } else {
        streak = 0;
    }
    document.getElementById('streak').textContent = streak;
}

function newWord() {
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];
    document.getElementById('currentWord').textContent = '?????';
    document.getElementById('phonetic').textContent = currentWord.phonetic;
    document.getElementById('meaning').textContent = currentWord.meaning;
    document.getElementById('memoryTip').textContent = currentWord.memoryTip;
    document.getElementById('feedback').innerHTML = '';
    setupGame();
}

function setupGame() {
    const letters = currentWord.word.split('').sort(() => Math.random() - 0.5);
    const slots = document.getElementById('slots');
    const letterContainer = document.getElementById('letters');
    
    slots.innerHTML = letters.map(() => 
        `<div class="slot" ondrop="drop(event)" ondragover="allowDrop(event)"></div>`
    ).join('');
    
    letterContainer.innerHTML = letters.map(letter => 
        `<div class="letter" draggable="true" ondragstart="drag(event)" 
              ontouchstart="touchStart(event)" ontouchmove="touchMove(event)" 
              ontouchend="touchEnd(event)">${letter}</div>`
    ).join('');
}

function playCurrentWord() {
    if (currentWord && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentWord.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
}

function showHint() {
    document.getElementById('currentWord').textContent = currentWord.word;
    setTimeout(() => {
        document.getElementById('currentWord').textContent = '?????';
    }, 1000);
}

function reviewMistakes() {
    if (mistakesList.length > 0) {
        currentWord = mistakesList.shift();
        document.getElementById('currentWord').textContent = '?????';
        document.getElementById('phonetic').textContent = currentWord.phonetic;
        document.getElementById('meaning').textContent = currentWord.meaning;
        document.getElementById('memoryTip').textContent = currentWord.memoryTip;
        document.getElementById('feedback').innerHTML = '复习模式';
        setupGame();
    } else {
        document.getElementById('feedback').innerHTML = '没有需要复习的单词';
    }
}

// 触摸支持
let touchElement = null;

function touchStart(event) {
    event.preventDefault();
    touchElement = event.target;
    touchElement.style.opacity = '0.5';
}

function touchMove(event) {
    if (!touchElement) return;
    event.preventDefault();
    const touch = event.touches[0];
    touchElement.style.position = 'fixed';
    touchElement.style.left = touch.pageX - 25 + 'px';
    touchElement.style.top = touch.pageY - 25 + 'px';
    touchElement.style.zIndex = '1000';
}

function touchEnd(event) {
    if (!touchElement) return;
    
    const slots = document.querySelectorAll('.slot');
    const touch = event.changedTouches[0];
    let dropped = false;
    
    slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        if (touch.pageX >= rect.left && touch.pageX <= rect.right &&
            touch.pageY >= rect.top && touch.pageY <= rect.bottom &&
            slot.children.length === 0) {
            slot.innerHTML = `<div class="letter">${touchElement.textContent}</div>`;
            touchElement.remove();
            dropped = true;
            checkAnswer();
        }
    });
    
    if (!dropped) {
        touchElement.style.position = '';
        touchElement.style.opacity = '1';
    }
    touchElement = null;
}

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.textContent); }

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const targetSlot = ev.target.classList.contains('slot') ? ev.target : ev.target.parentNode;
    
    if(targetSlot.children.length === 0) {
        targetSlot.innerHTML = `<div class="letter">${data}</div>`;
        checkAnswer();
    }
}

// 在文件开头添加新的状态变量
let statistics = {
    totalLearned: 0,
    correctRate: 0,
    totalAttempts: 0,
    successfulAttempts: 0,
    learnedWords: [],
    lastStudyDate: null
};

let reviewSchedule = {
    intervals: [1, 2, 4, 7, 15, 30],
    words: {}
};

// 加载保存的进度
window.addEventListener('load', () => {
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        score = progress.score || 0;
        streak = progress.streak || 0;
        mistakesList = progress.mistakesList || [];
        statistics = progress.statistics || statistics;
        reviewSchedule = progress.reviewSchedule || reviewSchedule;
        
        // 更新显示
        document.getElementById('score').textContent = score;
        document.getElementById('streak').textContent = streak;
        document.getElementById('totalLearned').textContent = statistics.totalLearned;
        document.getElementById('correctRate').textContent = statistics.correctRate + '%';
    }
    
    // 每小时检查一次需要复习的单词
    setInterval(checkReviewWords, 60 * 60 * 1000);
    checkReviewWords(); // 立即检查一次
});

// 保存进度
function saveProgress() {
    const progress = {
        score,
        streak,
        mistakesList,
        statistics,
        reviewSchedule
    };
    localStorage.setItem('learningProgress', JSON.stringify(progress));
}

// 检查需要复习的单词
function checkReviewWords() {
    const now = new Date().getTime();
    const wordsToReview = [];
    
    for (let word in reviewSchedule.words) {
        if (now >= reviewSchedule.words[word].nextReview) {
            wordsToReview.push(word);
        }
    }
    
    if (wordsToReview.length > 0) {
        document.getElementById('reviewMistakes').textContent = 
            `复习(${wordsToReview.length})`;
    }
}

// 修改 checkAnswer 函数
function checkAnswer() {
    const slots = [...document.querySelectorAll('.slot')];
    const answer = slots.map(slot => 
        slot.children[0]?.textContent || ''
    ).join('');

    statistics.totalAttempts++;
    
    if(answer === currentWord.word) {
        // 更新统计
        statistics.successfulAttempts++;
        statistics.correctRate = (statistics.successfulAttempts / statistics.totalAttempts * 100).toFixed(1);
        if (!statistics.learnedWords.includes(currentWord.word)) {
            statistics.totalLearned++;
            statistics.learnedWords.push(currentWord.word);
        }
        
        // 更新复习计划
        const now = new Date().getTime();
        const wordSchedule = reviewSchedule.words[currentWord.word] || { stage: 0 };
        const nextStage = Math.min(wordSchedule.stage + 1, reviewSchedule.intervals.length - 1);
        reviewSchedule.words[currentWord.word] = {
            nextReview: now + reviewSchedule.intervals[nextStage] * 24 * 60 * 60 * 1000,
            stage: nextStage
        };
        
        // 更新显示
        document.getElementById('totalLearned').textContent = statistics.totalLearned;
        document.getElementById('correctRate').textContent = statistics.correctRate + '%';
        
        // 保存进度
        saveProgress();
        
        // 原有的正确答案处理代码
        document.getElementById('feedback').innerHTML = "🎉 太棒了！";
        document.getElementById('currentWord').textContent = currentWord.word;
        
        correctSound.play()
            .then(() => {
                const praise = new SpeechSynthesisUtterance("你真棒");
                praise.lang = 'zh-CN';
                praise.volume = 1;
                praise.rate = 1;
                speechSynthesis.speak(praise);
                
                setTimeout(() => {
                    const wordSpeak = new SpeechSynthesisUtterance(currentWord.word);
                    wordSpeak.lang = 'en-US';
                    wordSpeak.rate = 0.8;
                    speechSynthesis.speak(wordSpeak);
                }, 1000);
            });
            
        updateScore(5 * currentWord.difficulty);
        updateStreak(true);
        setTimeout(newWord, 3000);
    } else if(slots.every(s => s.children.length > 0)) {
        // 原有的错误答案处理代码保持不变
        document.getElementById('feedback').innerHTML = "❌ 再试试~";
        wrongSound.play()
            .then(() => {
                const encouragement = new SpeechSynthesisUtterance("加油，再试一次");
                encouragement.lang = 'zh-CN';
                encouragement.rate = 1;
                speechSynthesis.speak(encouragement);
            });
        
        if (!mistakesList.includes(currentWord)) {
            mistakesList.push(currentWord);
        }
        updateStreak(false);
        setTimeout(() => slots.forEach(s => s.innerHTML = ""), 1500);
    }
}

// 修改 reviewMistakes 函数
function reviewMistakes() {
    const now = new Date().getTime();
    const wordsToReview = [];
    
    // 合并错误单词和需要复习的单词
    for (let word in reviewSchedule.words) {
        if (now >= reviewSchedule.words[word].nextReview) {
            const wordData = wordList.find(w => w.word === word);
            if (wordData) wordsToReview.push(wordData);
        }
    }
    wordsToReview.push(...mistakesList);
    
    if (wordsToReview.length > 0) {
        currentWord = wordsToReview[0];
        document.getElementById('currentWord').textContent = '?????';
        document.getElementById('phonetic').textContent = currentWord.phonetic;
        document.getElementById('meaning').textContent = currentWord.meaning;
        document.getElementById('memoryTip').textContent = currentWord.memoryTip;
        document.getElementById('feedback').innerHTML = '复习模式';
        setupGame();
    } else {
        document.getElementById('feedback').innerHTML = '没有需要复习的单词';
    }
}

// 页面加载完成后自动开始游戏
window.onload = newWord;

// 在文件开头添加
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splashScreen').classList.add('hide');
    }, 2000);
});


function showImportDialog() {
    document.getElementById('importDialog').style.display = 'block';
}

function closeImportDialog() {
    document.getElementById('importDialog').style.display = 'none';
}

// 百度翻译 API 配置
const BAIDU_APP_ID = '20250325002314365';
const BAIDU_KEY = 'OUQbS1aNR0HQFYWilaAH';

// 生成百度翻译 API 签名
function generateSign(query, salt) {
    const str = BAIDU_APP_ID + query + salt + BAIDU_KEY;
    return CryptoJS.MD5(str).toString();
}

// 修改百度翻译 API 的请求地址和参数
// 修改翻译函数
async function translateToZh(text) {
    const salt = Date.now().toString();
    const sign = generateSign(text, salt);
    
    try {
        const response = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `q=${encodeURIComponent(text)}&from=en&to=zh&appid=${BAIDU_APP_ID}&salt=${salt}&sign=${sign}`
        });
        
        const data = await response.json();
        console.log('百度翻译结果:', data);
        
        if (data.error_code) {
            console.error('翻译错误:', data.error_msg);
            return text;
        }
        
        return data.trans_result?.[0]?.dst || text;
    } catch (e) {
        console.error('翻译请求失败:', e);
        return text;
    }
}

// 修改获取单词信息的函数
async function fetchWordInfo(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        
        if (data && data[0]) {
            const wordInfo = data[0];
            const englishMeaning = wordInfo.meanings[0]?.definitions[0]?.definition || '';
            
            // 确保英文释义不为空再进行翻译
            let chineseMeaning = '';
            if (englishMeaning) {
                chineseMeaning = await translateToZh(englishMeaning);
                console.log('英文释义:', englishMeaning);
                console.log('中文翻译:', chineseMeaning);
            }
            
            return {
                word: word,
                phonetic: wordInfo.phonetic || wordInfo.phonetics[0]?.text || '',
                meaning: chineseMeaning || englishMeaning,
                memoryTip: `记忆提示：${word} - ${chineseMeaning || englishMeaning}`,
                difficulty: Math.min(Math.ceil(word.length / 3), 5)
            };
        }
    } catch (e) {
        console.error('获取单词信息失败:', word, e);
    }
    return null;
}

// 修改导入函数
// 删除重复的 importWords 函数，只保留这一个版本
async function importWords() {
    const input = document.getElementById('wordInput').value;
    const lines = input.split('\n').filter(line => line.trim());

    document.getElementById('feedback').innerHTML = '正在导入...';

    const newWords = [];
    for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        const wordName = parts[0].toLowerCase();
        if (!wordName) continue;

        if (parts.length >= 3) {
            // 用户已提供完整格式，直接使用
            newWords.push({
                word: wordName,
                phonetic: parts[1] || '',
                meaning: parts[2] || '',
                memoryTip: parts[3] || '',
                difficulty: parseInt(parts[4]) || 1
            });
        } else {
            // 只有单词，用 AI 自动查询
            document.getElementById('feedback').innerHTML =
                `AI 查询中：${wordName}（${newWords.length + 1}/${lines.length}）`;
            let wordInfo = null;
            try {
                wordInfo = await fetchWordInfoWithAI(wordName);
            } catch (e) {
                console.error('AI查询失败:', wordName, e);
                document.getElementById('feedback').innerHTML =
                    `❌ AI 错误：${e.message}`;
                await new Promise(r => setTimeout(r, 3000));
            }
            newWords.push(wordInfo || {
                word: wordName,
                phonetic: '',
                meaning: '',
                memoryTip: '',
                difficulty: Math.min(Math.ceil(wordName.length / 3), 5)
            });
        }
    }

    // 判断是否替换模式
    const replaceMode = document.getElementById('replaceMode')?.checked;
    if (replaceMode) {
        wordList = newWords;
        localStorage.setItem('onlyCustomWords', '1');
    } else {
        newWords.forEach(word => {
            if (!wordList.some(w => w.word === word.word)) {
                wordList.push(word);
            }
        });
    }

    // 保存到 localStorage
    localStorage.setItem('customWords', JSON.stringify(wordList));
    
    // 关闭弹窗并显示提示
    closeImportDialog();
    document.getElementById('feedback').innerHTML = 
        `✅ 成功导入 ${newWords.length} 个单词`;
    
    // 清空输入框
    document.getElementById('wordInput').value = '';
}

// 修改加载逻辑
window.addEventListener('load', async () => {
    const onlyCustom = localStorage.getItem('onlyCustomWords') === '1';

    if (!onlyCustom) {
        // 加载默认词库
        try {
            const response = await fetch('wordlist.js');
            const text = await response.text();
            const match = text.match(/const\s+wordList\s*=\s*(\[[\s\S]*\])/);
            if (match) {
                wordList = JSON.parse(match[1]);
            }
        } catch (e) {
            console.error('加载默认词库失败:', e);
            wordList = [];
        }
    } else {
        wordList = [];
    }

    // 加载自定义单词
    const savedWords = localStorage.getItem('customWords');
    if (savedWords) {
        const customWords = JSON.parse(savedWords);
        customWords.forEach(word => {
            if (!wordList.some(w => w.word === word.word)) {
                wordList.push(word);
            }
        });
    }

    // 加载其他保存的进度
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        score = progress.score || 0;
        streak = progress.streak || 0;
        mistakesList = progress.mistakesList || [];
        statistics = progress.statistics || statistics;
        reviewSchedule = progress.reviewSchedule || reviewSchedule;
        
        // 更新显示
        document.getElementById('score').textContent = score;
        document.getElementById('streak').textContent = streak;
        document.getElementById('totalLearned').textContent = statistics.totalLearned;
        document.getElementById('correctRate').textContent = statistics.correctRate + '%';
    }
    
    // 开始游戏
    newWord();
});


// 有道翻译 API 配置
const YOUDAO_APP_KEY = 'rUZqTMQ8wmxQOu021d1HY6piWxsWa2M4';

// 修改翻译函数
async function translateToZh(text) {
    try {
        const response = await fetch(`https://openapi.youdao.com/api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                q: text,
                from: 'en',
                to: 'zh-CHS',
                appKey: YOUDAO_APP_KEY,
                salt: Date.now(),
                sign: generateSign(text, YOUDAO_APP_KEY),
                signType: 'v3'
            })
        });
        
        const data = await response.json();
        console.log('有道翻译结果:', data);
        
        if (data.errorCode === '0' && data.translation && data.translation[0]) {
            return data.translation[0];
        } else {
            console.error('翻译错误:', data.errorCode);
            return text;
        }
    } catch (e) {
        console.error('翻译请求失败:', e);
        return text;
    }
}

// 生成有道翻译 API 签名
function generateSign(text, appKey) {
    const input = text.length <= 20 ? text : text.substring(0, 10) + text.length + text.substring(text.length - 10);
    const salt = Date.now();
    const curtime = Math.round(salt / 1000);
    const str = appKey + input + salt + curtime;
    return CryptoJS.SHA256(str).toString();
}

function initializeLetters(word) {
    const lettersContainer = document.getElementById('letters');
    lettersContainer.innerHTML = '';
    
    const shuffledLetters = word.split('').sort(() => Math.random() - 0.5);
    
    shuffledLetters.forEach((letter, index) => {
        const letterButton = document.createElement('button');
        letterButton.className = 'letter-btn';
        letterButton.textContent = letter;
        letterButton.setAttribute('data-index', index);
        
        // 单击事件
        letterButton.addEventListener('click', function() {
            if (this.classList.contains('used')) {
                // 如果字母已被使用，找到对应的槽并清空
                const slots = document.querySelectorAll('.slot');
                slots.forEach(slot => {
                    if (slot.textContent === letter) {
                        slot.textContent = '';
                        this.classList.remove('used');
                    }
                });
            } else {
                // 如果字母未使用，填入第一个空槽
                const emptySlot = document.querySelector('.slot:empty');
                if (emptySlot) {
                    emptySlot.textContent = letter;
                    this.classList.add('used');
                    checkWord();
                }
            }
        });
        
        lettersContainer.appendChild(letterButton);
    });
}

// 添加提示按钮
function addHintButton() {
    const footer = document.querySelector('footer .button-group');
    const hintButton = document.createElement('button');
    hintButton.className = 'secondary-btn';
    hintButton.textContent = '提示';
    hintButton.onclick = showHint;
    footer.appendChild(hintButton);
}

// 显示提示
function showHint() {
    const currentWord = document.getElementById('currentWord').textContent;
    const firstLetter = currentWord[0];
    const slots = document.querySelectorAll('.slot');
    const letters = document.querySelectorAll('.letter-btn');

    // 清空第一个槽并填入正确的字母
    if (slots[0]) {
        slots[0].textContent = firstLetter;
        // 找到对应的字母按钮并标记为已使用
        letters.forEach(letter => {
            if (letter.textContent === firstLetter) {
                letter.classList.add('used');
            }
        });
    }
}

// ========== DeepSeek AI 集成 ==========

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

function getDeepSeekKey() {
    return localStorage.getItem('deepseekApiKey') || '';
}

async function callDeepSeek(messages, maxTokens = 400) {
    const apiKey = getDeepSeekKey();
    if (!apiKey) {
        showAPIKeyDialog();
        throw new Error('请先配置 DeepSeek API Key');
    }
    const response = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            temperature: 0.7,
            max_tokens: maxTokens
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0]?.message?.content || '';
}

// 导入单词时 AI 自动补全信息
async function fetchWordInfoWithAI(word) {
    const content = await callDeepSeek([{
        role: 'user',
        content: `请为英语单词"${word}"提供以下信息，只返回JSON，不要任何其他内容：
{"phonetic":"国际音标（如/hɛˈloʊ/）","meaning":"中文释义（10字以内）","memoryTip":"联想记忆法（20字以内）"}`
    }], 200);
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
        const info = JSON.parse(match[0]);
        return {
            word,
            phonetic: info.phonetic || '',
            meaning: info.meaning || word,
            memoryTip: info.memoryTip || '',
            difficulty: Math.min(Math.ceil(word.length / 3), 5)
        };
    }
    return null;
}

// API Key 管理
function showAPIKeyDialog() {
    document.getElementById('apiKeyInput').value = getDeepSeekKey();
    document.getElementById('apiKeyDialog').style.display = 'block';
}

function closeAPIKeyDialog() {
    document.getElementById('apiKeyDialog').style.display = 'none';
}

function saveAPIKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key) return;
    localStorage.setItem('deepseekApiKey', key);
    closeAPIKeyDialog();
    document.getElementById('feedback').innerHTML = '✅ API Key 已保存';
}

// AI 助手对话
function showAIChat() {
    if (!currentWord) return;
    document.getElementById('aiChatWord').textContent = currentWord.word;
    document.getElementById('aiChatHistory').innerHTML =
        `<p style="color:#999">可以问：造句、词根、近义词、用法区别…</p>`;
    document.getElementById('aiChatInput').value = '';
    document.getElementById('aiChatDialog').style.display = 'block';
    document.getElementById('aiChatInput').focus();
}

function closeAIChat() {
    document.getElementById('aiChatDialog').style.display = 'none';
}

async function sendAIQuestion() {
    const input = document.getElementById('aiChatInput');
    const question = input.value.trim();
    if (!question || !currentWord) return;

    const history = document.getElementById('aiChatHistory');
    history.innerHTML += `<p><strong>你：</strong>${question}</p>`;
    const thinkingTag = `<p id="aiThinking" style="color:#aaa">AI 思考中…</p>`;
    history.innerHTML += thinkingTag;
    history.scrollTop = history.scrollHeight;
    input.value = '';

    try {
        const answer = await callDeepSeek([
            { role: 'system', content: '你是英语单词学习助手，回答时中英文结合：英文例句/词汇用英文写，后面紧跟中文翻译或解释。格式简洁，适合学生阅读。' },
            { role: 'user', content: `单词：${currentWord.word}（${currentWord.meaning}）\n问题：${question}` }
        ], 500);

        document.getElementById('aiThinking')?.remove();
        history.innerHTML += `<p><strong>AI：</strong>${answer.replace(/\n/g, '<br>')}</p>`;
    } catch (e) {
        document.getElementById('aiThinking')?.remove();
        history.innerHTML += `<p style="color:red">错误：${e.message}</p>`;
    }
    history.scrollTop = history.scrollHeight;
}