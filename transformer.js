var http = require('http'),
    stlTransformer = require("./stlTransformer.js"),
    express = require('express'),
    request = require("request"),
    app = express();

var proxyPort = 8001;

/**
 * Constant defintions.
 */
const server = app.listen(proxyPort);
const FP_MATCHING_URL = 'http://127.0.0.1/Matching/CompareFingerprints';
const FACE_MATCHING_URL = 'http://127.0.0.1/Matching/CompareFaces';


var ui = require('socket.io')(server); // ui socket to connect to front-end.
ui.on('connection', function(uiSocket) {
    console.log('Socket io connected', uiSocket.client.id);

    //TODO needs to send the real values to the connected clients
    ui.emit('OnStatusChanged', {
        documentScanner: true,
        camera: true,
        fingerprintScanner: true
    });


    /**
     * Matching
     */
    uiSocket.on('CompFaceReq', function(data) {
        request({
            url: FACE_MATCHING_URL,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: data
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                uiSocket.emit('OnFaceRes', stlTransformer.transform('OnFaceRes', body));
            }
            else {
                console.log("error: " + error)
            }
        });
    });
    
    uiSocket.on('checkStatus', function() {
        uiSocket.emit('OnStatusChanged', {
            documentScanner: true,
            camera: true,
            fingerprintScanner: true
        });
    })
    uiSocket.on('ComFinReq', function(data) {
        request({
            url: FP_MATCHING_URL,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: data
        }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                uiSocket.emit('OnFPRes', stlTransformer.transform('OnFPRes', body));
            }
            else {
                console.log("error: " + error)
            }
        });
    });

    /**
     * Acquisition
     */
    // connect to C# web socket.
    var WebSocketClient = require('websocket').client;
    var iomClient = new WebSocketClient();
    iomClient.connect('ws://127.0.0.1:4501/Reader');
    var clients = [];
    iomClient.on('connect', function(iomSocket) {
       
        // request finger print scan
        uiSocket.on('TriggerFingerprintScan', function() {
            iomSocket.send("getFingerscan()");
        });

        // request to take photo
        uiSocket.on('TriggerPhotoTake', function() {
            iomSocket.send("getCamera()");
        });

        // request to scan a passport
        uiSocket.on('TriggerNewDocumentScan', function() {
            iomSocket.send("scanNewDoc()");
        });
       
        // handle message from IOM socket
        iomSocket.on('message', function(message) {
            
            if (message.type === 'utf8' && uiSocket.connected) {
                if (message.utf8Data.indexOf("photoUrl") > -1) {
                    uiSocket.emit('OnPhotoTaken', stlTransformer.transform('OnPhotoTaken', message.utf8Data));
                } else if (message.utf8Data.indexOf("fingerprintUrl") > -1) {
                    uiSocket.emit('OnFingerprintScanned', stlTransformer.transform('OnFingerprintScanned', message.utf8Data));
                } else if (message.utf8Data.indexOf("\"success\":true") > -1) {
                    uiSocket.emit('OnNewDocumentScanned', stlTransformer.transform('OnNewDocumentScanned', message.utf8Data));
                } else {
                    uiSocket.emit('OnReadingDocStatus', message.utf8Data);
                }
            }
        });

        //TODO: clarify with IOM on how to check device connection status.
        uiSocket.emit('OnStatusChanged',
            '<result><status>success</status><message>connected</message></result>'
        );
    });
});
