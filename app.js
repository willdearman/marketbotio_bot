/* Starting file. Run using ```node app.js``` */
var builder = require('botbuilder');
var restify = require('restify');
var prompts = require('./prompts');

// # Connector
// Interface
    //var connector = new builder.ChatConnector({
    //    appId: process.env.MARKETBOTIO_APP_ID,
    //    appPassword: process.env.MARKETBOTIO_APP_PASSWORD
    //});
// Console
var connector = new builder.ConsoleConnector().listen();

// Natural Language Model
var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=1ce3aae2-1be0-4cb1-9757-5f2070c519aa&subscription-key=a88228f6-a522-4ea6-aa89-58a256b4bd53&q=';
// var recognizer = new builder.LuisRecognizer(model);
// var dialog = new builder.IntentDialog({ recognizers: [recognizer] });


// Create bot and bind to console
var bot = new builder.UniversalBot(connector);

// Create intents variable. Ultimately replace this with:
var intents = new builder.IntentDialog();

// Dialog
bot.dialog('/', [
    function (session) {
        //session.beginDialog('/askName');
        session.beginDialog('/compare');
    },
    function (session, results) {
        //session.send('Hello %s!', results.response);
        session.send('You selected %s and %s!', results.response.EntityOne, results.response.EntityTwo);
    }
]);

bot.dialog('/askName', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);
///////////////////////
// DIALOG: Compare two
bot.dialog('/compare', [
    function (session, args, next) {
        session.dialogData.compare = args || {};
        if (!session.dialogData.compare.EntityOne) {
            builder.Prompts.text(session, "Which entity?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        //session.dialogData.compareEntityTwo = args || {};
        if (results.response) {
            //session.send(results.response)
            session.dialogData.compare.EntityOne = results.response;
        }
        if (!session.dialogData.compare.EntityTwo) {
            builder.Prompts.text(session, "Which entity?");
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response) {
            session.dialogData.compare.EntityTwo = results.response;
        }
        session.endDialogWithResult({ response: session.dialogData.compare });
    }
]);

///////////////////////

//////////////////////////////////////////////
// Setup Restify Server (If Interface Connector turned on)
    //var server = restify.createServer();
    //server.post('/api/messages', connector.listen());
    //server.listen(process.env.port || 3978, function () {
    //    console.log('%s listening to %s', server.name, server.url);
    //});
    //server.post('/api/messages', connector.listen());