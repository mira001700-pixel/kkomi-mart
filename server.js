require('dotenv').config();
const express = require('express');
const { searchProducts } = require('./lib/naverCommerceApi');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/products', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 20;
    const data = await searchProducts({ page, size });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
