require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// Database connection
mongoose.connect('mongodb://localhost/url-shortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define URL schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const Url = mongoose.model('Url', urlSchema);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Routes
app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;
  const isValidUrl = /^(http|https):\/\/[^ "]+$/.test(originalUrl);

  if (!isValidUrl) {
    return res.json({ error: 'invalid url' });
  }

  try {
    let url = await Url.findOne({ original_url: originalUrl });
    if (!url) {
      const shortUrl = Math.random().toString(36).substr(2, 5);
      url = await Url.create({
        original_url: originalUrl,
        short_url: shortUrl,
      });
    }

    return res.json({
      original_url: url.original_url,
      short_url: url.short_url,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  try {
    const url = await Url.findOne({ short_url: shortUrl });
    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    return res.redirect(url.original_url);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
