var Base64 = require("crypto-js/enc-base64");
var HMACSHA256 = require("crypto-js/hmac-sha256");
var getAPI = require('../const/conf');

var WebSocketClient = require('websocket').client;

function getRequestUrl() {
  var curTime = new Date();
  var timeStamp = Math.floor(curTime.getTime() / 1000);
  var date = new Date(timeStamp * 1000).toUTCString();
  var tmp = "host: " + "aichat.xf-yun.com" + "\n";
  tmp += "date: " + date + "\n";
  tmp += "GET " + "/v1.1/chat" + " HTTP/1.1";
  var tmpSha = HMACSHA256(tmp, getAPI().secret);
  var signature = Base64.stringify(tmpSha);
  var authorization_origin = `api_key="${getAPI().key}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const v = {
    authorization: btoa(authorization_origin), // 上方鉴权生成的authorization
    date: date,  // 步骤1生成的date
    host: "spark-api.xf-yun.com" // 请求的主机名，本接口为固定值
  };
  return "wss://spark-api.xf-yun.com/v1.1/chat?" + Object.keys(v).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(v[key])}`).join('&');
}

function makeData(data) {
  // do not support system role
  for(var i = 0; i < data.messages.length; i++) {
    // system not support now
    if(data.messages[i].role == 'system') {
      data.messages[i].role = 'user';
    }
  }

  // console.log(data)
  var temperature = data.temperature || 0;
  // max_tokens <= 2048
  var max_tokens = (data.max_tokens > 2048 ? 2048 : data.max_tokens )  || 1024;
  return JSON.stringify({
    "header": {
      "app_id": getAPI().appId,
      "uid": "myuid"
    },
    "parameter": {
      "chat": {
        "domain": "general",
        "random_threshold": temperature,
        "max_tokens": max_tokens,
        "auditing": "default"
      }
    },
    "payload": {
      "message": {
        "text": data.messages
      }
    }
  });
}

module.exports = {
  client: null,
  send: function (msg, cb) {
    this.client = new WebSocketClient();
    this.client.connect(getRequestUrl(), null);

    this.client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString());
    });

    this.client.on('connect', function (connection) {
      console.log('WebSocket this.client Connected');
      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
      });
      connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
      });
      connection.on('message', message => cb(message));

      if (connection.connected) {
        var data = makeData(msg);
        console.log("data:"+data);
        connection.sendUTF(data);
      }
    });
  },
  close: function () {
    this.client.abort();
  }
}
