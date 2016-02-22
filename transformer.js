'use strict';

var http = require('http'),
  connect = require('connect'),
  httpProxy = require('http-proxy'),
  transformerProxy = require('transformer-proxy');

//
// The transforming function.
//

var transformerFunction = function (data, req, res) {
  var str = data.toString('ascii');
  //var transformedStr = str.replace("abc", "abcdefghij");
  console.log('[raw response in string] ' + str);

  if (str.indexOf('abc') > -1) {
    //data.write('abc  ', str.indexOf('abc'), 5, 'binary');

    //var buffer = new Buffer('defg]\"', "binary");
    //console.log('[transformed response] ' + buffer.toString('binary'));
    //var tempo = Buffer.concat([data, buffer]);
    var tempStr = str.replace("c\"]", "c  ") + "def\"]";
    var tempo = new Buffer(tempStr, "binary");
    tempo[1] = 3;
    tempo[2] = 5;
    tempo[3] = 255;

    return tempo;
  } else {
    return data;
  }
};


//
// A proxy as a basic connect app.
//

var proxiedPort = 4000;
var proxyPort = 8085;

var app = connect();
var proxy = httpProxy.createProxyServer({target: 'ws://localhost:' + proxiedPort});

app.use(transformerProxy(transformerFunction));

app.use(function (req, res) {
  proxy.web(req, res);
});

http.createServer(app).listen(proxyPort);