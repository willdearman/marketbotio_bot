/////////////////////////////////////////////////////////////////////////////////////////
// REQUIREMENTS
var builder = require('botbuilder');
var restify = require('restify');

/////////////////////////////////////////////////////////////////////////////////////////
// EXTERNAL DATA
var prompts = require('./prompts');
var externalData = require('./externalDataTemp');

/////////////////////////////////////////////////////////////////////////////////////////
// CONNECTOR
// CONNECTOR: Platform
    // DON'T FORGET TO UNCOMMENT RESTIFY AT END OF FILE
    /* 
    var connector = new builder.ChatConnector({
    appId: process.env.MARKETBOTIO_APP_ID,
    appPassword: process.env.MARKETBOTIO_APP_PASSWORD
    });
    */
// CONNECTOR: Console
var connector = new builder.ConsoleConnector().listen();

// Create bot and bind to console
var bot = new builder.UniversalBot(connector);

/////////////////////////////////////////////////////////////////////////////////////////
// NATURAL LANGUAGE
// TO DO: Add LUIS model
/*
    var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=1ce3aae2-1be0-4cb1-9757-5f2070c519aa&subscription-key=a88228f6-a522-4ea6-aa89-58a256b4bd53&q=';
    var recognizer = new builder.LuisRecognizer(model);
    var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
*/

/////////////////////////////////////////////////////////////////////////////////////////
// INTENTS
var intents = new builder.IntentDialog();
bot.dialog('/', intents);

// INTENTS: Compare
intents.matches(/^compare/i, [
    function (session) {
        session.beginDialog('/compare');
    },
    function (session, results) {
        session.send('You selected %s and %s!', results.response.EntityOne, results.response.EntityTwo);
    }
]);

// INTENTS: Default
intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            // TO DO: Add welcome text to prompts.js
            session.send("I am Mark the Bot from MarkBot.io. I'm not quite ready for users yet, but let's have fun anyway!")
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
    }
]);

/////////////////////////////////////////////////////////////////////////////////////////
// DIALOG

// DIALOG: Profile (What is your name?)
bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// DIALOG: Compare two entities (/compare)
bot.dialog('/compare', [
    function (session, args, next) {
        // TO DO: Specify element being compared between two entities, and extract value
        session.dialogData.compare = args || {};
        session.beginDialog('/askEntityName');
    },
    function (session, results, next) {
        if (results.response){
            session.dialogData.compare.EntityOne = results.response
            next();
        } else {
            next();
        }
    },
    function (session, args, next) {
        session.beginDialog('/askEntityName');
    },
    function (session, results, next) {
        if (results.response){
            session.dialogData.compare.EntityTwo = results.response
            next();
        } else {
            next();
        }
    },
    function (session, results) {
        session.endDialogWithResult({ response: session.dialogData.compare });
    }
]);

// DIALOG: Ask Entity Name
bot.dialog('/askEntityName', [
    // TO DO: Add validation against data source
    function (session) {
        builder.Prompts.text(session, 'Which entity?')
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

//////////////////////////////////////////////
// Setup Restify Server (If Interface Connector turned on)
    //var server = restify.createServer();
    //server.post('/api/messages', connector.listen());
    //server.listen(process.env.port || 3978, function () {
    //    console.log('%s listening to %s', server.name, server.url);
    //});
    //server.post('/api/messages', connector.listen());