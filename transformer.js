var http = require('http'),
  connect = require('connect'),
  stlTransformer = require("./stlTransformer.js"),
  express = require('express'),        // call express
  app = express();                 // define our app using express
//
// The transforming function.
//
var transformerFunction = function (data, req, res) {
    return stlTransformer.transform(data);
};

//
// A proxy as a basic connect app.
//

var proxiedPort = 3000;
var proxyPort = 8001;





const server = app.listen(proxyPort);

var ui = require('socket.io')(server);

ui.on('connection', function (uiSocket) {
  var iomSocket = require('socket.io-client')('http://localhost:'+ proxiedPort);
  iomSocket.on('OnFingerprintScanned', function(data){
    uiSocket.emit('OnFingerprintScanned', stlTransformer.transform('OnFingerprintScanned', data));
  });

  uiSocket.on('OnFingerprintScanned', function () {
    iomSocket.emit('OnFingerprintScanned', '');
  });

  iomSocket.on('OnPhotoTaken', function(data){
    uiSocket.emit('OnPhotoTaken', stlTransformer.transform('OnPhotoTaken', data));
  });

  uiSocket.on('OnPhotoTaken', function () {
    iomSocket.emit('OnPhotoTaken', '');
  });

  iomSocket.on('OnNewDocumentScanned', function(data){
    uiSocket.emit('OnNewDocumentScanned', stlTransformer.transform('OnNewDocumentScanned', data));
  });

  uiSocket.on('OnNewDocumentScanned', function () {
    iomSocket.emit('OnNewDocumentScanned', '');
  });

  uiSocket.emit('OnStatusChanged',
    '<result><status>success</status><message>connected</message></result>'
  );
});