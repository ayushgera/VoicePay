var restify = require('restify');
var builder = require('botbuilder');
var BankService = require('./bankService');
require('dotenv-extended').load();

//APP NAME
//EchoTest
//APP ID
//bf7c0616-9744-424e-b71f-ab7c3b1cdacc
//pass
//X35G7aLjOx7Uimhk31Dda9r
//ngrok http 3978 -host-header="localhost:3978"


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
    session.send("Hiya! How may I help you today?");
    setTimeout(function () {
                session.send("This also does not execute in Cortana");
         }, 1000);
});



// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable (process.env.LUIS_MODEL_URL)
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);


bot.dialog('TransferMoney', [
    function (session, args, next) {
        session.send('Analyzing your message: \'%s\'', session.message.text);
        setTimeout(function () {
                session.send("This does not execute in Cortana");
         }, 1000);
        next();
    },
    function (session, results) {
       
    }
]).triggerAction({
    matches: 'TransferMoney',
    onInterrupted: function (session) {
        session.send('Could not extract the amount and the receiver');
    }
});