/////////////////////////////////////////////////////////////////////////////////////////
// REQUIREMENTS
var builder = require('botbuilder');
var restify = require('restify');

/////////////////////////////////////////////////////////////////////////////////////////
// EXTERNAL DATA
var prompts = require('./prompts');
var data = require('./externalDataTemp');

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
// From Crunchbot demo
    var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=56c73d36-e6de-441f-b2c2-6ba7ea73a1bf&subscription-key=6d0966209c6e4f6b835ce34492f3e6d9&q=';
    var recognizer = new builder.LuisRecognizer(model);
    var intents = new builder.IntentDialog({ recognizers: [recognizer] });

    // Base intents
    // var intents = new builder.IntentDialog();

/////////////////////////////////////////////////////////////////////////////////////////
// INTENTS
bot.dialog('/', intents);

//intents.matches(/^compare/i, '/compare');

// INTENTS: Compare
intents.matches(/^compare/i, [
    function (session) {
        session.beginDialog('/compare');
    },
    function (session, results) {
        // TO DO: Dynamic specification of field
        var field = 'sharePrice'

        // TO DO: Is there a better way to do calculations?
        priceDiff = parseInt(data[results.response.EntityTwo.entity][field]) - parseInt(data[results.response.EntityOne.entity][field])

        session.send('You selected %s and %s! The difference in price is %s.', results.response.EntityOne.entity, results.response.EntityTwo.entity,priceDiff);
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
            console.log(results.response);
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
            console.log(results.response);
            session.dialogData.compare.EntityTwo = results.response
            next();
        } else {
            next();
        }
    },
    function (session, results) {
    //var answer = { company: entityOne.entity, value: data[entityOne.entity][acquisitions] };
    //session.send('answerPrice', answer);
        //session.send('You selected %s and %s!', results.response.EntityOne, results.response.EntityTwo);
        session.endDialogWithResult({ response: session.dialogData.compare });
    }
]);

// DIALOG: Ask Entity Name
bot.dialog('/askEntityName', [
    function askCompany(session, args, next) {
    var company;
    var args = {};
    var entity = builder.EntityRecognizer.findEntity(args.entities, 'CompanyName');

    // TO DO: Add validation against data source
    if (entity) {
        // The user specified a company so lets look it up to make sure its valid.
        // * This calls the underlying function Prompts.choice() uses to match a users response
        //   to a list of choices. When you pass it an object it will use the field names as the
        //   list of choices to match against. 
        company = builder.EntityRecognizer.findBestMatch(data, entity.entity);
    } else if (session.dialogData.company) {
        // Just multi-turn over the existing company
        company = session.dialogData.company;
    }
    
    // Prompt the user to pick a ocmpany if they didn't specify a valid one.
    if (!company) {
        // Lets see if the user just asked for a company we don't know about.
        var txt = entity ? session.gettext(prompts.companyUnknown, { company: entity.entity }) : prompts.companyMissing;
        
        // Prompt the user to pick a company from the list. They can also ask to cancel the operation.
        builder.Prompts.choice(session, txt, data);
    } else {
        // Great! pass the company to the next step in the waterfall which will answer the question.
        // * This will match the format of the response returned from Prompts.choice().
        next({ response: company })
    }
}
]);

//////////////////////////////////////////////
// Setup Restify Server (If Interface Connector turned on)
/*
    var server = restify.createServer();
    server.post('/api/messages', connector.listen());
    server.listen(process.env.port || 3978, function () {
        console.log('%s listening to %s', server.name, server.url);
    });
    server.post('/api/messages', connector.listen());
*/