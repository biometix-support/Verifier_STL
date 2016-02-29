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
  //var wsImpl = window.WebSocket || window.MozWebSocket;
  //var iomSocket = new wsImpl('ws://127.0.0.1:4501/Reader');//require('socket.io-client')('ws://127.0.0.1:4501/Reader');
  var WebSocketClient = require('websocket').client;

  var iomClient = new WebSocketClient();
  iomClient.connect('ws://127.0.0.1:4501/Reader');

  iomClient.on('connect', function(iomSocket) {
    uiSocket.on('OnFingerprintScanned', function () {
      console.log('Send command to IOM socket ' + iomSocket);
      iomSocket.send("getFingerscan()");
    });

    uiSocket.on('OnPhotoTaken', function () {
      iomSocket.send("getCamera()");
    });

    uiSocket.on('OnNewDocumentScanned', function () {
      iomSocket.send("scanNewDoc()");
    });



    iomSocket.on('message', function(message) {
      if (message.type === 'utf8') {
        console.log("Received: '" + message.utf8Data + "'");

        if (message.utf8Data.indexOf("photoUrl") > -1) {
          uiSocket.emit('OnPhotoTaken', stlTransformer.transform('OnPhotoTaken', message.utf8Data));
        } else if (message.utf8Data.indexOf("fingerprintUrl") > -1) {
          uiSocket.emit('OnFingerprintScanned', stlTransformer.transform('OnFingerprintScanned', message.utf8Data));
        } else if (message.utf8Data.indexOf("\"success\":true") > -1) {
          uiSocket.emit('OnNewDocumentScanned', stlTransformer.transform('OnNewDocumentScanned', message.utf8Data));
        }
      }
    });

    iomSocket.on('OnFingerprintScanned', function (data) {
      uiSocket.emit('OnFingerprintScanned', stlTransformer.transform('OnFingerprintScanned', data));
    });

    iomSocket.on('OnPhotoTaken', function (data) {
      uiSocket.emit('OnPhotoTaken', stlTransformer.transform('OnPhotoTaken', data));
    });

    iomSocket.on('OnNewDocumentScanned', function (data) {
      uiSocket.emit('OnNewDocumentScanned', stlTransformer.transform('OnNewDocumentScanned', data));
    });

    uiSocket.emit('OnStatusChanged',
        '<result><status>success</status><message>connected</message></result>'
    );
  });
});
