const express = require('express')
var sse = require('connect-sse')();
var spark = require('./lib/sparkClient');
var alias = require('./lib/alias');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express()
app.use(express.json())

// use proxy to chatgpt
app.use('/v1/embeddings', createProxyMiddleware({ target: 'https://api.openai.com', changeOrigin: true }));


app.post('/v1/chat/completions', (req, res, next) => {
  if (req.body.stream) {
    next('route');
  }
  else {
    var outBuffer = "";
    spark.send(req.body, (ret) => {
      if (ret.type === "utf8") {
        var data = JSON.parse(ret.utf8Data);
        console.log(data.header.code)
        if(data.header.code !== 0) {
          res.json(data);
          res.end();
          return;
        }
        outBuffer += data.payload.choices.text[0].content;
        if (data.header.status === 2) {
          spark.close();
          res.json(alias.onShotRes(data, outBuffer));
          res.end();
        }
      }
    })
  }
});

app.post('/v1/chat/completions', sse, async (req, res) => {
  await spark.send(req.body, (ret) => {
    if (ret.type === "utf8") {
      var data = JSON.parse(ret.utf8Data);
      alias.streamRes(data).forEach(item => {
        res.json(item)
      })
      if (data.header.status === 2) {
        res.json(alias.streamEndRes(data));
        spark.close();
        res.end();
      }
    }
  })
})

exports = module.exports = app;
