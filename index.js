const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

app.post('/verify-payment', (req, res) => {
  const { amount, phone } = req.body;
  res.json({ success: true, message: 'تم التحقق' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
