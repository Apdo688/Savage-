const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.static('.'));
const smsLog = [];
app.post('/sms', (req, res) => {
  const { from, msg } = req.body;
  smsLog.push({ from, msg, time: Date.now() });
  res.json({ success: true });
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});
app.post('/verify-payment', (req, res) => {
  const { amount, phone } = req.body;
  const cleanPhone = phone.replace(/\s/g, '');
  const now = Date.now();
  const found = smsLog.find(sms => now - sms.time < 600000 && sms.msg.includes(amount) && sms.from.includes(cleanPhone.slice(-8)));
  if (found) { smsLog.splice(smsLog.indexOf(found), 1); res.json({ success: true }); }
  else { res.json({ success: false, message: 'لم يتم العثور على تحويل' }); }
});
app.listen(3000, () => console.log('Server running on port 3000'));
