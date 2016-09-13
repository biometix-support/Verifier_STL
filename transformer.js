var http = require('http'),
    stlTransformer = require("./stlTransformer.js"),
    testFile = require("./testFile.js"),
    fakeData = require("./fakeData.js"),
    express = require('express'),
    request = require("request"),
    app = express(),
    fs = require('fs'),
    path = require("path");
// this will send a fake data back to the client
var isTest = false;

var proxyPort = 8001;
var current10FPScanningDevice = '';

/**
 * Constant defintions.
 */
const server = app.listen(proxyPort);
const FP_MATCHING_URL = 'http://127.0.0.1/Matching/CompareFingerprintsPath';
const FACE_MATCHING_URL = 'http://127.0.0.1/Matching/CompareFacesPath';
const TEMP_DIR = 'C:\\Temp\\tmpPhotos\\';

function clearTempFolder() {
    // creates a new dir if it does no exist
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR);
    }
    else {
        // delete the temp folder with temp files and crate a empty one
        deleteFolderRecursive(TEMP_DIR);
        fs.mkdirSync(TEMP_DIR);
    }
}
clearTempFolder();

function saveImageToDisk(base64File, callback) {
    var base64Data = base64File.replace(/^data:image\/png;base64,/, "");
    base64Data = base64File.replace(/^data:image\/jpeg;base64,/, "");

    var fileName = generateId(10) + '.jpeg';

    fs.writeFile(TEMP_DIR + fileName, base64Data, 'base64', function (err) {
        if (err)
            console.log(err);
        else {
            callback(fileName);
        }
    });
}
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

function generateId(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

var ui = require('socket.io')(server); // ui socket to connect to front-end.
ui.on('connection', function (uiSocket) {
    console.log('Socket io connected', uiSocket.client.id);
    // Init :Catch Events for Test Data
    uiSocket.on('CompFaceReq', function (data) {
        if (isTest) {
            uiSocket.emit('OnFaceRes', fakeData.getFacialMatch());
        }
    });
    uiSocket.on('ComFinReq', function (data) {
        if (isTest) {
            uiSocket.emit('OnFPRes', fakeData.fpMatch());
        }
    });
    uiSocket.on('Compare10FPReq', function (data) {
        if (isTest) {
            uiSocket.emit('On10FPRes', fakeData.fpMatch());
        }
    });
    uiSocket.on('TriggerFingerprintScan', function () {
        if (isTest) {
            uiSocket.emit('OnFingerprintScanned', fakeData.getFP());
        }
    });

    uiSocket.on('Trigger10FingerprintScan', function (jsonSelectedDeviceData) {
        if (isTest) {
            var jsonData = JSON.parse(jsonSelectedDeviceData);
            if (jsonData.device === 'lumidigm') {
                uiSocket.emit('On10FingerprintScanned', fakeData.get10FPLumidigm());
            }
            else if (jsonData.device === 'crossmatch') {
                uiSocket.emit('On10FingerprintScanned', fakeData.get10FPCrossmatch());
            }
        }
    });

    uiSocket.on('TriggerPhotoTake', function () {
        if (isTest) {
            uiSocket.emit('OnPhotoTaken', fakeData.photoTaken());
        }
    });
    uiSocket.on('checkStatus', function () {
        if (isTest) {
            uiSocket.emit('OnStatusChanged', fakeData.getDevices());
        }
    });
    uiSocket.on('TriggerNewDocumentScan', function () {
        if (isTest) {
            uiSocket.emit('OnNewDocumentScanned', testFile.getData());
        }
    });
    // END: Test Data

    /**
     * Matching
     */
    uiSocket.on('CompFaceReq', function (data) {
        if (!isTest) {
            clearTempFolder();
            saveImageToDisk(data.face1, function (filename1) {
                saveImageToDisk(data.face2, function (filename2) {
                    var face1 = TEMP_DIR + filename1;
                    var face2 = TEMP_DIR + filename2;

                    var faceData = {
                        face1: face1,
                        face2: face2
                    };

                    request({
                        url: FACE_MATCHING_URL,
                        method: "POST",
                        json: true,
                        headers: {
                            "content-type": "application/json",
                        },
                        body: faceData
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            uiSocket.emit('OnFaceRes', stlTransformer.transform('OnFaceRes', body, data.type));
                        }
                        else {
                            console.log("error: " + error)
                        }
                    });
                });

            });
        }
    });

    uiSocket.on('ComFinReq', function (data) {
        if (!isTest) {
            clearTempFolder();
            saveImageToDisk(data.finger1, function (filename1) {
                saveImageToDisk(data.finger2, function (filename2) {
                    var finger1 = TEMP_DIR + filename1;
                    var finger2 = TEMP_DIR + filename2;

                    var fingerData = {
                        finger1: finger1,
                        finger2: finger2
                    };

                    request({
                        url: FP_MATCHING_URL,
                        method: "POST",
                        json: true,
                        headers: {
                            "content-type": "application/json",
                        },
                        body: fingerData
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            uiSocket.emit('OnFPRes', stlTransformer.transform('OnFPRes', body));
                        }
                        else {
                            console.log("error: " + error)
                        }
                    });
                });
            });
        }
    });
    
    uiSocket.on('Compare10FPReq', function (data) {
        if (!isTest) {
            clearTempFolder();
            saveImageToDisk(data.fingerData.finger1, function (filename1) {
                saveImageToDisk(data.fingerData.finger2, function (filename2) {
                    var finger1 = TEMP_DIR + filename1;
                    var finger2 = TEMP_DIR + filename2;

                    var fpData = {
                        finger1: finger1,
                        finger2: finger2
                    };

                    request({
                        url: FP_MATCHING_URL,
                        method: "POST",
                        json: true,
                        headers: {
                            "content-type": "application/json",
                        },
                        body: fpData
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            uiSocket.emit('On10FPRes', stlTransformer.transform('On10FPRes', body, data.type));
                        }
                        else {
                            console.log("error: " + error)
                        }
                    });
                });
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
            if (!isTest) {
                current10FPScanningDevice = '';
                iomSocket.send("getFingerscan()");
            }
        });
    
        uiSocket.on('TriggerScanFinger', function (data) {
            if (!isTest) {
                iomSocket.send(data);
            }
        });
        
        uiSocket.on('Trigger10FingerprintScan', function (jsonSelectedDeviceData) {
            if (!isTest) {
                var jsonData = JSON.parse(jsonSelectedDeviceData);
                current10FPScanningDevice = jsonData.device;
                if (jsonData.device === 'lumidigm') {
                    iomSocket.send("getFingerscan()");
                }
                else if (jsonData.device === 'crossmatch') {
                    uiSocket.emit('On10FingerprintScanned', fakeData.get10FPCrossmatch());
                }
            }
        });

        // request to take photo
        uiSocket.on('TriggerPhotoTake', function () {
            if (!isTest) {
                iomSocket.send("getCamera()");
            }
        });

        uiSocket.on('checkStatus', function () {
            if (!isTest) {
                iomSocket.send("checkDevices()");
            }
        });

        function checkDevices() {
            iomSocket.send("checkDevices()");
        }

        // request to scan a passport
        uiSocket.on('TriggerNewDocumentScan', function () {
            if (!isTest) {
                iomSocket.send("scanNewDoc()");
            }
        });

        // handle message from IOM socket
        iomSocket.on('message', function (message) {
            if (message.type === 'utf8' && uiSocket.connected) {
                if (message.utf8Data.indexOf("photoUrl") > -1) {
                    uiSocket.emit('OnPhotoTaken', stlTransformer.transform('OnPhotoTaken', message.utf8Data));
                } 
                else if (message.utf8Data.indexOf("fingerprintUrl") > -1) {
                    if (current10FPScanningDevice === '') {
                        uiSocket.emit('OnFingerprintScanned', stlTransformer.transform('OnFingerprintScanned', message.utf8Data));
                    }
                    else {
                        uiSocket.emit('On10FingerprintScanned', stlTransformer.transform('OnFingerprintScanned', message.utf8Data));
                    }
                } 
                else if (message.utf8Data.indexOf("\"success\":true") > -1) {
                    uiSocket.emit('OnNewDocumentScanned', stlTransformer.transform('OnNewDocumentScanned', message.utf8Data));
                } 
                else if (message.utf8Data.indexOf("Devices") > -1) {
                    uiSocket.emit('OnStatusChanged', message.utf8Data);
                } 
                else {
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
