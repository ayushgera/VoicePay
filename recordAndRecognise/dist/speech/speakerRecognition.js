"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var commonService = require('../commonService');

/**
 *  Speaker Recognition APIs are cloud-based APIs that provide the most advanced algorithms for speaker verification and speaker identification. 
 * Speaker Recognition can be divided into two categories: speaker verification and speaker identification.
 * @augments commonService
 * {@link https://westus.dev.cognitive.microsoft.com/docs/services/563309b6778daf02acc0a508/operations/5645c3271984551c84ec6797|documentation}
 */

var speakerRecognition = function (_commonService) {
    _inherits(speakerRecognition, _commonService);

    /**
     * Constructor.
     * 
     * @param {Object} obj
     * @param {string} obj.apiKey
     * @param {string} obj.endpoint
     */
    function speakerRecognition(_ref) {
        var apiKey = _ref.apiKey,
            endpoint = _ref.endpoint;

        _classCallCheck(this, speakerRecognition);

        var _this = _possibleConstructorReturn(this, _commonService.call(this, { apiKey: apiKey, endpoint: endpoint }));

        _this.serviceId = "563309b6778daf02acc0a508";
        _this.endpoints = ["westus.api.cognitive.microsoft.com"];
        return _this;
    }

    /**
     * Enrollment for speaker identification is text-independent, which means that there are no restrictions on
     * what the speaker says in the audio. The speaker's voice is recorded, and a number of features are extracted to form a unique voiceprint.
     * @returns {Promise.<object>}
     */


    speakerRecognition.prototype.identificationProfileCreateEnrollment = function identificationProfileCreateEnrollment(_ref2) {
        var parameters = _ref2.parameters,
            headers = _ref2.headers,
            body = _ref2.body;


        var operation = {
            "path": "spid/v1.0/identificationProfiles/{identificationProfileId}/enroll",
            "method": "POST",
            "operationId": "5645c3271984551c84ec6797",
            "headers": [{
                "name": "Content-Type",
                "description": "Media type of the body sent to the API.",
                "options": ["application/octet-stream", "multipart/form-data"],
                "required": false,
                "typeName": "string"
            }],
            "parameters": [{
                "name": "identificationProfileId",
                "description": "ID of speaker identification profile. GUID returned from Identification Profile - Create Profile API",
                "value": null,
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }, {
                "name": "shortAudio",
                "description": "Instruct the service to waive the recommended minimum audio limit needed for enrollment. \
                    Set value to 'true' to force enrollment using any audio length (min. 1 second).",
                "value": null,
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters,
            headers: headers,
            body: body
        });
    };

    /**
     * Create a new speaker identification profile with specified locale.
     * One subscription can only create 1000 speaker verification/identification profiles at most.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.identificationProfileCreateProfile = function identificationProfileCreateProfile(_ref3) {
        var parameters = _ref3.parameters,
            headers = _ref3.headers,
            body = _ref3.body;


        var operation = {
            "path": "spid/v1.0/identificationProfiles",
            "method": "POST",
            "operationId": "5645c068e597ed22ec38f42e",
            "headers": [{
                "name": "Content-Type",
                "description": "Media type of the body sent to the API.",
                "options": ["application/json"],
                "required": false,
                "typeName": "string"
            }],
            "parameters": [{
                "name": "locale",
                "description": "Locale for the language of this speaker identification profile. A complete supported locale list is here:\
                en-US (English US)\
                zh-CN (Chinese Mandarin)",
                "value": "en-US",
                "required": false,
                "type": "inBody",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters,
            headers: headers,
            body: body
        });
    };

    /**
     * Delete profile
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.identificationProfileDeleteProfile = function identificationProfileDeleteProfile(_ref4) {
        var parameters = _ref4.parameters;


        var operation = {
            "path": "spid/v1.0/identificationProfiles/{identificationProfileId}",
            "method": "DELETE",
            "operationId": "5645c068e597ed22ec38f42e",
            "parameters": [{
                "name": "identificationProfileId",
                "description": "ID of speaker identification profile. GUID returned from Identification Profile - Create Profile API",
                "value": null,
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters
        });
    };

    /**
     * Get all speaker identification profiles within the subscription.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.identificationProfileGetAll = function identificationProfileGetAll() {

        var operation = {
            "path": "spid/v1.0/identificationProfiles",
            "method": "GET",
            "operationId": "5645c211e597ed22ec38f431"
        };

        return this.makeRequest({
            operation: operation
        });
    };

    /**
     * Get a speaker identification profile by identificationProfileId.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.identificationProfileGet = function identificationProfileGet(_ref5) {
        var parameters = _ref5.parameters;


        var operation = {
            "path": "spid/v1.0/identificationProfiles/{identificationProfileId}",
            "method": "GET",
            "operationId": "5645c211e597ed22ec38f431",
            "parameters": [{
                "name": "identificationProfileId",
                "description": "ID of speaker identification profile. GUID returned from Identification Profile - Create Profile API",
                "value": null,
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters
        });
    };

    /**
     * Deletes all enrollments associated with the given speaker identification profile permanently from the service.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.identificationProfileResetEnrollments = function identificationProfileResetEnrollments(_ref6) {
        var parameters = _ref6.parameters;


        var operation = {
            "path": "spid/v1.0/identificationProfiles/{identificationProfileId}/reset",
            "method": "POST",
            "operationId": "5645c211e597ed22ec38f431",
            "parameters": [{
                "name": "identificationProfileId",
                "description": "ID of speaker identification profile. GUID returned from Identification Profile - Create Profile API",
                "value": null,
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters
        });
    };

    /**
     * Get operation status or result. The operation should be created by Speaker Recognition - Identification or Identification Profile - Create Enrollment.
     * And the URL should be retrieved from Operation-Location header of initial POST 202 response.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.speakerRecognitionGetStatus = function speakerRecognitionGetStatus(_ref7) {
        var parameters = _ref7.parameters;


        var operation = {
            "path": "spid/v1.0/operations/{operationId}",
            "method": "GET",
            "operationId": "5645c725ca73070ee8845bd6",
            "parameters": [{
                "name": "operationId",
                "description": "The operation Id, created by Speaker Recognition - Identification or Identification Profile - Create Enrollment.",
                "value": null,
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters
        });
    };

    /**
     * Automatically identify who is speaking given a group of speakers
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.speakerRecognitionIdentification = function speakerRecognitionIdentification(_ref8) {
        var parameters = _ref8.parameters,
            headers = _ref8.headers,
            body = _ref8.body;


        var operation = {
            "path": "spid/v1.0/identify",
            "method": "POST",
            "operationId": "5645c725ca73070ee8845bd6",
            "headers": [{
                "name": "Content-Type",
                "description": "Media type of the body sent to the API.",
                "options": ["application/octet-stream", "multipart/form-data"],
                "required": false,
                "typeName": "string"
            }],
            "parameters": [{
                "name": "identificationProfileIds",
                "description": "Comma-delimited identificationProfileIds, the id should be Guid. It can only support at most 10 profiles for one identification request.",
                "value": null,
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "shortAudio",
                "description": "Instruct the service to waive the recommended minimum audio limit needed for identification. Set value to “true” to force identification using any audio length (min. 1 second).",
                "value": null,
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters,
            headers: headers,
            body: body
        });
    };

    /**
     *  Automatically identify who is speaking given a group of speakers.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.speakerRecognitionVerification = function speakerRecognitionVerification(_ref9) {
        var parameters = _ref9.parameters,
            headers = _ref9.headers,
            body = _ref9.body;


        var operation = {
            "path": "spid/v1.0/verify",
            "method": "POST",
            "operationId": "5645c725ca73070ee8845bd6",
            "headers": [{
                "name": "Content-Type",
                "description": "Media type of the body sent to the API.",
                "options": ["application/octet-stream", "multipart/form-data"],
                "required": false,
                "typeName": "string"
            }],
            "parameters": [{
                "name": "verificationProfileId",
                "description": "ID of speaker verification profile. It should be a GUID.",
                "value": null,
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters,
            headers: headers,
            body: body
        });
    };

    /**
     * Returns the list of supported verification phrases that can be used for Verification Profile - Create Enrollment and Speaker Recognition - Verification.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.listAllSupportedVerificationPhrases = function listAllSupportedVerificationPhrases(_ref10) {
        var parameters = _ref10.parameters;


        var operation = {
            "path": "spid/v1.0/verificationPhrases",
            "method": "GET",
            "operationId": "5652c0801984551c3859634d",
            "parameters": [{
                "name": "locale",
                "description": "Locale for the language when retrieving verification phrases.",
                "value": "en-US",
                "required": true,
                "type": "queryStringParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters
        });
    };

    /**
     * Enrollment for speaker verification is text-dependent, which means speaker need to choose a specific phrase to use in both enrollment and verification. List of supported phrases can be found in Verification Phrase - List All Supported Verification Phrases.
    The service requires at least 3 enrollments for each speaker before the profile can be used in verification scenarios. 
    It is recommended to use the same device (mic) in both enrollment and verification.
    @returns {Promise.<object>}
     */
    speakerRecognition.prototype.verificationProfileCreateEnrollment = function verificationProfileCreateEnrollment(_ref11) {
        var parameters = _ref11.parameters,
            headers = _ref11.headers,
            body = _ref11.body;


        var operation = {
            "path": "spid/v1.0/verificationProfiles/{verificationProfileId}/enroll",
            "method": "POST",
            "operationId": "56406930e597ed20c8d8549c",
            "headers": [{
                "name": "Content-Type",
                "description": "Media type of the body sent to the API.",
                "options": ["application/octet-stream", "multipart/form-data"],
                "required": false,
                "typeName": "string"
            }],
            "parameters": [{
                "name": "verificationProfileId",
                "description": "ID of speaker verification profile. GUID returned from Verification Profile - Create Profile API",
                "value": null,
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters,
            headers: headers,
            body: body
        });
    };

    /**
     * Create a new speaker verification profile with specific locale.
     * One subscription can only create 1000 speaker verification/identification profiles at most.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.verificationProfileCreateProfile = function verificationProfileCreateProfile(_ref12) {
        var headers = _ref12.headers,
            body = _ref12.body;


        var operation = {
            "path": "spid/v1.0/verificationProfiles",
            "method": "POST",
            "operationId": "5645c068e597ed22ec38f42e",
            "headers": [{
                "name": "Content-Type",
                "description": "Media type of the body sent to the API.",
                "options": ["application/json"],
                "required": false,
                "typeName": "string"
            }, {
                "name": "locale",
                "description": "Locale for language of the new speaker verification profile. ",
                "value": null,
                "required": false,
                "type": "inBody",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            headers: headers,
            body: body
        });
    };

    /**
     * Deletes both speaker verification profile and all associated enrollments permanently from the service.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.verificationProfileDeleteProfile = function verificationProfileDeleteProfile(_ref13) {
        var parameters = _ref13.parameters;


        var operation = {
            "path": "spid/v1.0/verificationProfiles/{verificationProfileId}",
            "method": "DELETE",
            "operationId": "563309b7778daf06340c9655",
            "parameters": [{
                "name": "verificationProfileId",
                "description": "ID of speaker verification profile. It should be a GUID.",
                "value": null,
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters
        });
    };

    /**
     * Get all speaker verification profiles within the subscription.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.verificationProfileGetAllProfiles = function verificationProfileGetAllProfiles() {

        var operation = {
            "path": "spid/v1.0/verificationProfiles",
            "method": "GET",
            "operationId": "563309b7778daf06340c9653"
        };

        return this.makeRequest({
            operation: operation
        });
    };

    /**
     * Get a speaker verification profile by verificationProfileId
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.verificationProfileGetProfile = function verificationProfileGetProfile(_ref14) {
        var parameters = _ref14.parameters;


        var operation = {
            "path": "spid/v1.0/verificationProfiles/{verificationProfileId}",
            "method": "GET",
            "operationId": "56409ee2778daf19706420de",
            "parameters": [{
                "name": "verificationProfileId",
                "description": "ID of speaker verification profile. It should be a GUID.",
                "value": "",
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters
        });
    };

    /**
     * Deletes all enrollments associated with the given speaker’s verification profile permanently from the service.
     * @returns {Promise.<object>}
     */
    speakerRecognition.prototype.verificationProfileResetEnrollments = function verificationProfileResetEnrollments(_ref15) {
        var parameters = _ref15.parameters;


        var operation = {
            "path": "spid/v1.0/verificationProfiles/{verificationProfileId}/reset",
            "method": "POST",
            "operationId": "56406930e597ed20c8d8549b",
            "parameters": [{
                "name": "verificationProfileId",
                "description": "ID of speaker verification profile. It should be a GUID.",
                "value": "",
                "required": true,
                "type": "routeParam",
                "typeName": "string"
            }]
        };

        return this.makeRequest({
            operation: operation,
            parameters: parameters
        });
    };

    return speakerRecognition;
}(commonService);

module.exports = speakerRecognition;