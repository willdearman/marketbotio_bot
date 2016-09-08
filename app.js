/////////////////////////////////////////////////////////////////////////////////////////
// REQUIREMENTS
/////////////////////////////////////////////////////////////////////////////////////////
var builder = require('botbuilder');
var restify = require('restify');

/////////////////////////////////////////////////////////////////////////////////////////
// EXTERNAL DATA
/////////////////////////////////////////////////////////////////////////////////////////
var prompts = require('./prompts');
var data = require('./externalDataTemp');

/////////////////////////////////////////////////////////////////////////////////////////
// CONNECTOR
/////////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////
bot.dialog('/', intents);

//intents.matches(/^compare/i, '/compare');

// INTENTS: Compare
intents.matches(/^compare/i, [
    function (session) {
        session.send("OK. I will compare two values.")
        session.beginDialog('/compare');
    },
    function (session, results) {

        var entityResponse = session.userData.compareEntityData = results.response;

        // ASSUMPTION: Parent / Child attribute relationship exists in data. Expects 'compareAttribute' to be an array.
        // TO DO: Set via dialog
        var compareAttribute = session.userData.compareAttribute = 'priceHistory'
        var compareAttributeChild = session.userData.compareAttributeChild = 'asOfDate';

        // Set attribute that you want your results to represent
        // RESEARCH: Are there times the user will want something other than price (e.g. volume, etc.)?
        var returnAttributeChild = session.userData.returnAttributeChild = 'price';

        // This is the value you are filtering 'compareAttributeChild' for in filterByAttributeValue()
        // Initially setting to be the compare date in the session, but will expand to values for other fields
        // TO DO: Set via dialog
        var compareAttributeValue = session.userData.compareEntityData.compareAttributeValue;
        console.log('Compare Date is %s', compareAttributeValue)

        // Entity data for attribute specified in compareAttribute (parent)
        // Entity selection is made in dialog '/compare'
        // Filter uses session elements compareAttributeChild (e.g. Date) and compareAttributeValue (e.g. 1900-01-01)
        var entityOneCompare = data[entityResponse.EntityOne.entity][compareAttribute];
        var entityOneCompare = entityOneCompare.filter(filterByAttributeValue);

        var entityTwoCompare = data[entityResponse.EntityTwo.entity][compareAttribute];
        var entityTwoCompare = entityTwoCompare.filter(filterByAttributeValue);

        // The math of the comparison. Eventually move this into its own dialog.
        // ASSUMPTION: Only returns first value in array
        var entityOneCompareValue = parseFloat(entityOneCompare[0][returnAttributeChild])
        var entityTwoCompareValue = parseFloat(entityTwoCompare[0][returnAttributeChild])
        var priceDiffValue = entityTwoCompareValue - entityOneCompareValue
        var priceDiffPct = session.userData.compareEntityData.priceDiffPct = priceDiffValue / entityOneCompareValue

        // Response to user
        // TO DO: Move to prompts
        session.send('You asked me to compare the %s of %s and %s on %s. The dollar difference is %s or %s.', 
            returnAttributeChild,
            entityResponse.EntityOne.entity, 
            entityResponse.EntityTwo.entity,
            compareAttributeValue, 
            priceDiffValue,
            (priceDiffPct * 100) + '%');
        
        session.beginDialog('/evaluateChange');

        
        // Helper Functions
        function filterByAttributeValue(obj) {
            var compareAttributeChild = session.userData.compareAttributeChild;
            var compareAttributeValue = session.userData.compareEntityData.compareAttributeValue;
            //console.log('Attribute: %s', compareValue);
            if (obj[compareAttributeChild] !== undefined && obj[compareAttributeChild] == compareAttributeValue) {
                return true;
            } else {
                //invalidEntries++;
                return false;
            }
        };
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
/////////////////////////////////////////////////////////////////////////////////////////

// DIALOG (/profile): Ask Name
bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// DIALOG (/compare): Returns object with two entity child objects
bot.dialog('/compare', [
    function (session, args, next) {
        // TO DO: Specify element being compared between two entities, and extract value
        session.dialogData.compare = args || {};
        session.send("First security to compare:")
        session.beginDialog('/askEntityName');
    },
    function (session, results, next) {
        if (results.response) {
            //console.log(results.response);
            session.dialogData.compare.EntityOne = results.response
            next();
        } else {
            next();
        }
    },
    function (session, args, next) {
        session.send("Second security to compare:")
        session.beginDialog('/askEntityName');
    },
    function (session, results, next) {
        if (results.response) {
            //console.log(results.response);
            session.dialogData.compare.EntityTwo = results.response
            next();
        } else {
            next();
        }
    },
    function (session, args, next) {
        session.beginDialog('/askCompareDate');
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.compare.compareAttributeValue = results.response
            next();
        } else {
            next();
        }
    },
    function (session, results) {
        session.endDialogWithResult({ response: session.dialogData.compare });
    }
]);

bot.dialog('/evaluateChange', [
    function (session, args, next){
        var priceDiffPct = session.userData.compareEntityData.priceDiffPct;

        // TO DO: Need evaluation method for material differences.
        if((priceDiffPct > .10) || (priceDiffPct < -0.10)) {
            session.send('Wow. %s sounds like a lot.', (priceDiffPct * 100) + '%');
            session.dialogData.followupDialog = 'TRUE'
            next();
        } else {
            next();
        }
        },
    function(session) {
        // TO DO: Update to user affirmative utterances.
        if (session.dialogData.followupDialog == 'TRUE') {
            session.beginDialog('/askAgreeAddResearch');
        } else {
            next();
        }
        },
    function(session,results, next){ 
        if (results.response == "Yes") {
            session.send('I will check what events occurred around that time...')
            session.send('Unfortunately, I do not have that ability yet.')
            //next();
            session.endDialog();
        } else {
            session.send('OK. I will move on.')
            session.endDialog();
    }
    },

]);


/////////////////////////////////////////////////////////////////////////////////////////
// SUPPORTING DIALOG
/////////////////////////////////////////////////////////////////////////////////////////

// SUPPORTING DIALOG (/askEntityName): Prompts for entity choice, and returns entity object
bot.dialog('/askEntityName', [
    function askCompany(session, args, next) {
        var company;
        var args = {};
        var entity = builder.EntityRecognizer.findEntity(args.entities, 'CompanyName');

        if (entity) {
            // Ensures specified company/entity is valid
            // * This calls the underlying function Prompts.choice() uses to match a users response
            //   to a list of choices. When you pass it an object it will use the field names as the
            //   list of choices to match against. 
            company = builder.EntityRecognizer.findBestMatch(data, entity.entity);
        } else if (session.dialogData.company) {
            // Just multi-turn over the existing company
            company = session.dialogData.company;
        }

        // If company not set by passing Entity, then prompt choice
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

// SUPPORTING DIALOG (/askCompareDate): Prompts for date choice, requires entity to have value from that date, and returns date.
bot.dialog('/askCompareDate', [
    function askDate(session, args, next) {
        // TO DO: Different path if compare data already exists in session.userData.compareEntityData.compareDate
        var compareDate;
        if (!compareDate) {
            // TO DO: Add all the fun that goes with converting dates from strings
            // TO DO: Validate date against history available for entities selected
            builder.Prompts.text(session, 'For what date? (Respond in YYYY-MM-DD format)');
        } else {
            // TO DO: Store in session?
            session.userData.compareEntityData.compareDate = compareDate
            next({ response: compareDate })
        }
    }
]);

// SUPPORTING DIALOG (/askAgreeAddResearch): Prompts user to accept additional research
bot.dialog('/askAgreeAddResearch', [
    function (session, args, next) {
        if (!session.dialogData.userAgree) {
            // TO DO: Revise to use affirmative utterances
            session.dialogData.userAgree = builder.Prompts.choice(session, "Do you agree?", ["Yes","No"]);
        } else {
            next();
        }  
    },
    function (session, results){
        if (results.response){
            // NOTE: Because userAgree is choice, have to use .entity because object is returned
            session.dialogData.userAgree = results.response.entity
        }
        console.log('session.dialogData.userAgree', session.dialogData.userAgree)
        session.endDialogWithResult({ response: session.dialogData.userAgree});
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