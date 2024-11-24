require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns')
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

function genShortLinkID() {
  const charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += charList[Math.floor(Math.random() * charList.length)];
  }
  return id;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

async function saveShortenedUrl(url_input) {
  const uniqueShortLinkID = genShortLinkID()
  return new Promise((resolve, reject) => {
    if (!isValidUrl(url_input)) return reject(new Error('URL validation failed!'))

    dns.lookup((new URL(url_input)).hostname, (e) => {
      if (e) {
        console.error(e)
        return reject(new Error('DNS Lookup failed!'))
      } else {
        fs.writeFileSync(path.join(__dirname, 'savedUrl', `${uniqueShortLinkID}.txt`), url_input)
        resolve({
          original_url: url_input,
          short_url: uniqueShortLinkID
        })
      }
    })
  })
}

function loadShortenedUrl(shorturl_input) {
  const filePath = path.join(__dirname, 'savedUrl', `${shorturl_input}.txt`);
  if (!fs.existsSync(filePath)) {
    throw new Error("Shortened URL not found");
  }
  return fs.readFileSync(filePath, 'utf-8');
}

app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body
  try {
    const { original_url, short_url } = await saveShortenedUrl(url)

    res.json({
      original_url,
      short_url
    })
  } catch (error) {
    console.error(error.message)
    res.json({
      error: "invalid url"
    })
  }
})

app.get('/api/shorturl/:shorturl', (req, res) => {
  const url = loadShortenedUrl(req.params.shorturl)

  res.redirect(url)
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
