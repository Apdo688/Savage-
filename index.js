const express = require('express');
const app = express();
const path = require('path');

// عشان السيرفر يفهم البيانات اللي جاية من الموبايل مهما كان نوعها
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// مخزن الرسايل (هيفضل شغال طول ما السيرفر قايم)
let smsLog = [];

// 1. المسار اللي بيستقبل الرسايل من تطبيق SMS Forwarder
app.post('/sms', (req, res) => {
    try {
        // سحب البيانات (بيجرب أكتر من اسم عشان نضمن الوصول للداتا)
        const from = req.body.from || req.body.sender || "Unknown";
        const msg = req.body.msg || req.body.message || req.body.content || "";

        console.log(`[SMS Received] From: ${from}, Content: ${msg}`);

        // حفظ الرسالة مع وقت وصولها
        smsLog.push({
            from: from,
            msg: msg,
            time: Date.now()
        });

        // الرد على التطبيق بالنجاح (مهم جداً عشان ما يديش Error في الموبايل)
        res.status(200).json({ success: true, message: "Logged successfully" });
    } catch (err) {
        console.error("Webhook Error:", err);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// 2. المسار اللي بياكد الدفع لليوزر في صفحة payment.html
app.post('/verify-payment', (req, res) => {
    const { amount, phone } = req.body;
    
    if (!amount || !phone) {
        return res.json({ success: false, message: 'برجاء إدخال المبلغ ورقم الهاتف' });
    }

    const cleanPhone = phone.trim();
    const now = Date.now();

    // البحث عن العملية (بندور على المبلغ والرقم جوه نص الرسالة)
    const foundIndex = smsLog.findIndex(sms => {
        const isRecent = (now - sms.time) < 600000; // في آخر 10 دقائق
        
        // التحقق إن الرسالة فيها المبلغ وفيها رقم العميل
        const hasAmount = sms.msg.includes(amount.toString());
        const hasPhone = sms.msg.includes(cleanPhone);

        return isRecent && hasAmount && hasPhone;
    });

    if (foundIndex !== -1) {
        // لو لقيناها، نمسحها عشان محدش يستخدمها تاني
        smsLog.splice(foundIndex, 1);
        console.log(`[Payment Verified] Phone: ${cleanPhone}, Amount: ${amount}`);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'لم يتم العثور على تحويل.. تأكد من البيانات أو انتظر دقيقة' });
    }
});

// صفحة الدفع
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'payment.html'));
});

// تشغيل السيرفر على البورت اللي بيحدده Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

