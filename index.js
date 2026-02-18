const express = require('express');
const cheerio = require('cheerio');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const app = express();

/* ===========================
   CREATE LOGS FOLDER
=========================== */

const logDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/* ===========================
   LOGGER CONFIGURATION
=========================== */

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `${timestamp} [${level.toUpperCase()}] ${message} - ${stack}`
        : `${timestamp} [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.Console()
  ]
});

/* ===========================
   MIDDLEWARE
=========================== */

app.use(express.static('public'));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

/* ===========================
   SNAP SAVE FUNCTION
=========================== */

async function snapsave(url) {
  try {
    if (
      !url ||
      (!url.match(/(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/) &&
       !url.match(/(https|http):\/\/www.instagram.com\/(p|reel|tv|stories)/gi))
    ) {
      logger.warn(`Invalid URL provided: ${url}`);
      return { developer: '@Alia Uhuy', status: false, msg: 'Link Url not valid' };
    }

    function decodeSnapApp(args) {
      let [h, u, n, t, e] = args;

      function decode(d, e, f) {
        const g = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
        let h = g.slice(0, e);
        let i = g.slice(0, f);
        let j = d.split('').reverse().reduce(function (a, b, c) {
          if (h.indexOf(b) !== -1) return a += h.indexOf(b) * Math.pow(e, c);
          return a;
        }, 0);
        let k = '';
        while (j > 0) {
          k = i[j % f] + k;
          j = (j - (j % f)) / f;
        }
        return k || '0';
      }

      let r = '';

      for (let i = 0, len = h.length; i < len; i++) {
        let s = '';
        while (h[i] !== n[e]) {
          s += h[i];
          i++;
        }
        for (let j = 0; j < n.length; j++) {
          s = s.replace(new RegExp(n[j], 'g'), j.toString());
        }
        r += String.fromCharCode(decode(s, e, 10) - t);
      }

      return decodeURIComponent(encodeURIComponent(r));
    }

    function getEncodedSnapApp(data) {
      return data
        .split('decodeURIComponent(escape(r))}(')[1]
        .split('))')[0]
        .split(',')
        .map((v) => v.replace(/"/g, '').trim());
    }

    function getDecodedSnapSave(data) {
      return data
        .split('getElementById("download-section").innerHTML = "')[1]
        .split('"; document.getElementById("inputData").remove(); ')[0]
        .replace(/\\(\\)?/g, '');
    }

    function decryptSnapSave(data) {
      return getDecodedSnapSave(decodeSnapApp(getEncodedSnapApp(data)));
    }

    const got = (await import('got')).default;

    const response = await got('https://snapsave.app/action.php?lang=id', {
      method: 'POST',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://snapsave.app',
        referer: 'https://snapsave.app/id'
      },
      form: { url },
      responseType: 'text',
    });

    const html = response.body;
    const decode = decryptSnapSave(html);
    const $ = cheerio.load(decode);
    const results = [];

    if ($('table.table').length || $('article.media > figure').length) {
      const thumbnail = $('article.media > figure').find('img').attr('src');

      $('tbody > tr').each((_, el) => {
        const $td = $(el).find('td');
        const resolution = $td.eq(0).text();
        let _url = $td.eq(2).find('a').attr('href');

        results.push({ resolution, thumbnail, url: _url });
      });
    }

    if (!results.length) {
      logger.warn(`Blank data returned for URL: ${url}`);
      return { developer: '@Alia Uhuy', status: false, msg: 'Blank data' };
    }

    logger.info(`Successfully processed URL: ${url}`);

    return { developer: '@Alia Uhuy', status: true, data: results };

  } catch (e) {
    logger.error(e.message, { stack: e.stack });
    return {
      developer: '@Alia Uhuy',
      status: false,
      msg: e.message
    };
  }
}

/* ===========================
   API ROUTE
=========================== */

app.get('/api/download', async (req, res) => {
  const url = req.query.url;
  logger.info(`Received request for URL: ${url}`);
  const result = await snapsave(url);
  res.json(result);
});

/* ===========================
   START SERVER
=========================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
