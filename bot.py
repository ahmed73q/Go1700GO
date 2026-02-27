import json
import os
import logging
import threading
import requests
from http.server import HTTPServer, BaseHTTPRequestHandler
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, CallbackQueryHandler, ContextTypes

SYMBOLS_COUNT = 8

ICONS = ['🥕', '🦐', '🍅', '🍗', '🌽', '🥩', '🥦', '🐟']
NAMES = ['جزر', 'روبيان', 'طماط', 'عظمه', 'ذره', 'استيك', 'بروكلي', 'سمكه']
MULTIPLIERS = [5, 10, 5, 15, 5, 25, 5, 45]

WINDOW_SIZE = 29
SMOOTHING = 1.0
DATA_FILE = 'shared_data.json'

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

shared_data = {
    'allCounts': [0]*SYMBOLS_COUNT,
    'recent': [],
    'totalAll': 0,
    'correctPredictions': 0,
    'totalPredictions': 0,
    'transitionCounts': [[0]*SYMBOLS_COUNT for _ in range(SYMBOLS_COUNT)],
    'transitionCounts3': {}  # مفتاح: (a,b,c) ثلاثي, قيمة: قائمة بطول 8
}

def load_data():
    global shared_data
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                shared_data['allCounts'] = data.get('allCounts', [0]*SYMBOLS_COUNT)
                shared_data['recent'] = data.get('recent', [])
                shared_data['totalAll'] = data.get('totalAll', 0)
                shared_data['correctPredictions'] = data.get('correctPredictions', 0)
                shared_data['totalPredictions'] = data.get('totalPredictions', 0)
                shared_data['transitionCounts'] = data.get('transitionCounts', [[0]*SYMBOLS_COUNT for _ in range(SYMBOLS_COUNT)])
                # تحويل مفاتيح transitionCounts3 من سلاسل إلى tuples
                trans3 = data.get('transitionCounts3', {})
                shared_data['transitionCounts3'] = {}
                for k, v in trans3.items():
                    # نتوقع أن المفتاح كان "a,b,c" في JSON
                    parts = k.split(',')
                    if len(parts) == 3:
                        key = (int(parts[0]), int(parts[1]), int(parts[2]))
                        shared_data['transitionCounts3'][key] = v
        except Exception as e:
            logger.error(f"خطأ في قراءة ملف البيانات: {e}")

def save_data():
    try:
        # تحويل مفاتيح transitionCounts3 إلى سلاسل مناسبة لـ JSON
        trans3_for_json = {}
        for k, v in shared_data['transitionCounts3'].items():
            trans3_for_json[f"{k[0]},{k[1]},{k[2]}"] = v
        data_to_save = {
            'allCounts': shared_data['allCounts'],
            'recent': shared_data['recent'],
            'totalAll': shared_data['totalAll'],
            'correctPredictions': shared_data['correctPredictions'],
            'totalPredictions': shared_data['totalPredictions'],
            'transitionCounts': shared_data['transitionCounts'],
            'transitionCounts3': trans3_for_json
        }
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"خطأ في حفظ ملف البيانات: {e}")

load_data()

def add_result(symbol):
    if symbol < 0 or symbol >= SYMBOLS_COUNT:
        return False
    # تحديث transitionCounts (درجة أولى)
    if shared_data['recent']:
        last = shared_data['recent'][-1]
        shared_data['transitionCounts'][last][symbol] += 1
    # تحديث transitionCounts3 (درجة ثالثة) إذا كان لدينا 3 رموز سابقة
    if len(shared_data['recent']) >= 3:
        a = shared_data['recent'][-3]
        b = shared_data['recent'][-2]
        c = shared_data['recent'][-1]
        key = (a, b, c)
        if key not in shared_data['transitionCounts3']:
            shared_data['transitionCounts3'][key] = [0]*SYMBOLS_COUNT
        shared_data['transitionCounts3'][key][symbol] += 1
    # تحديث allCounts و recent
    shared_data['allCounts'][symbol] += 1
    shared_data['recent'].append(symbol)
    if len(shared_data['recent']) > WINDOW_SIZE:
        shared_data['recent'].pop(0)
    shared_data['totalAll'] += 1
    save_data()
    return True

def add_multiple_results(symbols):
    # إضافة عدة نتائج دفعة واحدة مع تحديث جميع الإحصائيات بشكل صحيح
    temp_recent = list(shared_data['recent'])  # نسخة مؤقتة للمحاكاة
    for i, sym in enumerate(symbols):
        if sym < 0 or sym >= SYMBOLS_COUNT:
            continue
        # انتقالات درجة أولى
        if temp_recent:
            last = temp_recent[-1]
            shared_data['transitionCounts'][last][sym] += 1
        # انتقالات درجة ثالثة
        if len(temp_recent) >= 3:
            a = temp_recent[-3]
            b = temp_recent[-2]
            c = temp_recent[-1]
            key = (a, b, c)
            if key not in shared_data['transitionCounts3']:
                shared_data['transitionCounts3'][key] = [0]*SYMBOLS_COUNT
            shared_data['transitionCounts3'][key][sym] += 1
        # تحديث العد والتسلسل
        shared_data['allCounts'][sym] += 1
        temp_recent.append(sym)
        if len(temp_recent) > WINDOW_SIZE:
            temp_recent.pop(0)
        shared_data['totalAll'] += 1
    # بعد الانتهاء، نحدث recent الفعلي
    shared_data['recent'] = temp_recent
    save_data()

def reset_data():
    shared_data['allCounts'] = [0]*SYMBOLS_COUNT
    shared_data['recent'] = []
    shared_data['totalAll'] = 0
    shared_data['correctPredictions'] = 0
    shared_data['totalPredictions'] = 0
    shared_data['transitionCounts'] = [[0]*SYMBOLS_COUNT for _ in range(SYMBOLS_COUNT)]
    shared_data['transitionCounts3'] = {}
    save_data()

def get_global_probabilities():
    total = shared_data['totalAll']
    if total == 0:
        return [1/SYMBOLS_COUNT]*SYMBOLS_COUNT
    smoothed = [c + SMOOTHING for c in shared_data['allCounts']]
    s = sum(smoothed)
    return [v/s for v in smoothed]

def get_local_probabilities():
    n = len(shared_data['recent'])
    if n == 0:
        return [1/SYMBOLS_COUNT]*SYMBOLS_COUNT
    counts = [0]*SYMBOLS_COUNT
    for sym in shared_data['recent']:
        counts[sym] += 1
    smoothed = [c + SMOOTHING for c in counts]
    s = sum(smoothed)
    return [v/s for v in smoothed]

def get_markov_probabilities():
    # درجة أولى
    if not shared_data['recent']:
        return get_local_probabilities()
    last = shared_data['recent'][-1]
    row = shared_data['transitionCounts'][last]
    total = sum(row)
    if total == 0:
        return get_local_probabilities()
    smoothed = [c + SMOOTHING for c in row]
    s = sum(smoothed)
    return [v/s for v in smoothed]

def get_markov3_probabilities():
    # درجة ثالثة: تعتمد على آخر 3 رموز
    if len(shared_data['recent']) < 3:
        return get_markov_probabilities()  # نرجع للدرجة الأولى
    a = shared_data['recent'][-3]
    b = shared_data['recent'][-2]
    c = shared_data['recent'][-1]
    key = (a, b, c)
    row = shared_data['transitionCounts3'].get(key, [0]*SYMBOLS_COUNT)
    total = sum(row)
    if total == 0:
        # إذا لم نر هذا الثلاثي من قبل، نستخدم درجة أولى
        return get_markov_probabilities()
    smoothed = [cnt + SMOOTHING for cnt in row]
    s = sum(smoothed)
    return [v/s for v in smoothed]

def get_top3_symbols():
    probs = get_markov3_probabilities()  # استخدام درجة ثالثة
    indexed = [(i, probs[i]) for i in range(SYMBOLS_COUNT)]
    indexed.sort(key=lambda x: x[1], reverse=True)
    return [i for i,_ in indexed[:3]]

def get_prediction_keyboard(top_symbols):
    buttons = []
    for sym in top_symbols:
        buttons.append([InlineKeyboardButton(f"{ICONS[sym]} {NAMES[sym]}", callback_data=f"pred_{sym}")])
    buttons.append([InlineKeyboardButton("❌ إجابة خاطئة", callback_data="wrong")])
    buttons.append([InlineKeyboardButton("📊 إرسال الشريط", callback_data="send_strip")])
    return InlineKeyboardMarkup(buttons)

def get_all_symbols_keyboard():
    buttons = []
    for i in range(SYMBOLS_COUNT):
        buttons.append([InlineKeyboardButton(f"{ICONS[i]} {NAMES[i]}", callback_data=f"correct_{i}")])
    return InlineKeyboardMarkup(buttons)

def get_symbols_guide():
    guide = "🔢 *الأرقام المخصصة لكل رمز:*\n"
    for i in range(SYMBOLS_COUNT):
        guide += f"{i} : {ICONS[i]} {NAMES[i]}\n"
    return guide

def get_stats_text():
    global_probs = get_global_probabilities()
    local_probs = get_local_probabilities()
    markov_probs = get_markov3_probabilities()  # نعرض احتمالات الدرجة الثالثة
    accuracy = (shared_data['correctPredictions'] / shared_data['totalPredictions'] * 100) if shared_data['totalPredictions'] > 0 else 0.0
    lines = []
    lines.append("📊 *إحصائيات التعلم*")
    lines.append(f"✅ توقعات صحيحة: {shared_data['correctPredictions']}")
    lines.append(f"🔮 إجمالي التوقعات: {shared_data['totalPredictions']}")
    lines.append(f"📈 دقة التوقع: {accuracy:.2f}%\n")
    lines.append("🎯 *الاحتمالات الحالية (التحليل درجة ثالثة)*\n")
    for i in range(SYMBOLS_COUNT):
        markov_p = markov_probs[i] * 100
        count = shared_data['allCounts'][i]
        lines.append(f"{ICONS[i]} {NAMES[i]} : {markov_p:.2f}% (مرات: {count})")
    lines.append("\n📊 *مقارنة مع الاحتمالات العامة والمحلية*\n")
    for i in range(SYMBOLS_COUNT):
        global_p = global_probs[i] * 100
        local_p = local_probs[i] * 100
        lines.append(f"{ICONS[i]} {NAMES[i]} : عام {global_p:.2f}% | محلي {local_p:.2f}%")
    lines.append(f"\n📊 إجمالي الدورات: {shared_data['totalAll']}")
    lines.append(f"🔄 آخر {len(shared_data['recent'])} ضربة في الشريط (الحد الأقصى {WINDOW_SIZE})")
    return "\n".join(lines)

def parse_numbers(text):
    nums = []
    for ch in text:
        if ch.isdigit():
            d = int(ch)
            if 0 <= d <= 7:
                nums.append(d)
    return nums

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    guide = get_symbols_guide()
    text = f"👋 مرحباً بك في بوت توقعات Go (نسخة التحليل من الدرجة الثالثة)!\n\n{guide}\n\nسأعرض لك كل دورة 3 توقعات بناءً على آخر 3 رموز ظهرت (نموذج التحليل من الدرجة الثالثة).\nبعد انتهاء الدورة، يمكنك:\n- الضغط على التوقع الصحيح إذا كان ضمن الـ 3.\n- الضغط على \"❌ إجابة خاطئة\" ثم اختيار الرمز الصحيح من القائمة.\n- الضغط على \"📊 إرسال الشريط\" لإدخال آخر 29 نتيجة دفعة واحدة (أرسل 29 رقماً من 0 إلى 7).\n\nالأوامر المتاحة:\n/stats - عرض الإحصائيات والاحتمالات الحالية\n/help - عرض هذه التعليمات\n\nلنبدأ التوقع الأول:"
    await update.message.reply_text(text, parse_mode='Markdown')
    await send_prediction(chat_id, context)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    guide = get_symbols_guide()
    text = f"👋 *مساعدة البوت*\n\n{guide}\n\nيعتمد البوت على نموذج التحليل من الدرجة الثالثة (الاعتماد على آخر 3 رموز) لتوقع الرمز القادم.\nيمكنك التفاعل عبر الأزرار الموجودة في رسالة التوقع.\nالأوامر النصية:\n/stats - عرض الإحصائيات الحالية\n/start - إعادة تشغيل البوت\n\nعند الضغط على \"📊 إرسال الشريط\"، أرسل 29 رقماً (0-7) متتالية أو مفصولة بمسافات."
    await update.message.reply_text(text, parse_mode='Markdown')

async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    stats_text = get_stats_text()
    await update.message.reply_text(stats_text, parse_mode='Markdown')

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    chat_id = query.message.chat_id

    if data == "send_strip":
        context.user_data['awaiting_strip'] = True
        await query.edit_message_text("📥 الرجاء إرسال 29 رقمًا (0-7) تمثل آخر 29 نتيجة في الشريط، مفصولة بمسافات أو بدون فواصل (مثال: 2 5 1 0 3 7 4 6 ...).")
        return

    if data.startswith("pred_"):
        symbol = int(data.split("_")[1])
        shared_data['correctPredictions'] += 1
        shared_data['totalPredictions'] += 1
        save_data()
        await query.edit_message_text(f"✅ صحيح! الرمز {ICONS[symbol]} كان ضمن توقعاتي.")
        add_result(symbol)
        await send_prediction(chat_id, context)

    elif data == "wrong":
        keyboard = get_all_symbols_keyboard()
        await query.edit_message_text("❌ اختر الرمز الصحيح من القائمة:", reply_markup=keyboard)

    elif data.startswith("correct_"):
        symbol = int(data.split("_")[1])
        shared_data['totalPredictions'] += 1
        save_data()
        await query.edit_message_text(f"✅ تم تسجيل الرمز الصحيح: {ICONS[symbol]}.")
        add_result(symbol)
        await send_prediction(chat_id, context)

async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    chat_id = update.message.chat_id

    if text.startswith('/'):
        return

    if context.user_data.get('awaiting_strip'):
        nums = parse_numbers(text)
        if len(nums) == 29:
            add_multiple_results(nums)
            context.user_data['awaiting_strip'] = False
            await update.message.reply_text(f"✅ تم تسجيل {len(nums)} نتيجة بنجاح. تم تحديث البيانات.")
            stats_text = get_stats_text()
            await update.message.reply_text(stats_text, parse_mode='Markdown')
            await send_prediction(chat_id, context)
        else:
            await update.message.reply_text(f"❌ العدد غير صحيح. يجب أن ترسل 29 رقماً بالضبط. لقد أرسلت {len(nums)}. حاول مرة أخرى:")
        return

    nums = parse_numbers(text)
    if len(nums) > 1:
        add_multiple_results(nums)
        await update.message.reply_text(f"✅ تم تسجيل {len(nums)} نتيجة بنجاح.")
        stats_text = get_stats_text()
        await update.message.reply_text(stats_text, parse_mode='Markdown')
        await send_prediction(chat_id, context)

async def send_prediction(chat_id, context):
    top = get_top3_symbols()
    keyboard = get_prediction_keyboard(top)
    await context.bot.send_message(
        chat_id=chat_id,
        text="🔮 *توقعاتي للدورة القادمة (باستخدام نموذج التحليل من الدرجة الثالثة):*\nاختر الرمز الصحيح إذا كان ضمن الـ 3، أو اضغط \"إجابة خاطئة\" ثم اختر الرمز الصحيح.",
        parse_mode='Markdown',
        reply_markup=keyboard
    )

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Bot is running')
    def log_message(self, format, *args):
        pass

def run_http_server():
    port = int(os.environ.get('PORT', 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    logger.info(f"🚀 خادم وهمي يستمع على المنفذ {port}")
    server.serve_forever()

def main():
    threading.Thread(target=run_http_server, daemon=True).start()

    token = os.environ.get('8573917737:AAGwzxMVdXxwA41l0d06dL8tYlybur0rE8s')
    if not token:
        logger.error("❌ لم يتم تعيين TELEGRAM_BOT_TOKEN")
        return

    try:
        requests.get(f"https://api.telegram.org/bot{token}/deleteWebhook")
    except:
        pass

    application = Application.builder().token(token).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("stats", stats))
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))

    logger.info("✅ البوت يعمل بنموذج التحليل من الدرجة الثالثة...")
    application.run_polling()

if __name__ == "__main__":
    main()