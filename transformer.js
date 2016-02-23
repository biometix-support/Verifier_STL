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
  //console.log('[raw response in string] ' + str);

  if (str.indexOf('connected') > -1) {
    var tempStr = str.replace("\"]", "  ") + "defiiiiiiiiiiiiiiiiiiii\"]";


    var tempo = new Buffer(tempStr, "binary");
    var upperThreshold = tempo.length -1;
    var numberArray = upperThreshold.toString().split('');

    for(var i = 0; i < numberArray.length; i++) {
      tempo[i + 1] = numberArray[i];
    }
    tempo[numberArray.length + 1] = 255;

    return tempo;
  } else {
    return data;
  }
};


//
// A proxy as a basic connect app.
//

var proxiedPort = 3000;
var proxyPort = 8088;

var app = connect();
var proxy = httpProxy.createProxyServer({target: 'ws://localhost:' + proxiedPort});

app.use(transformerProxy(transformerFunction));

app.use(function (req, res) {
  proxy.web(req, res);
});

http.createServer(app).listen(proxyPort);