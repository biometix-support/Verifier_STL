var http = require('http'),
    stlTransformer = require("./stlTransformer.js"),
    testFile = require("./testFile.js"),
    fakeData = require("./fakeData.js"),
    express = require('express'),
    request = require("request"),
    app = express();

// this will send a fake data back to the client
var isTest = false;

var proxyPort = 8001;

/**
 * Constant defintions.
 */
const server = app.listen(proxyPort);
const FP_MATCHING_URL = 'http://127.0.0.1/Matching/CompareFingerprints';
const FACE_MATCHING_URL = 'http://127.0.0.1/Matching/CompareFaces';


var ui = require('socket.io')(server); // ui socket to connect to front-end.
ui.on('connection', function (uiSocket) {
    console.log('Socket io connected', uiSocket.client.id);

    /**
     * Matching
     */
    uiSocket.on('CompFaceReq', function (data) {
        if (isTest) {
            uiSocket.emit('OnFaceRes', fakeData.getFacialMatch());
        }
        else {
            request({
                url: FACE_MATCHING_URL,
                method: "POST",
                json: true,
                headers: {
                    "content-type": "application/json",
                },
                body: data
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    uiSocket.emit('OnFaceRes', stlTransformer.transform('OnFaceRes', body));
                }
                else {
                    console.log("error: " + error)
                }
            });
        }
    });


    uiSocket.on('ComFinReq', function (data) {
        if (isTest) {
            uiSocket.emit('OnFPRes', fakeData.fpMatch());
        }
        else {
            request({
                url: FP_MATCHING_URL,
                method: "POST",
                json: true,
                headers: {
                    "content-type": "application/json",
                },
                body: data
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    uiSocket.emit('OnFPRes', stlTransformer.transform('OnFPRes', body));
                }
                else {
                    console.log("error: " + error)
                }
            });
        }
    });

    /**
     * Acquisition
     */
    // connect to C# web socket.

    var WebSocketClient = require('websocket').client;
    var iomClient = new WebSocketClient();
    iomClient.connect('ws://127.0.0.1:4501/Reader');
    var clients = [];
    iomClient.on('connect', function (iomSocket) {
        checkDevices();
        // request finger print scan
        uiSocket.on('TriggerFingerprintScan', function () {
            if (isTest) {
                uiSocket.emit('OnFingerprintScanned', fakeData.getFP());
            }
            else {
                iomSocket.send("getFingerscan()");
            }
        });

        // request to take photo
        uiSocket.on('TriggerPhotoTake', function () {
            if (isTest) {
                uiSocket.emit('OnPhotoTaken', fakeData.photoTaken());
            }
            else {
                iomSocket.send("getCamera()");
            }
        });

        uiSocket.on('checkStatus', function () {
            if (isTest) {
                uiSocket.emit('OnStatusChanged', fakeData.getDevices());
            }
            else {
                iomSocket.send("checkDevices()");
            }
        });

        function checkDevices() {
          
                iomSocket.send("checkDevices()");
          }

        // request to scan a passport
        uiSocket.on('TriggerNewDocumentScan', function () {
            if (isTest) {
                uiSocket.emit('OnNewDocumentScanned', testFile.getData());
            }
            else {
                iomSocket.send("scanNewDoc()");
            }
        });

        // handle message from IOM socket
        iomSocket.on('message', function (message) {

            if (message.type === 'utf8' && uiSocket.connected) {
                if (message.utf8Data.indexOf("photoUrl") > -1) {
                    uiSocket.emit('OnPhotoTaken', stlTransformer.transform('OnPhotoTaken', message.utf8Data));
                } else if (message.utf8Data.indexOf("fingerprintUrl") > -1) {
                    uiSocket.emit('OnFingerprintScanned', stlTransformer.transform('OnFingerprintScanned', message.utf8Data));
                } else if (message.utf8Data.indexOf("\"success\":true") > -1) {
                    uiSocket.emit('OnNewDocumentScanned', stlTransformer.transform('OnNewDocumentScanned', message.utf8Data));
                } else if (message.utf8Data.indexOf("Devices") > -1) {
                    uiSocket.emit('OnStatusChanged', message.utf8Data);
                } else {
                    uiSocket.emit('OnReadingDocStatus', message.utf8Data);
                }
            }
        });

        //TODO: clarify with IOM on how to check device connection status.
        // uiSocket.emit('OnStatusChanged',
        //     '<result><status>success</status><message>connected</message></result>'
        // );
    });
});