/* Starting file. Run using ```node app.js``` */
var builder = require('botbuilder');
var restify = require('restify');

// # Top Level Bot Dialogue
var connector = new builder.ChatConnector({
    appId: process.env.MARKETBOTIO_APP_ID,
    appPassword: process.env.MARKETBOTIO_APP_PASSWORD
});
/*
bot.dialog('/', new builder.IntentDialog()
    .matches(/^hello/i, function (session) {
        session.send("Hi there!");
    })
    .onDefault(function (session) {
        session.send("I didn't understand. Say hello to me!");
    }));
*/
var bot = new builder.UniversalBot(connector);
bot.dialog('/', [
    function (session) {
        session.beginDialog('/determineTarget_001', session.userData.target_001);
    },
    function (session, results) {
        session.userData.target_001 = results.response;
        session.send('You are looking for %(name)s listed on %(indexName)s!', session.userData.target_001);
    }
    /*function (session) {
        session.beginDialog('/ensureProfile', session.userData.profile);
    },
    function (session, results) {
        session.userData.profile = results.response;
        session.send('Hello %(name)s! I love %(company)s!', session.userData.profile);
    }*/
    // Intents:
    // Price
    // Compare
]);
// ## Complete user profile
bot.dialog('/ensureProfile', [
    function (session, args, next) {
        session.dialogData.profile = args || {};
        if (!session.dialogData.profile.name) {
            builder.Prompts.text(session, "What's your name?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.profile.name = results.response;
        }
        if (!session.dialogData.profile.company) {
            builder.Prompts.text(session, "What company do you work for?");
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response) {
            session.dialogData.profile.company = results.response;
        }
        session.endDialogWithResult({ response: session.dialogData.profile });
    }
]);
// ## Determine target security or index
bot.dialog('/determineTarget_001', [
    function (session, args, next) {
        session.dialogData.target_001 = args || {};
        if (!session.dialogData.target_001.name) {
            builder.Prompts.text(session, "What security you looking for?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.target_001.name = results.response;
        }
        if (!session.dialogData.target_001.indexName) {
            //builder.Prompts.text(session, "What index is it listed on?");
            builder.Prompts.choice(session, "What index is it listed on?", ["NYSE", "NASDAQ", "CME"]);
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response) {
            //session.dialogData.target_001.indexName = results.response;
            session.dialogData.target_001.indexName = results.response.entity;
        }
        session.endDialogWithResult({ response: session.dialogData.target_001 });
    }
]);

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());