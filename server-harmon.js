var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy');

var selects = [];
var simpleselect = {};

simpleselect.query = '.b';
simpleselect.func = function (node) {
    node.createWriteStream().end('<div>+ Trumpet</div>');
}

selects.push(simpleselect);

var app = connect();
app.use(require('harmon')([], selects));

console.log('Starting proxy server for localhost:3000');

var proxyServer = new httpProxy.createProxyServer({
    ws: true,
    target: 'ws://localhost:3000'
});

app.use(function (req, res) {
    proxyServer.ws(req, res);
});

//http.createServer(app).listen(9000);

proxyServer.listen(9000);

//proxyServer.on('proxyReq', function (proxyReq, req, res, options) {
//    console.log('request', req);
//});
//
//proxyServer.on('proxyRes', function (proxyRes, req, res) {
//    console.log('RAW Response from the target', JSON.stringify(proxyRes.body));
//});

//
// Listen for the `open` event on `proxy`.
//
//proxyServer.on('open', function (proxySocket) {
//    // listen for messages coming FROM the target here
//    // console.log('[client request header]', proxySocket);
//    proxySocket.on('data', function (bytes) {
//        var str = new Buffer(bytes).toString('ascii');
//        console.log('[server response] ' + str);
//    });
//});

//
// Listen for the `close` event on `proxy`.
//
//proxyServer.on('close', function (req, socket, head) {
//    // view disconnected websocket connections
//    console.log('Client disconnected');
//});