'use strict';

var http = require('http'),
  connect = require('connect'),
  httpProxy = require('http-proxy'),
  transformerProxy = require('transformer-proxy'),
  js2xmlparser = require("js2xmlparser");

//
// The transforming function.
//

var transformerFunction = function (data, req, res) {
  var rawMessage = data.toString('ascii');

  //console.log('[raw response in string] ' + rawMessage);

  if (rawMessage.indexOf('OnStatusChanged') > -1) {

    var breakPoint = rawMessage.indexOf("42[");
    var header = rawMessage.substring(0, breakPoint);
    var result = {
        "status": "",
        "message": "",
        "sensorData": ""
    };

    var rawResult = JSON.parse(rawMessage.substring(6, rawMessage.length));

    result.status = 'success';
    result.message = rawResult[1];

    var options = {
        prettyPrinting: {
          enabled: true,
          indentString: ''
        }
    };
    var xmlResult = js2xmlparser("result", result, options);
    xmlResult = xmlResult.replace(/(\n)/gm, "");
    xmlResult = xmlResult.replace(/(")/gm, "\\\"")
    var transformedStr = "[\"OnStatusChanged" + "\",\"" + xmlResult + "\"]";

    var newCountStr = transformedStr.length + header.length + 1 + '';
    var existingCountStr = rawMessage.length + '';

    if (newCountStr.length - existingCountStr.length > 0) {
        header = header + ' ';
    }

    var tempo = new Buffer(header + "42" + transformedStr , "binary");
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