  var http = require('http'),
  stlTransformer = require("./stlTransformer.js"),
  express = require('express'),        // call express
  app = express();                 // define our app using express
var proxiedPort = 3000;
var proxyPort = 8001;
const server = app.listen(proxyPort);

/* Matching */
var request = require("request");
var FP_MATCHING_URL = 'http://localhost/Matching/CompareFingerprints';
var FACE_MATCHING_URL = 'http://localhost/Matching/CompareFaces';


var ui = require('socket.io')(server);
ui.on('connection', function (uiSocket) {
  // Matching CompFaceReq
  uiSocket.on('CompFaceReq', function (data) {
    request({
      url: FACE_MATCHING_URL,
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data)
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log(body);
        uiSocket.emit('OnFaceRes', stlTransformer.transform('OnFaceRes', body));
      }
      else {
        console.log("error: " + error)
        console.log("response.statusCode: " + response.statusCode)
        console.log("response.statusText: " + response.statusText)
      }
    });
  });

  uiSocket.on('ComFinReq', function (data) {
    request({
      url: FP_MATCHING_URL,
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data)
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log(body);
        uiSocket.emit('OnFPRes', stlTransformer.transform('OnFPRes', body));
      }
      else {
        console.log("error: " + error)
        console.log("response.statusCode: " + response.statusCode)
        console.log("response.statusText: " + response.statusText)
      }
    });
  });

  // Acquisition
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