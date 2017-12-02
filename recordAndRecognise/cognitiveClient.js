const cognitive = require('./dist/index.js');
const config = require('./config.js');
const voiceIDMap = require('../voiceIDMap.js')();
const fs = require('fs');
const should = require('should');
const jsonfile = require('jsonfile');

global._storage = global._storage || {};

const client = new cognitive.speakerRecognition({
    "apiKey": config.speakerRecognition.apiKey,
    "endpoint": config.speakerRecognition.endpoint
});

var verificationProfileGetAllProfilesImpl= function(){
    const parameters = {};
    const headers = {};

    client.verificationProfileGetAllProfiles({
        "parameters": parameters,
        "headers": headers
    }).then((response) => {
        console.log(response);
        return response;
    }).catch((err) => {
        console.log(err);
    });
}

var listAllSupportedVerificationPhrasesImpl= function(){
    const parameters = {"locale": "en-US"}

    client.listAllSupportedVerificationPhrases({
        "parameters": parameters
    }).then((response) => {
        console.log(response);
    }).catch((err) => {
        console.log(err);
    });
}
//listAllSupportedVerificationPhrasesImpl();  // 'my voice is stronger than passwords'

//create profile
//For now, since testing with one user, used only once to create profile: '56478077-762b-4c39-9c77-814ef6216218'
var verificationProfileCreateProfileImpl= function(){
    const body = {"locale": "en-US"};
    const parameters = {};
    const headers = {};
    client.verificationProfileCreateProfile({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        console.log(response);
    }).catch((err) => {
        console.log(err);
    });
}
//verificationProfileCreateProfileImpl(); 

var verificationProfileCreateEnrollmentImpl= function(){
    const body = fs.readFileSync('./uploads/myVoiceIsStrongerThanPasswords.wav');
    const parameters = {
        "verificationProfileId": "56478077-762b-4c39-9c77-814ef6216218"
    };
    const headers = {
        'Content-Type': "audio/wav; codec=audio/pcm; samplerate=16000;"
    }
    client.verificationProfileCreateEnrollment({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        console.log(response);
    }).catch((err) => {
        console.log(err);
    });
}

//verificationProfileCreateEnrollmentImpl();


var speakerRecognitionVerificationImpl= function(){
    const body = fs.readFileSync('./uploads/myVoiceIsStrongerThanPasswords.wav');
    const parameters = {
        "verificationProfileId": "56478077-762b-4c39-9c77-814ef6216218"
    };
    const headers = {
        'Content-Type': "audio/wav; codec=audio/pcm; samplerate=16000;"
    }
    client.speakerRecognitionVerification({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        console.log(response);
    }).catch((err) => {
        console.log(err);
    });
}


//
//
// IDENTIFICATION START
//
//

var identificationProfileCreateProfileImpl= function(){
    const body = {"locale": "en-US"};
    const parameters = {};
    const headers = {};
    client.identificationProfileCreateProfile({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        console.log(response);
    }).catch((err) => {
        console.log(err);
    });
}

var identificationProfileCreateEnrollmentImpl= function(identificationProfileId, audioFile){
    const body = fs.readFileSync('./uploads/'+audioFile);
    const parameters = {
        "identificationProfileId": identificationProfileId
    };
    const headers = {
        'Content-Type': "audio/wav; codec=audio/pcm; samplerate=16000;"
    }
    client.identificationProfileCreateEnrollment({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        console.log(response);
    }).catch((err) => {
        console.log(err);
    });
}

var identificationProfileCreateSaveEnrollment= function(identificationProfileId, audioFile){
    const body = fs.readFileSync('./recordAndRecognise/uploads/'+audioFile);
    const parameters = {
        "identificationProfileId": identificationProfileId,
        "shortAudio": false
    };
    const headers = {
        'Content-Type': "audio/wav; codec=audio/pcm; samplerate=16000;"
    }
    client.identificationProfileCreateEnrollment({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        setTimeout(function(){
            console.log(response);
            var urlParts= response.toString().split('/');
            var operationId= urlParts[urlParts.length-1];
            console.log("operationId="+operationId);
            speakerRecognitionGetStatusImpl(operationId,"register",identificationProfileId);
        },4000);
    }).catch((err) => {
        console.log(err);
    });
}

var speakerRecognitionGetStatusImpl= function(operationId, action, identificationProfileId){
    const parameters = {
        "operationId" : operationId
    }
    client.speakerRecognitionGetStatus({
        parameters: parameters
    }).then((response) => {
        console.log(response);
        if(action){
            if(response.status === "succeeded" && response.processingResult &&
                response.processingResult.enrollmentStatus === "Enrolled"){
                // add beneficiary in the map with newUser
                // name and other details would be updated later when available from app.js
                voiceIDMap.addNewBeneficiary(identificationProfileId, "newUser", "newUser", true);
                console.log("enrolled!");
            }
        }else{
            //global._storage.recoStatus = response.status;
            if(response.status==="succeeded" && response.processingResult){
                if(response.processingResult.identifiedProfileId === '00000000-0000-0000-0000-000000000000'){
                    setIdentifiedBeneficiary("unknown");
                }else{
                    setIdentifiedBeneficiary(voiceIDMap.getBeneficiary(response.processingResult.identifiedProfileId));
                }

            }else if(response.status==="failed" && response.message ==='SpeakerInvalid'){
                setIdentifiedBeneficiary("unknown");
            }
        }
    }).catch((err) => {
        console.log(err);
    });
}

var setIdentifiedBeneficiary = function(value){
    jsonfile.writeFileSync('./identifiedBeneficiaries.json', {"beneficiary":value});
}

var getIdentifiedBeneficiary = function(){
    var beneficiaryFile= jsonfile.readFileSync('./identifiedBeneficiaries.json');
    if(beneficiaryFile && beneficiaryFile.beneficiary){
        return beneficiaryFile.beneficiary;
    }
    return null;
}

//this has to handle multiple concurrent updates later
var updateNewBeneficiary = function(name, customerID){
    return voiceIDMap.updateNewBeneficiary(name, customerID);
}

var speakerRecognitionIdentificationImpl = function(fileName){
    const body = fs.readFileSync('./uploads/'+fileName);
    const parameters = {
        "identificationProfileIds": "46e49a50-873b-4982-896a-2b86fc5970c8,332127b5-14da-43a2-bf43-443181a1ced9",
        "shortAudio" : true
    };
    const headers = {
        'Content-Type': "audio/wav; codec=audio/pcm; samplerate=16000;"
    }
    client.speakerRecognitionIdentification({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        console.log(response);
        var urlParts= response.toString().split('/');
        console.log(urlParts[urlParts.length-1]);
    }).catch((err) => {
        console.log(err);
    });
}

var completeRegistration = function(fileName){
    if(!fileName){
        return;
    }
    const body = {"locale": "en-US"};
    const parameters = {};
    const headers = {};
    client.identificationProfileCreateProfile({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        console.log(response);
        identificationProfileCreateSaveEnrollment(response.identificationProfileId,fileName);
    }).catch((err) => {
        console.log(err);
    }); 
}

var completeIdentification = function(fileName){
    if(!fileName){
        return;
    }
    const body = fs.readFileSync('./recordAndRecognise/uploads/'+fileName); ///recordAndRecognise/

    const parameters = {
        "identificationProfileIds": voiceIDMap.getAllVoiceIds().join(","),
        "shortAudio" : true
    };
    console.log("profiles sent: "+parameters.identificationProfileIds);
    const headers = {
        'Content-Type': "audio/wav; codec=audio/pcm; samplerate=16000;"
    }
    client.speakerRecognitionIdentification({
        headers: headers,
        body: body,
        parameters: parameters
    }).then((response) => {
        setTimeout(function(){
            console.log(response);
            var urlParts= response.toString().split('/');
            var operationId= urlParts[urlParts.length-1];
            console.log("operationId="+operationId);
            speakerRecognitionGetStatusImpl(operationId);
        },2000);
    }).catch((err) => {
        console.log(err);
    });
}

var getGlobalStorage = function(){
    return global._storage;
}

module.exports= {
        verificationProfileGetAllProfilesImpl: verificationProfileGetAllProfilesImpl,
        listAllSupportedVerificationPhrasesImpl: listAllSupportedVerificationPhrasesImpl,
        verificationProfileCreateProfileImpl: verificationProfileCreateProfileImpl,
        verificationProfileCreateEnrollmentImpl: verificationProfileCreateEnrollmentImpl,
        speakerRecognitionVerificationImpl: speakerRecognitionVerificationImpl,
        speakerRecognitionGetStatusImpl: speakerRecognitionGetStatusImpl,
        identificationProfileCreateProfileImpl: identificationProfileCreateProfileImpl,
        identificationProfileCreateEnrollmentImpl: identificationProfileCreateEnrollmentImpl,
        speakerRecognitionIdentificationImpl: speakerRecognitionIdentificationImpl,
        completeIdentification: completeIdentification,
        getGlobalStorage: getGlobalStorage,
        getIdentifiedBeneficiary: getIdentifiedBeneficiary,
        setIdentifiedBeneficiary: setIdentifiedBeneficiary,
        identificationProfileCreateSaveEnrollment: identificationProfileCreateSaveEnrollment,
        updateNewBeneficiary: updateNewBeneficiary,
        completeRegistration: completeRegistration
    };
