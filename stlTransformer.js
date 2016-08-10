/**
 * Created by phillip on 23/02/2016.
 */

var js2xmlparser = require("js2xmlparser"),
    config = require("./config.js"),
    gm = require('gm'),
    deasync = require('deasync'),
    fs = require('fs');

module.exports = {
    transform: function (event, data) {
        /**
         * Constant definitions.
         */
        const ON_FINGERPRINT_SCANNED = "OnFingerprintScanned";
        const ON_PHOTO_TAKEN = "OnPhotoTaken";
        const ON_DOCUMENT_SCANNED = "OnNewDocumentScanned";
        const ON_FP_MATCH_RES = 'OnFPRes';
        const ON_FACE_MATCH_RES = 'OnFaceRes';

        /**
         * Global variables.
         */
        var rawMessage = data.toString('ascii');
        var XML_CONVERT_OPTIONS = {
            prettyPrinting: {
                enabled: true,
                indentString: ''
            }
        };

        /**
         * Main flow.
         */
        if (event.indexOf(ON_FINGERPRINT_SCANNED) > -1 || event.indexOf(ON_PHOTO_TAKEN) > -1
            || event.indexOf(ON_DOCUMENT_SCANNED) > -1) {
            return convertAcquisitionResultToXML(rawMessage);
        }
        else if (event.indexOf(ON_FP_MATCH_RES) > -1 || event.indexOf(ON_FACE_MATCH_RES) > -1) {
            return convertMatchingResultToXML(data);
        }

        /**
         * Utility functions.
         */

        /**
         * Populate JSON object with Acquisition result.
         * @param rawMessage
         * @returns {{status: string, message: string, sensorData: Array}}
         */
        function populateAcquisitionResult(rawMessage) {
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
                    result.sensorData.push({ 'imageURL': imageURL, 'base64': base64 });
                }
            }

            return result;
        }

        /**
         * Populate JSON object with Matching result.
         * @param rawMessage
         * @returns {{ResponseStatus: {Return: number, Message: string}, QualityInfo: {QualityScore: number}}}
         */
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

        /**
         * Convert matching result to XML.
         * @param rawMessage
         * @returns XML matching result.
         */
        function convertMatchingResultToXML(rawMessage) {
            var checkQualityResponse = populateCheckQualityResponse(rawMessage);
            var xmlResult = js2xmlparser("CheckQualityResponse", checkQualityResponse, XML_CONVERT_OPTIONS);

            return cleanupXML(xmlResult);
        }

        /**
         * Convert acquisition result to XML.
         * @param rawMessage
         * @returns {*}
         */
        function convertAcquisitionResultToXML(rawMessage) {
            var result = populateAcquisitionResult(rawMessage);
            var xmlResult = js2xmlparser("result", result, XML_CONVERT_OPTIONS);

            return cleanupXML(xmlResult);
        }

        /**
         * Convert image file to base64.
         * @param file image file.
         * @returns base64 string.
         */
        function base64Encode(file) {
            var newFileName = resize(file);
            var bitmap = fs.readFileSync(newFileName);
            return new Buffer(bitmap).toString('base64');
        }

        /**
         * Clean up XML string.
         * @param xmlResult
         * @returns {XML|string|*}
         */
        function cleanupXML(xmlResult) {
            xmlResult = xmlResult.replace(/(\n)/gm, "");
            xmlResult = xmlResult.replace(/("|&quot;)/gm, "\\\"");

            var fs = require('fs');
            var stream = fs.createWriteStream("c:\\temp\\my_file.txt");
            stream.once('open', function (fd) {
                stream.write(xmlResult);
                stream.end();
            });

            return xmlResult;


        }

        function resize(file) {
            var newFileName = file.replace('.', '-thumb.'),
                done = false;

            gm(file)
                .resize(config.image.maxHeight, config.image.maxWidth)
                .noProfile()
                .write(newFileName, function (err) {
                    if (err) throw err;
                    done = true;
                });

            deasync.loopWhile(function () { return !done; });

            return newFileName;
        }
    }
};