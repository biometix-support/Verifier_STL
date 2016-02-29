
/**
 * Created by phillip on 23/02/2016.
 */

var js2xmlparser = require("js2xmlparser"),
    fs = require('fs');

module.exports = {
    transform: function(event, data) {
        var rawMessage = data.toString('ascii');
        var ON_FINGERPRINT_SCANNED = "OnFingerprintScanned";
        var ON_PHOTO_TAKEN = "OnPhotoTaken";
        var ON_DOCUMENT_SCANNED = "OnNewDocumentScanned";
        var ON_FP_MATCH_RES = 'OnFPRes';
        var ON_FACE_MATCH_RES = 'OnFaceRes';
        var XML_CONVERT_OPTIONS = {
            prettyPrinting: {
                enabled: true,
                indentString: ''
            }
        };

        if (event.indexOf(ON_FINGERPRINT_SCANNED) > -1 || event.indexOf(ON_PHOTO_TAKEN) > -1
            || event.indexOf(ON_DOCUMENT_SCANNED) > -1){
            return getXMLResultForAcquisition(rawMessage);
        }
        else if (event.indexOf(ON_FP_MATCH_RES) > -1 || event.indexOf(ON_FACE_MATCH_RES) > -1){
            return getXMLResultForMatching(data);
        }

        function cleanupXML(xmlResult) {
            xmlResult = xmlResult.replace(/(\n)/gm, "");
            xmlResult = xmlResult.replace(/("|&quot;)/gm, "\\\"");
            return xmlResult;
        }

        function convertAcquisitionResultToXML(result) {
            var xmlResult = js2xmlparser("result", result, XML_CONVERT_OPTIONS);
            xmlResult = cleanupXML(xmlResult);
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

        function populateCheckQualityResponse(rawMessage) {
            var checkQualityResponse = {
                ResponseStatus: {
                    Return: -1,
                    Message: ''
                },
                QualityInfo: {
                    QualityScore: -1
                }
            };

            if (rawMessage.success) {
                checkQualityResponse.ResponseStatus.Return = 0;
                checkQualityResponse.QualityInfo.QualityScore = rawMessage.data.score;
            } else {
                checkQualityResponse.ResponseStatus.Return = rawMessage.errorMsg.code;
                checkQualityResponse.ResponseStatus.Message = rawMessage.errorMsg.msg;
            }

            return checkQualityResponse;
        }

        function getXMLResultForMatching(rawMessage) {
            var checkQualityResponse = populateCheckQualityResponse(rawMessage);
            var xmlResult = js2xmlparser("CheckQualityResponse", checkQualityResponse, XML_CONVERT_OPTIONS);

            return cleanupXML(xmlResult);
        }

        function getXMLResultForAcquisition(rawMessage) {
            var result = extractedResult(rawMessage);
            var xmlResult = convertAcquisitionResultToXML(result);
            return xmlResult;
        }

        function base64Encode(file) {
            var bitmap = fs.readFileSync(file);
            return new Buffer(bitmap).toString('base64');
        }
    }
};