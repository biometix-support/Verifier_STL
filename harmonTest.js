var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy');

var selects = [];
var simpleselect = {};

simpleselect.query = '*';
simpleselect.func = function (node) {
    console.log('DO TRANSFORM HEREEEEEEEEEEEEEEEE');
    console.log(node);
    //node.createWriteStream().end('<div>+ Trumpet</div>');
}

selects.push(simpleselect);

// Basic Connect App
//
var app = connect();

var proxy = httpProxy.createProxyServer({
    ws: true,
    target: 'ws://localhost:3000'
})


app.use(require('harmon')([], selects, false));

app.use(
  function (req, res) {
    proxy.web(req, res);
  }
);

http.createServer(app).listen(8888);

//http.createServer(function (req, res) {
//  res.writeHead(200, { 'Content-Type': 'text/html' });
//  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
//  res.end();
//}).listen(9000);
