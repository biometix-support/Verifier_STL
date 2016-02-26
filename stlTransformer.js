
/**
 * Created by phillip on 23/02/2016.
 */

var js2xmlparser = require("js2xmlparser"),
    fs = require('fs');

module.exports = {
    transform: function(event, data) {
        var rawMessage = data.toString('ascii');
        var ON_STATUS_CHANGED = "OnStatusChanged";
        var ON_FINGERPRINT_SCANNED = "OnFingerprintScanned";
        var ON_PHOTO_TAKEN = "OnPhotoTaken";
        var ON_DOCUMENT_SCANNED = "OnNewDocumentScanned";
        var IOM_INSTALATION_DIR = "C:\\VERIFIERv2-IOM\\Acquisition\\Temp\\";

        if (event.indexOf(ON_FINGERPRINT_SCANNED) > -1 || event.indexOf(ON_PHOTO_TAKEN) > -1
            || event.indexOf(ON_DOCUMENT_SCANNED) > -1){
            return getXMLResult(rawMessage);
        }
        //else if (){
        //} else {
        //}

        function convertResultToXML(result) {
            var options = {
                prettyPrinting: {
                    enabled: true,
                    indentString: ''
                }
            };
            var xmlResult = js2xmlparser("result", result, options);
            xmlResult = xmlResult.replace(/(\n)/gm, "");
            xmlResult = xmlResult.replace(/("|&quot;)/gm, "\\\"");

            return xmlResult;
        }

        function extractedResult(rawMessage) {
            var result = {
                "status": "",
                "message": "",
                "sensorData": []
            };

            result.status = 'success';
            result.message = rawMessage;

            var imagePathArray = result.message.match(/(C:.*?\.(jpg|bmp))/img);

            if (imagePathArray != null) {
                for (var i = 0; i < imagePathArray.length; i++) {
                    var imageURL = imagePathArray[i];

                    var base64 = base64Encode(imageURL);
                    result.sensorData.push({'imageURL' : imageURL, 'base64': base64});
                }
            }

            return result;
        }

        function getXMLResult(rawMessage) {
            var result = extractedResult(rawMessage);
            var xmlResult = convertResultToXML(result);
            return xmlResult;
        }

        function base64Encode(file) {
            // read file
            var bitmap = fs.readFileSync(file);
            // convert data to base64 encoded string
            return new Buffer(bitmap).toString('base64');
        }
    }
};