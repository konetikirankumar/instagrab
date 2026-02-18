const express = require('express');
const cheerio = require('cheerio');
let got;

const app = express();
app.use(express.static('public')); // serve index.html

// snapsave function
async function snapsave(url) {
  try {
    if (
      !url.match(/(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/) &&
      !url.match(/(https|http):\/\/www.instagram.com\/(p|reel|tv|stories)/gi)
    ) {
      return { developer: '@Alia Uhuy', status: false, msg: 'Link Url not valid' };
    }

   

function decodeSnapApp(args) {
  // rename the last element to avoid conflict
  let [h, u, n, t, e, rArg] = args;

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

  // declare r once here
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

    if (!got) {
      got = (await import('got')).default;
    }

    const response = await got('https://snapsave.app/action.php?lang=id', {
      method: 'POST',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://snapsave.app',
        referer: 'https://snapsave.app/id',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
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
        const $el = $(el);
        const $td = $el.find('td');
        const resolution = $td.eq(0).text();
        let _url = $td.eq(2).find('a').attr('href') || $td.eq(2).find('button').attr('onclick');
        const shouldRender = /get_progressApi/gi.test(_url || '');
        if (shouldRender) {
          _url = /get_progressApi\('(.*?)'\)/.exec(_url || '')?.[1] || _url;
        }
        results.push({ resolution, thumbnail, url: _url, shouldRender });
      });
    } else {
      $('div.download-items__thumb').each((_, tod) => {
        const thumbnail = $(tod).find('img').attr('src');
        $('div.download-items__btn').each((_, ol) => {
          let _url = $(ol).find('a').attr('href');
          if (!/https?:\/\//.test(_url || '')) _url = `https://snapsave.app${_url}`;
          results.push({ thumbnail, url: _url });
        });
      });
    }

    if (!results.length) return { developer: '@Alia Uhuy', status: false, msg: 'Blank data' };
    return { developer: '@Alia Uhuy', status: true, data: results };
  } catch (e) {
    return { developer: '@Alia Uhuy', status: false, msg: e.message };
  }
}

// API route
app.get('/api/download', async (req, res) => {
  const url = req.query.url;
  console.log('Received request for URL:', url);
  const result = await snapsave(url);
  res.json(result);
});

// Start server
//app.listen(3000, () => console.log('Server running on port 3000'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
