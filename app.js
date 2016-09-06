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

// Create bot and bind to console
var bot = new builder.UniversalBot(connector);

// Create intents variable. Ultimately replace this with:
var intents = new builder.IntentDialog();

// Dialog
bot.dialog('/', intents);

intents.matches(/^hello/i, function (session) {
        session.send("Hi there!");
    })

.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."))

// Setup Restify Server (If Interface Connector turned on)
    //var server = restify.createServer();
    //server.post('/api/messages', connector.listen());
    //server.listen(process.env.port || 3978, function () {
    //    console.log('%s listening to %s', server.name, server.url);
    //});
    //server.post('/api/messages', connector.listen());