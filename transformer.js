'use strict';

var http = require('http'),
  connect = require('connect'),
  httpProxy = require('http-proxy'),
  transformerProxy = require('../');

//
// The transforming function.
//

var transformerFunction = function (data, req, res) {
  var str = data.toString('binary');

  var transformedStr = str.replace("live.jpg", "long.jpg");
  console.log('[server response] ' + str);

  if (transformedStr.indexOf("long.jpg") > -1) {
    //var bytes = [];
    //
    //for (var i = 0; i < transformedStr.length; ++i) {
    //  //if (i > 6) {
    //    bytes.push(str.charCodeAt(i));
    //  //}
    //}
    var buffer = new Buffer(transformedStr, "binary");

    return buffer;
  } else {
    return data;// + "\n // an additional line at the end of every file";
  }
};


//
// A proxy as a basic connect app.
//

var proxiedPort = 3000;
var proxyPort = 8031;

var app = connect();
var proxy = httpProxy.createProxyServer({target: 'ws://localhost:' + proxiedPort});

app.use(transformerProxy(transformerFunction));

app.use(function (req, res) {
  proxy.web(req, res);
});

http.createServer(app).listen(proxyPort);