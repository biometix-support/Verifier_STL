
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

        var FINGERPRINT_URL = "fingerprintUrl";
        var PHOTO_URL = "photoUrl";
        var DOC_TYPE = "docType";
        var GAP = 1;

        if (event.indexOf(ON_FINGERPRINT_SCANNED) > -1 || event.indexOf(ON_PHOTO_TAKEN) > -1
            || event.indexOf(ON_DOCUMENT_SCANNED) > -1){
            return getXMLResult(rawMessage);
        }
        //else if (event.indexOf(DOC_TYPE) > -1){
        //    GAP=8;
        //    var transformedStr = "[\"" + ON_DOCUMENT_SCANNED + "\",\"" + getXMLResult(rawMessage) + "\"]";
        //    var newBuffer3 = createNewBuffer(extractedModifyHeader(rawMessage), transformedStr);
        //    return newBuffer3;
        //} else {
        //    return data;
        //}

        function createNewBuffer(header, transformedStr) {
            var modifiedBuffer = new Buffer(header + "42" + transformedStr, "binary");
            var upperThreshold = modifiedBuffer.length - GAP;
            var numberArray = upperThreshold.toString().split('');

            for (var i = 0; i < numberArray.length; i++) {
                modifiedBuffer[i + 1] = numberArray[i];
            }
            modifiedBuffer[numberArray.length + 1] = 255;

            return modifiedBuffer;
        }
        function updateHeader(header) {
            var newCountStr = transformedStr.length + header.length + 1 + '';
            var existingCountStr = rawMessage.length + '';

            if (newCountStr.length - existingCountStr.length > 0) {
                header = header + ' ';
            }

            return header;
        }

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
            //xmlResult = replaceImageURL(xmlResult); // replace image url with base64 image

            return xmlResult;
        }

        function replaceImageURL(xmlResult) {

            console.log(result);
        }

        function extractedResult(rawMessage) {
            var result = {
                "status": "",
                "message": "",
                "sensorData": []
            };
            //var rawResult = JSON.parse(rawMessage.substring(rawMessage.indexOf("["), rawMessage.length));

            result.status = 'success';

            result.message = rawMessage;

            var imagePathArray = result.message.match(/(C:.*?\.(jpg|bmp))/img);

            if (imagePathArray != null) {
                for (var i = 0; i < imagePathArray.length; i++) {
                    var imageURL = imagePathArray[i];

                    var base64 = base64Encode(imageURL);
                    result.sensorData.push({'imageURL' : imageURL, 'base64': base64});
                    //result.sensorData.push({'imageURL' : imageURL, 'base64': 'base64'});
                }
            }

            return result;
        }


        function getXMLResult(rawMessage) {
            var result = extractedResult(rawMessage);
            var xmlResult = convertResultToXML(result);
            return xmlResult;
        }

        function extractedModifyHeader(rawMessage) {
            var breakPoint = rawMessage.indexOf("42[");
            var header = rawMessage.substring(0, breakPoint);
            header = updateHeader(header);
            return header;
        }

        function base64Encode(file) {
            // read file
            var bitmap = fs.readFileSync(file);
            // convert data to base64 encoded string
            return new Buffer(bitmap).toString('base64');
        }


    },

    /**
     *
     */
    unescape: function(html) {
        return String(html)
            .replace(/&gt;/g, '>');
    }
};