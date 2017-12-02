const jsonfile = require('jsonfile');
module.exports= function(){
	//var voiceIds=["dbbc4433-b6c0-4920-8b11-cd323970b3e7","9bf9120f-fefe-4db3-a9ed-552d14d7f139","7bda13bc-ac4b-401a-bc4e-24c26fd0c828"];
	var voiceIds=["6e08daee-db1f-429d-bada-e85821653f66","def9df34-2176-4022-98fb-74989bcfeacd","7bda13bc-ac4b-401a-bc4e-24c26fd0c828"];

	/*var beneficiaryVoiceMap = {
		"6e08daee-db1f-429d-bada-e85821653f66" : "ayush",
		"def9df34-2176-4022-98fb-74989bcfeacd" : "ravneet",
		"7bda13bc-ac4b-401a-bc4e-24c26fd0c828" : "amarjot"
	};*/

	var addNewBeneficiary = function(voiceId, name, custId, isUpdate){
		var registeredBeneficiaryFile= jsonfile.readFileSync('./registeredBeneficiaries.json');
		registeredBeneficiaryFile.beneficiaryAccountMap[voiceId]={};
		registeredBeneficiaryFile.beneficiaryAccountMap[voiceId]["name"]= name;
		registeredBeneficiaryFile.beneficiaryAccountMap[voiceId]["customerID"]= custId;
		jsonfile.writeFileSync('./registeredBeneficiaries.json',
			registeredBeneficiaryFile, 
			{spaces: 2, EOL: '\r\n'}
		);
		console.log("added: "+newObject.toString());
	}

	//update name and customer ID once it is received from the user
	var updateNewBeneficiary = function(name, customerID){
		var registeredBeneficiaryFile= jsonfile.readFileSync('./registeredBeneficiaries.json');
		if(registeredBeneficiaryFile && registeredBeneficiaryFile.beneficiaryAccountMap){
			var voiceIds = Object.keys(registeredBeneficiaryFile.beneficiaryAccountMap);
			var len= voiceIds.length;
			if(len>0 && voiceIds[len-1]){
				var toUpdate= registeredBeneficiaryFile.beneficiaryAccountMap[voiceIds[len-1]];
				toUpdate["name"] = name;
				toUpdate["customerID"] = customerID;
			}
			console.log("trying to update: this is the new file content: "+registeredBeneficiaryFile.toString());
			jsonfile.writeFileSync('./registeredBeneficiaries.json',
				registeredBeneficiaryFile, 
				{spaces: 2, EOL: '\r\n'}
			);
			return true;
		}
		return false;
	}

	function getAllVoiceIds(){
		var registeredBeneficiaryFile= jsonfile.readFileSync('./registeredBeneficiaries.json');
		if(registeredBeneficiaryFile && registeredBeneficiaryFile.beneficiaryAccountMap){
			console.log("Getting all voice IDs from : "+registeredBeneficiaryFile.beneficiaryAccountMap);
			return Object.keys(registeredBeneficiaryFile.beneficiaryAccountMap) || [];
		}
		return [];
	}

	/*function addBeneficiary(voiceId, username){
		if(beneficiaryVoiceMap.hasOwnProperty(username)){
			console.log("beneficiary already present");
			return false;
		}
		beneficiaryVoiceMap[voiceId] = username;
		return true;
	}*/

	function getBeneficiary(voiceId){
		var registeredBeneficiaryFile= jsonfile.readFileSync('./registeredBeneficiaries.json');
		if(registeredBeneficiaryFile && registeredBeneficiaryFile.beneficiaryAccountMap){
			var benObj = registeredBeneficiaryFile.beneficiaryAccountMap[voiceId];
			return benObj.name || "unknown"
		}
		return "unknown";
	}

	return {
		getAllVoiceIds: getAllVoiceIds,
		getBeneficiary: getBeneficiary,
		updateNewBeneficiary: updateNewBeneficiary,
		addNewBeneficiary: addNewBeneficiary
	};
}