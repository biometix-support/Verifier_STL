'use strict';

var httpProxy = require('http-proxy');
var io = require('socket.io');

console.log('Starting proxy server for 127.0.0.1:4501');
var proxyServer = new httpProxy.createProxyServer({
  ws: true,
  target: 'ws://127.0.0.1:4501/Reader'
});

proxyServer.listen(8000);

proxyServer.on('proxyReq', function(proxyReq, req, res, options) {
  console.log('request', req);
});

proxyServer.on('proxyRes', function (proxyRes, req, res) {
  console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
});

//
// Listen for the `open` event on `proxy`.
//
proxyServer.on('open', function (proxySocket) {
  // listen for messages coming FROM the target here
  // console.log('[client request header]', proxySocket);
  proxySocket.on('data', function (bytes) {
    var str = new Buffer(bytes).toString('ascii');
    console.log('[server response] ' + str);
  });
});

//
// Listen for the `close` event on `proxy`.
//
proxyServer.on('close', function (req, socket, head) {
  // view disconnected websocket connections
  console.log('Client disconnected');
});