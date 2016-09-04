/* Starting file. Run using ```node app.js``` */
var builder = require('botbuilder');
var restify = require('restify');
var prompts = require('./prompts');

// # Connector
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


// # Begin dialog
var intents = new builder.IntentDialog();
var bot = new builder.UniversalBot(connector);
//bot.dialog('/', 
bot.dialog('/', intents);
    intents.matches(/^hello/i, function (session) {
        session.send("Hi there!");
    })
    intents.matches(/^website/i, [askCompany, answerQuestion('website', prompts.answerWebsite)])
    intents.matches(/^price/i, [askCompany, answerQuestion('tickerPrice', prompts.answerPrice)])
    intents.matches(/^comp/i, [askCompanyCompare, answerQuestionCompare('tickerPrice', prompts.comparePrice)])
    .onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."))

//intents.matches(/^website/i,[askCompany, answerQuestion('website', prompts.answerWebsite)]); 


bot.dialog('/welcome',
[
    function (session) {
        session.send("Hello! I am Mark the Bot.");
        
        //session.beginDialog('/determineTarget_001', session.userData.target_001);
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
// # Begin Helper functions
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


function askCompanyCompare(session, args, next) {
    session.send("made it to askCompanyCompare")
    var company;
    var company1;

    var entity = builder.EntityRecognizer.findEntity(args.entities, 'CompanyName');
   // if (entity) {
   //     session.send("made it to entity")
   //     company = builder.EntityRecognizer.findBestMatch(data, entity.entity);
   //     company1 = builder.EntityRecognizer.findBestMatch(data, entity.entity);
   // } else if (session.dialogData.company) {
        session.send("made it to entity else if")
        company = session.dialogData.company;
        company1 = session.dialogData.company1;
   // }

   // if (!company) {
       if (!session.dialogData.company) { 
        session.send("made it to !company")
        var txt = entity ? session.gettext(prompts.companyUnknown, { company: entity.entity }) : prompts.companyMissing;    
        builder.Prompts.choice(session, txt, data);
        //session.send(company)
    }  if (!session.dialogData.company1) {
        session.send("made it to !company1")
        var txt = entity ? session.gettext(prompts.companyUnknown, { company1: entity.entity }) : prompts.companyMissing;    
        builder.Prompts.choice(session, txt, data);
    } else {
        session.send("Final asCompanyCompare condition")
        next({ response: {
                company: company, 
                company1: company1 
            }})
        //next({response: company, company1});
    }
}

function answerQuestionCompare(field, answerTemplate) {
    return function (session, results) {
        session.send("Made it to answerQuestionCompare")
        if (results.response) {          
            var company = builder.EntityRecognizer.findEntity(results.response, 'Company');
            //= session.dialogData.company = results.response.company;
            session.send("Company.Entity:")
            session.send(company.entity)
            var company1 = builder.EntityRecognizer.findEntity(results.response, 'Company1');
            //= session.dialogData.company1 = results.response.company1;
            session.send("Company1.Entity:")
            session.send(company1.entity)
            var answer = { company: company.entity, company1: company1.entity, value: data[company.entity][field] };
            session.send(answerTemplate, answer);
        } else {
            session.send(prompts.cancel);
        }
    };
}

/** 
 * This function the first step in the waterfall for intent handlers. It will use the company mentioned
 * in the users question if specified and valid. Otherwise it will use the last company a user asked 
 * about. If it the company is missing it will prompt the user to pick one. 
 */
function askCompany(session, args, next) {
    // First check to see if we either got a company from LUIS or have a an existing company
    // that we can multi-turn over.
    var company;
    var entity = builder.EntityRecognizer.findEntity(args.entities, 'CompanyName');
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

/**
 * This function generates a generic answer step for an intent handlers waterfall. The company to answer
 * a question about will be passed into the step and the specified field from the data will be returned to 
 * the user using the specified answer template. 
 */
function answerQuestion(field, answerTemplate) {
    return function (session, results) {
        // Check to see if we have a company. The user can cancel picking a company so IPromptResult.response
        // can be null. 
        if (results.response) {
            // Save company for multi-turn case and compose answer            
            var company = session.dialogData.company = results.response;
            var answer = { company: company.entity, value: data[company.entity][field] };
            session.send(answerTemplate, answer);
        } else {
            session.send(prompts.cancel);
        }
    };
}

// ## Inline Data
// ### Securities
var data = {
  'a': {
      tickerPrice: 1,
      tickerPriceAsOf: 'Jan 1, 1900',
      website: 'http://www.bankofamerica.com'
  },
  'b': {
      tickerPrice: 2,
      tickerPriceAsOf: 'Dec 19, 1980',
      website: 'http://www.jpmorgan.com'
  }
};
// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());