var restify = require('restify');
var builder = require('botbuilder');
var bankService = require('./bankService.js');
var cognitiveClient = require('./recordAndRecognise/cognitiveClient.js');
var voiceIDMap = require('./voiceIDMap');
var opn = require('opn');
require('dotenv-extended').load();
const http = require('http');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.say("Welcome to voice pay! How may I help you today?","Welcome to voice pay! How may I help you today?");
    session.recorderDelay = 5;
    session.replaceDialog('StartRecorder');
});

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable (process.env.LUIS_MODEL_URL)
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

/**
 * CallAPI
 * Generic Intent, called by all other intents
 * to do identification, then calls the parent intent (stored in the session) back
 */
bot.dialog('CallAPI',[
    function(session, args, next){
        //console.log("app js: " + cognitiveClient.getGlobalStorage().recoStatus);
        //!session.callAgain && cognitiveClient.speakerRecognitionGetStatusImpl("d9bbc678-82ff-4e69-9938-df72725e98d8");
        var text;
        console.log(session.previousDialog);
        if(session.callAgain){
            text= 'It is taking longer than expected. Shall I continue?';
        }else{
            if(session.previousDialog =="BillPay"){
                text= 'Sure. Let me first confirm that it\'s you. Should I go ahead?'
            }else if(session.previousDialog=="TransactionHistory"){
                text= 'Let me first see if it\'s you. Shall I continue?'
            }else{
                text= 'I will now try to identify you. Shall I continue?'
            }
        }
        session.userData.previousDialog= session.previousDialog;
        builder.Prompts.text(session,text,{
            speak : '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><break time="5000ms" />'+text+'</speak>',
            retrySpeak: 'It is taking longer than expected. Shall I continue?', 
            inputHint : builder.InputHint.expectingInput
        });  
    },
    function(session,results){
        var userInput = results.response;
        session.previousDialog= session.userData.previousDialog;
        console.log(userInput);
        if(/(yes|yeah|ya|yep|yea|sure)/i.test(userInput)){
            var APIOutput= cognitiveClient.getIdentifiedBeneficiary();
            console.log("beneficiary = "+APIOutput);
            if(APIOutput==="unknown"){
                //session.endDialog();
                session.replaceDialog('UnregisteredUser');
            }else if(typeof(APIOutput)==="string"){
                console.log(session.previousDialog);
                var greet= session.previousDialog =="BillPay" ? "OK " : "Hello ";
                session.say(greet+APIOutput+"!",greet+APIOutput+"!");
                session.APIComplete= true;
                session.identified= APIOutput;
                console.log("Going back to "+session.previousDialog);
                session.replaceDialog(session.previousDialog); //'TransferMoney' or 'BillPay'
            }else{
                //repeat dialog
                session.callAgain=true;
                session.replaceDialog('CallAPI');
            }
        }else{ 
            session.say("You cannot proceed without identification. I will now exit. Have a good day!",
            "You cannot proceed without identification. I will now exit. Have a good day!");
            session.endDialog("You cannot proceed")
        }
    }
]);

/**
 * CallBankBillPayAPI
 * Initiates the credit card bill payment
 */
bot.dialog('CallBankBillPayAPI', [
    function(session, args, next){
        var billDetails= bankService.getScheduledPaymentDetails();
        session.userData.billAmount= billDetails.amount;
        var message = 'Initiating the transfer of '+billDetails.amount+ ' Dollars for '+billDetails.biller+'. Shall I proceed?';
        var readMessage =  '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><break time="3000ms" />'+message+'</speak>';
        console.log("initiating bill transfer: "+billDetails.amount+" : "+billDetails.biller);
        bankService.billPaymentByBillerName("JC Penny",null,billDetails.amount);
        //check if this needs to be pushed to a new dialog
        builder.Prompts.text(session,message,{
            speak : readMessage,
            retrySpeak: message, 
            inputHint : builder.InputHint.expectingInput
        });
        // Call billPaymentByBillerName instead to find billerId first
        //bankService.makeBillPayment(null,null,billDetails.amount);
    },
    function(session, args, next){
        var serReqNumber= bankService.getBankOutput("billInvoice");
        var newDetails= bankService.getBankOutput("accountDetails");
        if(newDetails && newDetails.Available_Balance){
            newDetails.Available_Balance = (parseFloat(newDetails.Available_Balance)- session.userData.billAmount)+"";
            bankService.setBankOutput("accountDetails", newDetails);
            console.log("its deducting the bill amount"+ newDetails.Available_Balance);
        }
        if(!serReqNumber){
            console.log("Bill payment failed");
        }
        session.say("Your balance is now " + newDetails.Available_Balance+ " Dollars. Is there anything else you want me to do?",
                "Your balance is now " + newDetails.Available_Balance+ " Dollars. Is there anything else you want me to do?");
        session.endDialog();
        session.recorderDelay=6;
        session.replaceDialog('StartRecorder');
    }
]);

/**
 * CallBankTransferAPI: TODO: Change the name: it is now RetailPaymentAPI
 * Initiates the transfer between customer and the retailer
 */
bot.dialog('CallBankTransferAPI',[
    function(session, args, next){
        var amount= session.amount || session.userData.amount.entity;
        var receiver= session.receiver || session.userData.receiver.entity;
        if(!session.calledAlready && !bankService.getBankOutput("accountDetails")){
            bankService.customerToCustomerTransaction(null,null,amount);
        }
        bankService.saveTransactionHistory(receiver, amount);
        var text= "Let's Confirm. You'd like to send "+receiver+" "+ (session.postalCode?"located at TX "+session.postalCode+" ":"")+
        amount+" Dollars, right?";
        builder.Prompts.text(session,text,{
            speak : '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><break time="2000ms" />'+text+'</speak>',
            retrySpeak: text, 
            inputHint : builder.InputHint.expectingInput
        });  
        session.userData.amount= amount;
        session.userData.receiver= receiver;
    },
    function(session,results){
        var userInput = results.response;
        if(/(yes|yeah|ya|yep|yea|sure)/i.test(userInput)){
            if(APIResult.trasnferStatus==="success" ){
                session.say("OK. Done. Cheers!","OK, Done. Cheers!");
                var newDetails= bankService.getBankOutput("accountDetails");
                var text="";
                if(newDetails && newDetails.Available_Balance){
                    newDetails.Available_Balance = (parseFloat(newDetails.Available_Balance)- parseFloat(session.userData.amount))+"";
                    bankService.setBankOutput("accountDetails", newDetails);
                    text+="Your current balance after deducting "+session.userData.amount+ " Dollars is now "+newDetails.Available_Balance+" Dollars.";
                }
                session.say(text,text);
            }else{
                //repeat dialog
                session.calledAlready=true;
                session.endDialog("Uh oh! There was a problem during the transfer. Please try again.");
            }
        }else{ 
            session.endDialog("There was a problem. Please restart.")
        }
    }
]);

/**
 * MoreUpdates
 * This intent pushes important 'smart' updates/notifications to the user
 * who has called the call center
 * Currently, it goes through the scheduledPayments, finds the one with due date in 2 days
 * And suggests to schedule it. Customer has an option to pay the bill now.
 */
bot.dialog('MoreUpdates',[
    function(session, args, next){
        var text= "I have an update for you. If you don't have anything else for me, would you like to hear it now?";
        builder.Prompts.text(session,"Update available!",{
            speak : text,
            retrySpeak: 'Do you want to hear the update available?', 
            inputHint : builder.InputHint.expectingInput
        });
    },
    function(session, response){
        if(/(yes|yeah|ya|yep|yea|sure)/i.test(response.response)){
            var scheduledPaymentDetails = bankService.getScheduledPaymentDetails();
            var text= "Your "+scheduledPaymentDetails.biller+" bill, amounting to "+scheduledPaymentDetails.amount+
                " is due in 2 days. Would you like me to schedule the bill payment?";
            session.say(text, text);
            //the user's response will now invoke the bill payment intent
            session.recorderDelay= 8;
            session.replaceDialog('StartRecorder'); 
        }else{
            session.replaceDialog('MoreUpdates');
        }
    }
]);

/**
 * CCLimit
 * Tells the credi limit of a customer credit card
 * Needs Bank service to give CC details given card retailer name, like Amazon CC
 */
bot.dialog('CCLimit',[
    function(session, args, next){
        if(!session.APIComplete){
            // try extracting entities
            session.userData.receiver = builder.EntityRecognizer.findEntity(args.intent.entities, 'biller');
            session.receiver= session.userData.receiver;
            session.previousDialog= 'CCLimit';
            session.apiName= "identify";  // identify, createProfile, enroll, verify, getOperationStatus
            session.replaceDialog('CallAPI');
        }else{
            if(!session.userData.receiver || !session.userData.receiver.entity){
                builder.Prompts.text(session,'I did not catch the retailer credit card name. Can you please repeat the name of the retailer?',{
                    speak : 'I did not catch the retailer credit card name. Can you please repeat the name of the retailer?',
                    retrySpeak: 'Can you please repeat the name of the retailer?', 
                    inputHint : builder.InputHint.expectingInput
                });
            }else{
                next();
            }
        }
    },
    function(session, args, next){
        session.receiver= (session.receiver &&  session.receiver.entity) || 
        (session.userData.receiver && session.userData.receiver.entity);
        session.replaceDialog("CallCCLimitAPI");
    }
]).triggerAction({
    matches: 'CCLimit',
    onInterrupted: function (session) {
        session.say('Sorry, could not register. Please try again!','Sorry, could not register. Please try again!');
    }
});

/**
 * CallCCLimitAPI
 * internally used by CCLimit to get CC details (here credit limit)
 * given the card retailer name
 */
bot.dialog('CallCCLimitAPI',[
    function(session, args, next){
        // Hit Card Limit API: not exposed: so mocking
        session.say("Your limit for "+session.receiver+" Credit Card is USD 1000","Your limit for "+session.receiver+" Credit Card is 1000 dollars");
        session.replaceDialog('MoreUpdates');
    }
]);

/**
 * UnregisteredUser
 * invoked if an unregistered user is found
 * Initiates the registration, if needed
 */
bot.dialog('UnregisteredUser',[
    function(session, args, next){
        builder.Prompts.text(session,'I see you are not registered. Do you want to register to Voice Pay?',{
            speak : 'I see you are not registered. Do you want to register to Voice Pay?',
            retrySpeak: 'Do you want to register to Voice Pay?', 
            inputHint : builder.InputHint.expectingInput
        });
    },
    function(session,response,next){
        if(/(yes|yeah|ya|yep|yea|sure)/i.test(response.response)){
            session.replaceDialog("Register");
        }else{ 
            session.endDialog("Ok! See you soon. Bye!")
        }
    }
])

/**
 * Register
 * Intent invoked to start the complete registration process
 */
bot.dialog('Register',[
	function(session, args, next){
        opn('https://f55c0a33.ngrok.io/recorder?apiName=register');
        //opn('https://4e7a0fe2.ngrok.io/recorder?apiName=register');
        builder.Prompts.text(session,'Ok. To register, please say this sentence: "My voice is stronger than passwords."',{
            speak : 'Ok. To register, please say this sentence: "My voice is stronger than passwords."',
            retrySpeak: 'Please say this sentence: "My voice is stronger than passwords."', 
            inputHint : builder.InputHint.expectingInput
        });
	},function(session, args, next){
        builder.Prompts.text(session,'Thanks! Voice Sample received. Please tell your bank user name.',{
            speak : 'Thanks! Voice Sample received. Please tell your bank user name.',
            retrySpeak: 'Please tell your bank account name.', 
            inputHint : builder.InputHint.expectingInput
        });
	},function(session, args, next){
		session.userData.beneficiaryName= args.response;
		builder.Prompts.text(session,'Thanks'+args.response+'! May I know your customer ID please?',{
            speak : 'Thanks '+args.response+'! May I know your customer ID please?',
            retrySpeak: 'May I know your customer ID please?', 
            inputHint : builder.InputHint.expectingInput
        });
    },function(session,args){
        //we might have to loop
        session.userData.custID= args.response;
        var updated= cognitiveClient.updateNewBeneficiary(session.userData.beneficiaryName, session.userData.custID);
        var text= "Congratulations "+session.userData.beneficiaryName +"! You are now registered with Voice Pay. What would you like to do?";
        if(!updated){
            text= "Sorry "+session.userData.beneficiaryName+"! Something went wrong, Please start again.";
        }
        session.say(text,text);
        session.endDialog();
    }
	]).triggerAction({
    matches: 'Register',
    onInterrupted: function (session) {
        session.say('Sorry, could not register. Please try again!','Sorry, could not register. Please try again!');
    }
});

bot.dialog('StartRecorder',[
    function(session){
        opn('https://f55c0a33.ngrok.io/recorder');
    }
]);

/**
 * TransferMoney
 * ##DEPRECATED
 * This intent was meant to do peer to peer transactions
 * Call RetailPay instead for customer to retailer transaction
 */
bot.dialog('TransferMoney', [
    function(session, args, next){
        if(!session.APIComplete){
            // try extracting entities
            session.userData.receiver = builder.EntityRecognizer.findEntity(args.intent.entities, 'Reciever');
            session.userData.amount = builder.EntityRecognizer.findEntity(args.intent.entities, 'amount');
            session.userData.currency = builder.EntityRecognizer.findEntity(args.intent.entities, 'currency');
            //use price if there is an error detecting amount/currency
            session.userData.price = builder.EntityRecognizer.findEntity(args.intent.entities, 'price');
            
            session.previousDialog= 'TransferMoney';
            session.apiName= "identify";  // identify, createProfile, enroll, verify, getOperationStatus
            session.replaceDialog('CallAPI');
        }else{
            if(!session.userData.receiver || !session.userData.receiver.entity){
                builder.Prompts.text(session,'I did not catch the receiver. Can you please repeat the receiver?',{
                    speak : 'I did not catch the receiver. Can you please repeat the receiver?',
                    retrySpeak: 'I did not catch the receiver. Can you please repeat the receiver?', 
                    inputHint : builder.InputHint.expectingInput
                });
            }else{
                next();
            }
        }
    },
    function(session, args, next){
        if(!session.userData.receiver){
            session.userData.receiver = {},
            session.userData.receiver.entity = args.response;
        }
        if(!session.userData.amount || !session.userData.amount){
            builder.Prompts.text(session,"I could not get the amount. I am currently trained to handle only amounts less than 100. How much should I transfer?",{
                speak : "I could not get the amount. I am currently trained to handle only amounts less than 100. How much should I transfer?",
                retrySpeak: 'How much should I transfer?', 
                inputHint : builder.InputHint.expectingInput
            });
        }else{
            next();
        }
    },
    function (session, args, next) {
        if(!session.userData.amount){
            session.userData.amount = {},
            session.userData.amount.entity = args.response;
        }
        var entities= {
            receiver: session.userData.receiver || "",
            amount: session.userData.amount,
            currency: session.userData.currency,
            price: session.userData.price
        };
        console.log("entities: "+JSON.stringify(entities));
        //console.log(session);
        // try extracting entities
        var receiver = entities.receiver; //builder.EntityRecognizer.findEntity(args.intent.entities, 'Reciever');
        var amount = entities.amount; //builder.EntityRecognizer.findEntity(args.intent.entities, 'amount');
        var currency = entities.currency; //builder.EntityRecognizer.findEntity(args.intent.entities, 'currency');
        //use price if there is an error detecting amount/currency
        var price = entities.price; //builder.EntityRecognizer.findEntity(args.intent.entities, 'price');

        if(!receiver || (!amount && !price)){
        	// no entities detected, ask user for a destination
            session.say("Sorry, I couldn't recognise some parts. Please say again..", "Sorry, I am still learning. What do you want to do again?");
            session.endDialog();
        }

        //if price exists but amount doesn't, we can extract the amount from the price
        if(!amount && price){
        	amount= {"entity":parseInt(price.entity.replace(/[^0-9\.]/g, ''), 10)};
        }
        //for now currency doesn't matter
        //session.dialogData.searchType = 'P2P';
        next({
        	response: {
        		"receiver":receiver.entity,
        		"price": {
        			"amount":amount.entity
        		}
        	} 
        });
    },
    function(session, results, next){
        session.userData.receiver= results.response.receiver.entity;
        session.userData.amount= results.response.price.amount;
        builder.Prompts.text(session,"Can you provide me the postal code for "+session.userData.receiver+ " please?",{
            speak : "Can you provide me the postal code for "+session.userData.receiver+" please?",
            retrySpeak: 'Please provide postal code', 
            inputHint : builder.InputHint.expectingInput
        });
    },
    function (session, results) {
        session.postalCode = results.response;
        session.replaceDialog("CallBankTransferAPI");
    }
]).triggerAction({
    matches: 'TransferMoney',
    onInterrupted: function (session) {
        session.say('Could not extract the amount and the receiver', 'Could not extract the amount and the receiver');
    }
});

/**
 * BillPay
 * initiates billPayment
 * Actual Bank API is called in CallBankBillPayAPI
 */
bot.dialog('BillPay',[
	function(session, args, next){
        if(!session.APIComplete){
            // try extracting biller entity
            session.userData.biller = builder.EntityRecognizer.findEntity(args.intent.entities, 'biller');
            console.log("biller="+(session.userData.biller || session.biller));
            session.previousDialog= 'BillPay';
            session.apiName= "identify";  // identify, createProfile, enroll, verify, getOperationStatus
            session.replaceDialog('CallAPI');
        }else{
            if(!session.userData.biller && !session.biller){
                //This is just used to mock, should be replaced by the prompt later
                session.userData.biller="JC Penny";
                session.biller= "JC Penny";
                /*builder.Prompts.text(session,"Shall I continue?",{
                    speak : 'I did not catch the biller name. Can you please repeat the biller?',
                    retrySpeak: 'I did not catch the receiver. Can you please repeat the biller?', 
                    inputHint : builder.InputHint.expectingInput
                });*/
                next();
            }else{
                next();
            }
        }
	},
    function (session, response) {
        session.biller = session.userData.biller || session.biller || response;
        
        session.replaceDialog("CallBankBillPayAPI");
    }
	]).triggerAction({
    matches: 'BillPay',
    onInterrupted: function (session) {
        session.say('Sorry, something went wrong. Please try again!');
    }
});

/**
 * TransactionHistory
 * Shows the history of transactions made on a Credit Card
 * Needs retailer credit card name
 * prompts for the name if it doesn't get it in first attempt
 */
bot.dialog('TransactionHistory',[
	function(session, args, next){
        console.log("transaction history start: api complete:"+session.APIComplete);
        if(!session.APIComplete){
            console.log(JSON.stringify(args.intent.entities));
            var thReceiver = builder.EntityRecognizer.findEntity(args.intent.entities, 'Reciever');
            var thStartDate = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.datetimeV2.daterange');
            console.log("Transaction history: receiver="+session.userData.thReceiver+", duration="+session.userData.thStartDate);
            if(thReceiver && thReceiver.entity){
                session.userData.thReceiver= thReceiver.entity;
            }
            if(thStartDate && thStartDate.resolution && 
                    thStartDate.resolution.values && thStartDate.resolution.values[0] && thStartDate.resolution.values[0].start){
                session.userData.thStartDate= thStartDate.resolution.values[0].start;
            }
            session.userData.thStartDate && bankService.getTransc4Account(null,null,session.userData.thStartDate.split("-").join(""));
            session.previousDialog= 'TransactionHistory';
            session.apiName= "identify";  // identify, createProfile, enroll, verify, getOperationStatus
            session.replaceDialog('CallAPI');
        }else{
            if(!session.userData.thReceiver){
                console.log("receiver not found");
                builder.Prompts.text(session,"Shall I continue?", {
                    speak : 'Sorry, I did not get the receiver. Can you please say the receiver again?',
                    retrySpeak: 'Sorry, I did not get the receiver. Can you please say the receiver again?', 
                    inputHint : builder.InputHint.expectingInput
                });
            }
            next();
        }
    },
    function(session, args, next){
        var receiver= session.userData.thReceiver || args.response;
        console.log("back to txn history");
        if(!receiver || !session.userData.thStartDate){
            session.say("There was a problem. Please try again.","There was a problem. Please try again.");
            session.endDialog();
        }
        //var total= bankService.getTransactionsForReceiver(receiver, bankService.getBankOutput("allTransactions"));
        var txn= bankService.getTransactionHistory(receiver, session.identified) || {total:0};
        console.log("txn history:" +txn);
        var speak='';
        if(txn.total==0){
            speak+='For you '+(session.identified||'')+', nothing showed up.';
        }else if(txn.isToday){
            speak+='Apart from '+ txn.txnCount +' transaction'+((txn.txnCount>1)?'s':'')+' of '+txn.total+' Dollars, done today nothing else showed up.';
        }else if(txn.total>0){
            speak+='A total of '+txn.total+' Dollars was transferred.';
        }
        session.say(speak,speak);
        session.endDialog();
        session.recorderDelay = 5;
        session.replaceDialog('StartRecorder');
    }
]).triggerAction({
    matches: 'TransactionHistory',
    onInterrupted: function (session) {
        session.say('Sorry, something went wrong. Please try again!');
    }
});

/**
 * RetailPay
 * Similar to TransferMoney, the difference is that here
 * transaction occurs between customer and retailer
 * TODO: find a way to send location coordicates of the client to the bot
 * to accurately determine the merchantID based on location
 * currently, the bot prompts the user to say the postal code of his location
 * an obsvious assumption it makes is that each postal code has one unique retailer outlet
 * which might not be the case
 */
bot.dialog('RetailPay',[
	function(session, args, next){
        if(!session.APIComplete){
            // try extracting entities
            session.userData.receiver = builder.EntityRecognizer.findEntity(args.intent.entities, 'Reciever');
            session.userData.amount = builder.EntityRecognizer.findEntity(args.intent.entities, 'amount');
            session.userData.currency = builder.EntityRecognizer.findEntity(args.intent.entities, 'currency');
            //use price if there is an error detecting amount/currency
            session.userData.price = builder.EntityRecognizer.findEntity(args.intent.entities, 'price');
            
            session.previousDialog= 'RetailPay';
            session.apiName= "identify";  // identify, createProfile, enroll, verify, getOperationStatus
            session.replaceDialog('CallAPI');
        }else{
            if(!session.userData.receiver || !session.userData.receiver.entity){
                builder.Prompts.text(session,'I did not catch the receiver. Can you please repeat the receiver?',{
                    speak : 'I did not catch the receiver. Can you please repeat the receiver?',
                    retrySpeak: 'I did not catch the receiver. Can you please repeat the receiver?', 
                    inputHint : builder.InputHint.expectingInput
                });
            }else{
                next();
            }
        }
    },
    function(session, args, next){
        if(!session.userData.receiver){
            session.userData.receiver = {},
            session.userData.receiver.entity = args.response;
        }
        if(!session.userData.amount || !session.userData.amount){
            builder.Prompts.text(session,"I could not get the amount. I am currently trained to handle only amounts less than 100. How much should I transfer?",{
                speak : "I could not get the amount. I am currently trained to handle only amounts less than 100. How much should I transfer?",
                retrySpeak: 'How much should I transfer?', 
                inputHint : builder.InputHint.expectingInput
            });
        }else{
            next();
        }
    },
    function (session, args, next) {
        if(!session.userData.amount){
            session.userData.amount = {},
            session.userData.amount.entity = args.response;
        }
        var entities= {
            receiver: session.userData.receiver || "",
            amount: session.userData.amount,
            currency: session.userData.currency,
            price: session.userData.price
        };
        console.log("entities: "+JSON.stringify(entities));
        //console.log(session);
        // try extracting entities
        var receiver = entities.receiver; //builder.EntityRecognizer.findEntity(args.intent.entities, 'Reciever');
        var amount = entities.amount; //builder.EntityRecognizer.findEntity(args.intent.entities, 'amount');
        var currency = entities.currency; //builder.EntityRecognizer.findEntity(args.intent.entities, 'currency');
        //use price if there is an error detecting amount/currency
        var price = entities.price; //builder.EntityRecognizer.findEntity(args.intent.entities, 'price');

        if(!receiver || (!amount && !price)){
        	// no entities detected, ask user for a destination
            session.say("Sorry, I couldn't recognise some parts. Please say again..", "Sorry, I am still learning. What do you want to do again?");
            session.endDialog();
        }

        //if price exists but amount doesn't, we can extract the amount from the price
        if(!amount && price){
        	amount= {"entity":parseInt(price.entity.replace(/[^0-9\.]/g, ''), 10)};
        }
        //for now currency doesn't matter
        //session.dialogData.searchType = 'P2P';
        next({
        	response: {
        		"receiver":receiver.entity,
        		"price": {
        			"amount":amount.entity
        		}
        	} 
        });
    },
    function(session, results, next){
        session.userData.receiver= results.response.receiver;
        session.userData.amount= results.response.price.amount;
        builder.Prompts.text(session,"Can you provide me the postal code please?",{
            speak : "Can you provide me the postal code please?",
            retrySpeak: 'Please provide postal code', 
            inputHint : builder.InputHint.expectingInput
        });
    },
    function (session, results) {
        var postalCode = results.response;
        session.receiver=  session.userData.receiver;
        session.amount= session.userData.amount;
        //var message = 'Initiating the transfer of '+transactionParams.price.amount+ 'Dollars to '+transactionParams.receiver;
        //session.say(message, message);
        session.replaceDialog("CallBankTransferAPI");
    }
]).triggerAction({
    matches: 'RetailPay',
    onInterrupted: function (session) {
        session.say('Sorry, something went wrong. Please try again!');
    }
});

/**
 * Help
 * Intent to give all possible actions that can be performed by the skill
 */
bot.dialog('Help',[
	function(session, args, next){
        var text= "For now: \n\nI can make an invoice transaction to a retailer.\n\nSchedule reminders and make credit card payments.\n\nProvide Credit card transaction history.\n\nUpdate you with latest offers.\n\nAnd much more. I grow as Symphony grows.";
        session.say(text,text);
    }
]).triggerAction({
    matches: 'Help',
    onInterrupted: function (session) {
        session.say('Sorry, something went wrong. Please try again!');
    }
});