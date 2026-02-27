const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');

// ------------------- الإعدادات الثابتة -------------------
const SYMBOLS_COUNT = 8;
const ICONS = ['🥕', '🦐', '🍅', '🍗', '🌽', '🥩', '🥦', '🐟'];
const NAMES = ['جزر', 'روبيان', 'طماط', 'دجاج', 'ذره', 'استيك', 'بروكلي', 'سمكه'];
const MULTIPLIERS = [5, 10, 5, 15, 5, 25, 5, 45];  // للاستخدام الداخلي فقط

const WINDOW_SIZE = 29;
const SMOOTHING = 1.0;
const DATA_FILE = path.join(__dirname, 'shared_data.json');

// ------------------- البيانات المشتركة -------------------
let sharedData = {
    allCounts: Array(SYMBOLS_COUNT).fill(0),
    recent: [],
    totalAll: 0,
    correctPredictions: 0,
    totalPredictions: 0,
    transitionCounts: Array(SYMBOLS_COUNT).fill().map(() => Array(SYMBOLS_COUNT).fill(0)),
    transitionCounts3: {}  // key: "a,b,c" -> array[8]
};

// ------------------- دوال التخزين -------------------
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readJsonSync(DATA_FILE);
            sharedData.allCounts = data.allCounts || Array(SYMBOLS_COUNT).fill(0);
            sharedData.recent = data.recent || [];
            sharedData.totalAll = data.totalAll || 0;
            sharedData.correctPredictions = data.correctPredictions || 0;
            sharedData.totalPredictions = data.totalPredictions || 0;
            sharedData.transitionCounts = data.transitionCounts || Array(SYMBOLS_COUNT).fill().map(() => Array(SYMBOLS_COUNT).fill(0));
            // تحويل transitionCounts3 من كائن JSON
            const trans3 = data.transitionCounts3 || {};
            sharedData.transitionCounts3 = {};
            for (const [key, value] of Object.entries(trans3)) {
                sharedData.transitionCounts3[key] = value;
            }
        } catch (e) {
            console.error('خطأ في قراءة ملف البيانات:', e);
        }
    }
}

function saveData() {
    try {
        const dataToSave = {
            allCounts: sharedData.allCounts,
            recent: sharedData.recent,
            totalAll: sharedData.totalAll,
            correctPredictions: sharedData.correctPredictions,
            totalPredictions: sharedData.totalPredictions,
            transitionCounts: sharedData.transitionCounts,
            transitionCounts3: sharedData.transitionCounts3
        };
        fs.writeJsonSync(DATA_FILE, dataToSave, { spaces: 2 });
    } catch (e) {
        console.error('خطأ في حفظ ملف البيانات:', e);
    }
}

loadData();

// ------------------- دوال تحديث البيانات -------------------
function addResult(symbol) {
    if (symbol < 0 || symbol >= SYMBOLS_COUNT) return false;

    // تحديث انتقالات الدرجة الأولى
    if (sharedData.recent.length > 0) {
        const last = sharedData.recent[sharedData.recent.length - 1];
        sharedData.transitionCounts[last][symbol] += 1;
    }

    // تحديث انتقالات الدرجة الثالثة
    if (sharedData.recent.length >= 3) {
        const a = sharedData.recent[sharedData.recent.length - 3];
        const b = sharedData.recent[sharedData.recent.length - 2];
        const c = sharedData.recent[sharedData.recent.length - 1];
        const key = `${a},${b},${c}`;
        if (!sharedData.transitionCounts3[key]) {
            sharedData.transitionCounts3[key] = Array(SYMBOLS_COUNT).fill(0);
        }
        sharedData.transitionCounts3[key][symbol] += 1;
    }

    // تحديث العد العام والتسلسل
    sharedData.allCounts[symbol] += 1;
    sharedData.recent.push(symbol);
    if (sharedData.recent.length > WINDOW_SIZE) {
        sharedData.recent.shift();
    }
    sharedData.totalAll += 1;
    saveData();
    return true;
}

function addMultipleResults(symbols) {
    // محاكاة التسلسل باستخدام نسخة مؤقتة من recent
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');

// ------------------- الإعدادات الثابتة -------------------
const SYMBOLS_COUNT = 8;
const ICONS = ['🥕', '🦐', '🍅', '🍗', '🌽', '🥩', '🥦', '🐟'];
const NAMES = ['جزر', 'روبيان', 'طماط', 'دجاج', 'ذره', 'استيك', 'بروكلي', 'سمكه'];
const MULTIPLIERS = [5, 10, 5, 15, 5, 25, 5, 45];  // للاستخدام الداخلي فقط

const WINDOW_SIZE = 29;
const SMOOTHING = 1.0;
const DATA_FILE = path.join(__dirname, 'shared_data.json');

// ------------------- البيانات المشتركة -------------------
let sharedData = {
    allCounts: Array(SYMBOLS_COUNT).fill(0),
    recent: [],
    totalAll: 0,
    correctPredictions: 0,
    totalPredictions: 0,
    transitionCounts: Array(SYMBOLS_COUNT).fill().map(() => Array(SYMBOLS_COUNT).fill(0)),
    transitionCounts3: {}  // key: "a,b,c" -> array[8]
};

// ------------------- دوال التخزين -------------------
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readJsonSync(DATA_FILE);
            sharedData.allCounts = data.allCounts || Array(SYMBOLS_COUNT).fill(0);
            sharedData.recent = data.recent || [];
            sharedData.totalAll = data.totalAll || 0;
            sharedData.correctPredictions = data.correctPredictions || 0;
            sharedData.totalPredictions = data.totalPredictions || 0;
            sharedData.transitionCounts = data.transitionCounts || Array(SYMBOLS_COUNT).fill().map(() => Array(SYMBOLS_COUNT).fill(0));
            // تحويل transitionCounts3 من كائن JSON
            const trans3 = data.transitionCounts3 || {};
            sharedData.transitionCounts3 = {};
            for (const [key, value] of Object.entries(trans3)) {
                sharedData.transitionCounts3[key] = value;
            }
        } catch (e) {
            console.error('خطأ في قراءة ملف البيانات:', e);
        }
    }
}

function saveData() {
    try {
        const dataToSave = {
            allCounts: sharedData.allCounts,
            recent: sharedData.recent,
            totalAll: sharedData.totalAll,
            correctPredictions: sharedData.correctPredictions,
            totalPredictions: sharedData.totalPredictions,
            transitionCounts: sharedData.transitionCounts,
            transitionCounts3: sharedData.transitionCounts3
        };
        fs.writeJsonSync(DATA_FILE, dataToSave, { spaces: 2 });
    } catch (e) {
        console.error('خطأ في حفظ ملف البيانات:', e);
    }
}

loadData();

// ------------------- دوال تحديث البيانات -------------------
function addResult(symbol) {
    if (symbol < 0 || symbol >= SYMBOLS_COUNT) return false;

    // تحديث انتقالات الدرجة الأولى
    if (sharedData.recent.length > 0) {
        const last = sharedData.recent[sharedData.recent.length - 1];
        sharedData.transitionCounts[last][symbol] += 1;
    }

    // تحديث انتقالات الدرجة الثالثة
    if (sharedData.recent.length >= 3) {
        const a = sharedData.recent[sharedData.recent.length - 3];
        const b = sharedData.recent[sharedData.recent.length - 2];
        const c = sharedData.recent[sharedData.recent.length - 1];
        const key = `${a},${b},${c}`;
        if (!sharedData.transitionCounts3[key]) {
            sharedData.transitionCounts3[key] = Array(SYMBOLS_COUNT).fill(0);
        }
        sharedData.transitionCounts3[key][symbol] += 1;
    }

    // تحديث العد العام والتسلسل
    sharedData.allCounts[symbol] += 1;
    sharedData.recent.push(symbol);
    if (sharedData.recent.length > WINDOW_SIZE) {
        sharedData.recent.shift();
    }
    sharedData.totalAll += 1;
    saveData();
    return true;
}

function addMultipleResults(symbols) {
    // محاكاة التسلسل باستخدام نسخة مؤقتة من recent
    const tempRecent = [...sharedData.recent];
    for (let i = 0; i < symbols.length; i++) {
        const sym = symbols[i];
        if (sym < 0 || sym >= SYMBOLS_COUNT) continue;

        // انتقالات الدرجة الأولى
        if (tempRecent.length > 0) {
            const last = tempRecent[tempRecent.length - 1];
            sharedData.transitionCounts[last][sym] += 1;
        }

        // انتقالات الدرجة الثالثة
        if (tempRecent.length >= 3) {
            const a = tempRecent[tempRecent.length - 3];
            const b = tempRecent[tempRecent.length - 2];
            const c = tempRecent[tempRecent.length - 1];
            const key = `${a},${b},${c}`;
            if (!sharedData.transitionCounts3[key]) {
                sharedData.transitionCounts3[key] = Array(SYMBOLS_COUNT).fill(0);
            }
            sharedData.transitionCounts3[key][sym] += 1;
        }

        // تحديث العد والإضافة إلى التسلسل المؤقت
        sharedData.allCounts[sym] += 1;
        tempRecent.push(sym);
        if (tempRecent.length > WINDOW_SIZE) {
            tempRecent.shift();
        }
        sharedData.totalAll += 1;
    }
    // تحديث recent الفعلي
    sharedData.recent = tempRecent;
    saveData();
}

function resetData() {
    sharedData.allCounts = Array(SYMBOLS_COUNT).fill(0);
    sharedData.recent = [];
    sharedData.totalAll = 0;
    sharedData.correctPredictions = 0;
    sharedData.totalPredictions = 0;
    sharedData.transitionCounts = Array(SYMBOLS_COUNT).fill().map(() => Array(SYMBOLS_COUNT).fill(0));
    sharedData.transitionCounts3 = {};
    saveData();
}

// ------------------- دوال الاحتمالات -------------------
function getGlobalProbabilities() {
    const total = sharedData.totalAll;
    if (total === 0) return Array(SYMBOLS_COUNT).fill(1 / SYMBOLS_COUNT);
    const smoothed = sharedData.allCounts.map(c => c + SMOOTHING);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map(v => v / sum);
}

function getLocalProbabilities() {
    const n = sharedData.recent.length;
    if (n === 0) return Array(SYMBOLS_COUNT).fill(1 / SYMBOLS_COUNT);
    const counts = Array(SYMBOLS_COUNT).fill(0);
    for (const sym of sharedData.recent) counts[sym] += 1;
    const smoothed = counts.map(c => c + SMOOTHING);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map(v => v / sum);
}

function getMarkov1Probabilities() {
    if (sharedData.recent.length === 0) return getLocalProbabilities();
    const last = sharedData.recent[sharedData.recent.length - 1];
    const row = sharedData.transitionCounts[last];
    const total = row.reduce((a, b) => a + b, 0);
    if (total === 0) return getLocalProbabilities();
    const smoothed = row.map(c => c + SMOOTHING);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map(v => v / sum);
}

function getMarkov3Probabilities() {
    if (sharedData.recent.length < 3) return getMarkov1Probabilities();
    const a = sharedData.recent[sharedData.recent.length - 3];
    const b = sharedData.recent[sharedData.recent.length - 2];
    const c = sharedData.recent[sharedData.recent.length - 1];
    const key = `${a},${b},${c}`;
    const row = sharedData.transitionCounts3[key] || Array(SYMBOLS_COUNT).fill(0);
    const total = row.reduce((a, b) => a + b, 0);
    if (total === 0) return getMarkov1Probabilities();
    const smoothed = row.map(cnt => cnt + SMOOTHING);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map(v => v / sum);
}

function getTop3Symbols() {
    const probs = getMarkov3Probabilities();
    const indexed = probs.map((p, i) => ({ symbol: i, prob: p }));
    indexed.sort((a, b) => b.prob - a.prob);
    return indexed.slice(0, 3).map(item => item.symbol);
}

// ------------------- دوال إنشاء الأزرار والنصوص -------------------
function getPredictionKeyboard(topSymbols) {
    const buttons = topSymbols.map(sym => ([{
        text: `${ICONS[sym]} ${NAMES[sym]}`,
        callback_data: `pred_${sym}`
    }]));
    buttons.push([{ text: '❌ إجابة خاطئة', callback_data: 'wrong' }]);
    buttons.push([{ text: '📊 إرسال الشريط', callback_data: 'send_strip' }]);
    return { reply_markup: { inline_keyboard: buttons } };
}

function getAllSymbolsKeyboard() {
    const buttons = [];
    for (let i = 0; i < SYMBOLS_COUNT; i++) {
        buttons.push([{
            text: `${ICONS[i]} ${NAMES[i]}`,
            callback_data: `correct_${i}`
        }]);
    }
    return { reply_markup: { inline_keyboard: buttons } };
}

function getSymbolsGuide() {
    let guide = '🔢 *الأرقام المخصصة لكل رمز:*\n';
    for (let i = 0; i < SYMBOLS_COUNT; i++) {
        guide += `${i} : ${ICONS[i]} ${NAMES[i]}\n`;
    }
    return guide;
}

function getStatsText() {
    const globalProbs = getGlobalProbabilities();
    const localProbs = getLocalProbabilities();
    const markov3Probs = getMarkov3Probabilities();
    const accuracy = sharedData.totalPredictions > 0 ? (sharedData.correctPredictions / sharedData.totalPredictions * 100).toFixed(2) : '0.00';
    let lines = [];
    lines.push('📊 *إحصائيات التعلم*');
    lines.push(`✅ توقعات صحيحة: ${sharedData.correctPredictions}`);
    lines.push(`🔮 إجمالي التوقعات: ${sharedData.totalPredictions}`);
    lines.push(`📈 دقة التوقع: ${accuracy}%\n`);
    lines.push('🎯 *الاحتمالات الحالية (التحليل درجة ثالثة)*\n');
    for (let i = 0; i < SYMBOLS_COUNT; i++) {
        const p = (markov3Probs[i] * 100).toFixed(2);
        lines.push(`${ICONS[i]} ${NAMES[i]} : ${p}% (مرات: ${sharedData.allCounts[i]})`);
    }
    lines.push('\n📊 *مقارنة مع الاحتمالات العامة والمحلية*\n');
    for (let i = 0; i < SYMBOLS_COUNT; i++) {
        const gp = (globalProbs[i] * 100).toFixed(2);
        const lp = (localProbs[i] * 100).toFixed(2);
        lines.push(`${ICONS[i]} ${NAMES[i]} : عام ${gp}% | محلي ${lp}%`);
    }
    lines.push(`\n📊 إجمالي الدورات: ${sharedData.totalAll}`);
    lines.push(`🔄 آخر ${sharedData.recent.length} ضربة في الشريط (الحد الأقصى ${WINDOW_SIZE})`);
    return lines.join('\n');
}

function parseNumbers(text) {
    const nums = [];
    for (const ch of text) {
        if (/\d/.test(ch)) {
            const d = parseInt(ch, 10);
            if (d >= 0 && d <= 7) nums.push(d);
        }
    }
    return nums;
}

// ------------------- إعداد البوت -------------------
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('❌ لم يتم تعيين TELEGRAM_BOT_TOKEN');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// حذف أي webhook قديم
(async () => {
    try {
        await bot.deleteWebHook();
        console.log('✅ تم حذف webhook القديم');
    } catch (e) {
        console.warn('⚠️ لا يمكن حذف webhook:', e.message);
    }
})();

// ------------------- خادم HTTP وهمي (لـ Render) -------------------
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running');
}).listen(PORT, () => {
    console.log(`🚀 خادم وهمي يستمع على المنفذ ${PORT}`);
});

// ------------------- معالجات الأوامر -------------------
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const guide = getSymbolsGuide();
    const text = `👋 مرحباً بك في بوت توقعات handhm go (نسخة التحليل من الدرجة الثالثة)!\n\n${guide}\n\nسأعرض لك كل دورة 3 توقعات بناءً على آخر 3 رموز ظهرت (نموذج التحليل من الدرجة الثالثة).\nبعد انتهاء الدورة، يمكنك:\n- الضغط على التوقع الصحيح إذا كان ضمن الـ 3.\n- الضغط على "❌ إجابة خاطئة" ثم اختيار الرمز الصحيح من القائمة.\n- الضغط على "📊 إرسال الشريط" لإدخال آخر 29 نتيجة دفعة واحدة (أرسل 29 رقماً من 0 إلى 7).\n\nالأوامر المتاحة:\n/stats - عرض الإحصائيات والاحتمالات الحالية\n/help - عرض هذه التعليمات\n\nلنبدأ التوقع الأول:`;
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    await sendPrediction(chatId);
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const guide = getSymbolsGuide();
    const text = `👋 *مساعدة البوت*\n\n${guide}\n\nيعتمد البوت على نموذج التحليل من الدرجة الثالثة (الاعتماد على آخر 3 رموز) لتوقع الرمز القادم.\nيمكنك التفاعل عبر الأزرار الموجودة في رسالة التوقع.\nالأوامر النصية:\n/stats - عرض الإحصائيات الحالية\n/start - إعادة تشغيل البوت\n\nعند الضغط على "📊 إرسال الشريط"، أرسل 29 رقماً (0-7) متتالية أو مفصولة بمسافات.`;
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const statsText = getStatsText();
    await bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
});

// ------------------- معالج الأزرار (callback query) -------------------
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;
    await bot.answerCallbackQuery(callbackQuery.id);

    if (data === 'send_strip') {
        // تخزين حالة المستخدم (يتم في الذاكرة المؤقتة)
        // نستخدم خاصية user_data عبر Map بسيط
        if (!userStates.has(chatId)) userStates.set(chatId, {});
        userStates.get(chatId).awaitingStrip = true;
        await bot.editMessageText('📥 الرجاء إرسال 29 رقمًا (0-7) تمثل آخر 29 نتيجة في الشريط، مفصولة بمسافات أو بدون فواصل (مثال: 2 5 1 0 3 7 4 6 ...).', {
            chat_id: chatId,
            message_id: msg.message_id
        });
        return;
    }

    if (data.startsWith('pred_')) {
        const symbol = parseInt(data.split('_')[1]);
        sharedData.correctPredictions += 1;
        sharedData.totalPredictions += 1;
        saveData();
        await bot.editMessageText(`✅ صحيح! الرمز ${ICONS[symbol]} كان ضمن توقعاتي.`, {
            chat_id: chatId,
            message_id: msg.message_id
        });
        addResult(symbol);
        await sendPrediction(chatId);
    } else if (data === 'wrong') {
        const keyboard = getAllSymbolsKeyboard();
        await bot.editMessageText('❌ اختر الرمز الصحيح من القائمة:', {
            chat_id: chatId,
            message_id: msg.message_id,
            ...keyboard
        });
    } else if (data.startsWith('correct_')) {
        const symbol = parseInt(data.split('_')[1]);
        sharedData.totalPredictions += 1;
        saveData();
        await bot.editMessageText(`✅ تم تسجيل الرمز الصحيح: ${ICONS[symbol]}.`, {
            chat_id: chatId,
            message_id: msg.message_id
        });
        addResult(symbol);
        await sendPrediction(chatId);
    }
});

// ------------------- معالج الرسائل النصية -------------------
const userStates = new Map(); // لتخزين حالة انتظار الشريط لكل مستخدم

bot.on('message', async (msg) => {
    if (!msg.text) return;
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (text.startsWith('/')) return;

    // التحقق من حالة انتظار الشريط
    const state = userStates.get(chatId);
    if (state && state.awaitingStrip) {
        const nums = parseNumbers(text);
        if (nums.length === 29) {
            addMultipleResults(nums);
            userStates.delete(chatId);
            await bot.sendMessage(chatId, `✅ تم تسجيل ${nums.length} نتيجة بنجاح. تم تحديث البيانات.`);
            const statsText = getStatsText();
            await bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
            await sendPrediction(chatId);
        } else {
            await bot.sendMessage(chatId, `❌ العدد غير صحيح. يجب أن ترسل 29 رقماً بالضبط. لقد أرسلت ${nums.length}. حاول مرة أخرى:`);
        }
        return;
    }

    // إذا كانت رسالة عادية تحتوي على عدة أرقام (تسجيل دفعة)
    const nums = parseNumbers(text);
    if (nums.length > 1) {
        addMultipleResults(nums);
        await bot.sendMessage(chatId, `✅ تم تسجيل ${nums.length} نتيجة بنجاح.`);
        const statsText = getStatsText();
        await bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
        await sendPrediction(chatId);
    }
    // إذا كان رقماً واحداً، لا نفعل شيء (يمكن تجاهله)
});

// دالة مساعدة لإرسال التوقعات
async function sendPrediction(chatId) {
    const topSymbols = getTop3Symbols();
    const keyboard = getPredictionKeyboard(topSymbols);
    await bot.sendMessage(
        chatId,
        '🔮 *توقعاتي للدورة القادمة (باستخدام نموذج التحليل من الدرجة الثالثة):*\nاختر الرمز الصحيح إذا كان ضمن الـ 3، أو اضغط "إجابة خاطئة" ثم اختر الرمز الصحيح.',
        { parse_mode: 'Markdown', ...keyboard }
    );
}

console.log('✅ البوت يعمل بنموذج التحليل من الدرجة الثالثة...');￼Enter    const tempRecent = [...sharedData.recent];
    for (let i = 0; i < symbols.length; i++) {
        const sym = symbols[i];
        if (sym < 0 || sym >= SYMBOLS_COUNT) continue;

        // انتقالات الدرجة الأولى
        if (tempRecent.length > 0) {
            const last = tempRecent[tempRecent.length - 1];
            sharedData.transitionCounts[last][sym] += 1;
        }

        // انتقالات الدرجة الثالثة
        if (tempRecent.length >= 3) {
            const a = tempRecent[tempRecent.length - 3];
            const b = tempRecent[tempRecent.length - 2];
            const c = tempRecent[tempRecent.length - 1];
            const key = `${a},${b},${c}`;
            if (!sharedData.transitionCounts3[key]) {
                sharedData.transitionCounts3[key] = Array(SYMBOLS_COUNT).fill(0);
            }
            sharedData.transitionCounts3[key][sym] += 1;
        }

        // تحديث العد والإضافة إلى التسلسل المؤقت
        sharedData.allCounts[sym] += 1;
        tempRecent.push(sym);
        if (tempRecent.length > WINDOW_SIZE) {
            tempRecent.shift();
        }
        sharedData.totalAll += 1;
    }
    // تحديث recent الفعلي
    sharedData.recent = tempRecent;
    saveData();
}

function resetData() {
    sharedData.allCounts = Array(SYMBOLS_COUNT).fill(0);
    sharedData.recent = [];
    sharedData.totalAll = 0;
    sharedData.correctPredictions = 0;
    sharedData.totalPredictions = 0;
    sharedData.transitionCounts = Array(SYMBOLS_COUNT).fill().map(() => Array(SYMBOLS_COUNT).fill(0));
    sharedData.transitionCounts3 = {};
    saveData();
}

// ------------------- دوال الاحتمالات -------------------
function getGlobalProbabilities() {
    const total = sharedData.totalAll;
    if (total === 0) return Array(SYMBOLS_COUNT).fill(1 / SYMBOLS_COUNT);
    const smoothed = sharedData.allCounts.map(c => c + SMOOTHING);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map(v => v / sum);
}

function getLocalProbabilities() {
    const n = sharedData.recent.length;
    if (n === 0) return Array(SYMBOLS_COUNT).fill(1 / SYMBOLS_COUNT);
    const counts = Array(SYMBOLS_COUNT).fill(0);
    for (const sym of sharedData.recent) counts[sym] += 1;
    const smoothed = counts.map(c => c + SMOOTHING);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map(v => v / sum);
}

function getMarkov1Probabilities() {
    if (sharedData.recent.length === 0) return getLocalProbabilities();
    const last = sharedData.recent[sharedData.recent.length - 1];
    const row = sharedData.transitionCounts[last];
    const total = row.reduce((a, b) => a + b, 0);
    if (total === 0) return getLocalProbabilities();
    const smoothed = row.map(c => c + SMOOTHING);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map(v => v / sum);
}

function getMarkov3Probabilities() {
    if (sharedData.recent.length < 3) return getMarkov1Probabilities();
    const a = sharedData.recent[sharedData.recent.length - 3];
    const b = sharedData.recent[sharedData.recent.length - 2];
    const c = sharedData.recent[sharedData.recent.length - 1];
    const key = `${a},${b},${c}`;
    const row = sharedData.transitionCounts3[key] || Array(SYMBOLS_COUNT).fill(0);
    const total = row.reduce((a, b) => a + b, 0);
    if (total === 0) return getMarkov1Probabilities();
    const smoothed = row.map(cnt => cnt + SMOOTHING);
    const sum = smoothed.reduce((a, b) => a + b, 0);
    return smoothed.map(v => v / sum);
}

function getTop3Symbols() {
    const probs = getMarkov3Probabilities();
    const indexed = probs.map((p, i) => ({ symbol: i, prob: p }));
    indexed.sort((a, b) => b.prob - a.prob);
    return indexed.slice(0, 3).map(item => item.symbol);
}

// ------------------- دوال إنشاء الأزرار والنصوص -------------------
function getPredictionKeyboard(topSymbols) {
    const buttons = topSymbols.map(sym => ([{
        text: `${ICONS[sym]} ${NAMES[sym]}`,
        callback_data: `pred_${sym}`
    }]));
    buttons.push([{ text: '❌ إجابة خاطئة', callback_data: 'wrong' }]);
ttons.push([{ text: '📊 إرسال الشريط', callback_data: 'send_strip' }]);
    return { reply_markup: { inline_keyboard: buttons } };
}

function getAllSymbolsKeyboard() {
    const buttons = [];
    for (let i = 0; i < SYMBOLS_COUNT; i++) {
        buttons.push([{
            text: `${ICONS[i]} ${NAMES[i]}`,
            callback_data: `correct_${i}`
        }]);
    }
    return { reply_markup: { inline_keyboard: buttons } };
}

function getSymbolsGuide() {
    let guide = '🔢 *الأرقام المخصصة لكل رمز:*\n';
    for (let i = 0; i < SYMBOLS_COUNT; i++) {
        guide += `${i} : ${ICONS[i]} ${NAMES[i]}\n`;
    }
    return guide;
}

function getStatsText() {
    const globalProbs = getGlobalProbabilities();
    const localProbs = getLocalProbabilities();
    const markov3Probs = getMarkov3Probabilities();
    const accuracy = sharedData.totalPredictions > 0 ? (sharedData.correctPredictions / sharedData.totalPredictions * 100).toFixed(2) : '0.00';
    let lines = [];
    lines.push('📊 *إحصائيات التعلم*');
    lines.push(`✅ توقعات صحيحة: ${sharedData.correctPredictions}`);
    lines.push(`🔮 إجمالي التوقعات: ${sharedData.totalPredictions}`);
    lines.push(`📈 دقة التوقع: ${accuracy}%\n`);
    lines.push('🎯 *الاحتمالات الحالية (التحليل درجة ثالثة)*\n');
    for (let i = 0; i < SYMBOLS_COUNT; i++) {
        const p = (markov3Probs[i] * 100).toFixed(2);
        lines.push(`${ICONS[i]} ${NAMES[i]} : ${p}% (مرات: ${sharedData.allCounts[i]})`);
    }
    lines.push('\n📊 *مقارنة مع الاحتمالات العامة والمحلية*\n');
    for (let i = 0; i < SYMBOLS_COUNT; i++) {
        const gp = (globalProbs[i] * 100).toFixed(2);
        const lp = (localProbs[i] * 100).toFixed(2);
        lines.push(`${ICONS[i]} ${NAMES[i]} : عام ${gp}% | محلي ${lp}%`);
    }
    lines.push(`\n📊 إجمالي الدورات: ${sharedData.totalAll}`);
    lines.push(`🔄 آخر ${sharedData.recent.length} ضربة في الشريط (الحد الأقصى ${WINDOW_SIZE})`);
    return lines.join('\n');
}

function parseNumbers(text) {
    const nums = [];
    for (const ch of text) {
        if (/\d/.test(ch)) {
            const d = parseInt(ch, 10);
            if (d >= 0 && d <= 7) nums.push(d);
        }
    }
    return nums;
}

// ------------------- إعداد البوت -------------------
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('❌ لم يتم تعيين TELEGRAM_BOT_TOKEN');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// حذف أي webhook قديم
(async () => {
    try {
        await bot.deleteWebHook();
        console.log('✅ تم حذف webhook القديم');
    } catch (e) {
        console.warn('⚠️ لا يمكن حذف webhook:', e.message);
    }
})();

// ------------------- خادم HTTP وهمي (لـ Render) -------------------
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running');
}).listen(PORT, () => {
    console.log(`🚀 خادم وهمي يستمع على المنفذ ${PORT}`);
});

// ------------------- معالجات الأوامر -------------------
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const guide = getSymbolsGuide();
    const text = `👋 مرحباً بك في بوت توقعات handhm go (نسخة التحليل من الدرجة الثالثة)!\n\n${guide}\n\nسأعرض لك كل دورة 3 توقعات بناءً على آخر 3 رموز ظهرت (نموذج التحليل من الدرجة الثالثة).\nبعد انتهاء الدورة، يمكنك:\n- الضغط على التوقع الصحيح إذا كان ضمن الـ 3.\n- الضغط على "❌ إجابة خاطئة" ثم اختيار الرمز الصحيح من القائمة.\n- الضغط على "📊 إرسال الشريط" لإدخال آخر 29 نتيجة دفعة واحدة (أرسل 29 رقماً من 0 إلى 7).\n\nالأوامر المتاحة:\n/stats - عرض الإحصائيات والاحتمالات الحالية\n/help - عرض هذه التعليمات\n\nلنبدأ التوقع الأول:`;
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    await sendPrediction(chatId);
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const guide = getSymbolsGuide();
    const text = `👋 *مساعدة البوت*\n\n${guide}\n\nيعتمد البوت على نموذج التحليل من الدرجة الثالثة (الاعتماد على آخر 3 رموز) لتوقع الرمز القادم.\nيمكنك التفاعل عبر الأزرار الموجودة في رسالة التوقع.\nالأوامر النصية:\n/stats - عرض الإحصائيات الحالية\n/start - إعادة تشغيل البوت\n\nعند الضغط على "📊 إرسال الشريط"، أرسل 29 رقماً (0-7) متتالية أو مفصولة بمسافات.`;
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, async (msg) => {
