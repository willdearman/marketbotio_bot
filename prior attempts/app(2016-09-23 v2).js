/* Starting file. Run using ```node app.js``` */
var builder = require('botbuilder');
var restify = require('restify');
var prompts = require('./prompts');

// # Connector
var connector = new builder.ChatConnector({
    appId: process.env.MARKETBOTIO_APP_ID,
    appPassword: process.env.MARKETBOTIO_APP_PASSWORD
});

var intents = new builder.IntentDialog();
var bot = new builder.UniversalBot(connector);

bot.dialog('/', intents);       
    
    intents.matches(/^comp/i, [ askCompanyCompare, answerQuestionCompare('tickerPrice', prompts.comparePrice)])
    .onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."))

/* bot.dialog('/', [
    function (session) {
        session.beginDialog('/ensureProfile', session.userData.profile);
    },
    function (session, results) {
        session.userData.profile = results.response;
        session.send('Hello %(name)s! I love %(company)s!', session.userData.profile);
    }
]); */

function answerQuestionCompare (field, answerTemplate) {
    //return function (session, results) {
        return function (session, results) {
        // Check to see if we have a company. The user can cancel picking a company so IPromptResult.response
        // can be null. 
        console.log("Log point 108")
        console.log(results)

        if (results.response) {       
            //var company = session.dialogData.company = results.response; 
            var company = results.response;   
            // Executed - 6
            console.log("Log Point 107")
            console.log(company) 
            var answer = { company: company.entity[0], company1: company.entity[1], value: dataMarketData[company.entity][field] };
            // Executed - 7
            console.log("Log Point 106")
            console.log(answer) 
            session.send(answerTemplate, answer);
        } else {
            session.send(prompts.cancel);
        }
    };
}

function askCompanyCompare (session, results, args, next) {
    
    // First check to see if we either got a company from LUIS or have a an existing company
    // that we can multi-turn over.
        if (results.response){
            // Executed - 3
            console.log("Log Point 105")
            console.log(results.response)

        } else {
            // Executed - 1
            console.log("Log point 104")
        }
    
    var company;
    var company_temp_1;
    var company_temp_2;
    
    var entity = builder.EntityRecognizer.findEntity(args.entities, 'CompanyName');
    if (entity) {
        // The user specified a company so lets look it up to make sure its valid.
        // * This calls the underlying function Prompts.choice() uses to match a users response
        //   to a list of choices. When you pass it an object it will use the field names as the
        //   list of choices to match against. 
        if (results.response){
            company = results.response
            console.log("Log Point 103-A")
            console.log(results.response)
            company_temp = builder.EntityRecognizer.findBestMatch(dataMarketData, entity.entity)
            console.log("Log Point 103-B")
            console.log(results.response)
            company = company + company_temp
            console.log("Log Point 103-B")
            console.log(company)
        } else {
            console.log("Log Point 102")
            company = builder.EntityRecognizer.findBestMatch(dataMarketData, entity.entity);
        }
                    
        
    } else if (session.dialogData.company) {
        // Just multi-turn over the existing company
        if (results.response){
            company_temp_1 = results.response
            console.log("Log Point 101 A")
            console.log(company_temp_1)

            company_temp_2 =  session.dialogData.company
            console.log("Log Point 101 B")
            console.log(company_temp_2)

            company = Object.assign(company_temp_1, company_temp_2);
            console.log("Log Point 101 C")
            console.log(company)
        } else {
            // Executed - 5
            console.log("Log point 100")
            company = session.dialogData.company;
        }

    }
    
    // Prompt the user to pick a ocmpany if they didn't specify a valid one.
    if (!company) {
        // Lets see if the user just asked for a company we don't know about.
        var txt = entity ? session.gettext(prompts.companyUnknown, { company: entity.entity }) : prompts.companyMissing;
        
        if (results.response){
           
            company_temp_1 = results.response
            console.log("Log Point 109 A")
            console.log(company_temp_1)

            //company = Object.assign(company_temp_1, company_temp_2);
            // Executed - 4
            console.log("Log Point 109 B - Company 0")
            console.log(company[0])

            console.log("Log Point 109 C - Company 1")
            console.log(company[1])
        }

        var txt2 = entity ? session.gettext(prompts.companyUnknown, { company: entity.entity }) : prompts.companyMissing;
        if (results.response){
           
            company_temp_2 = results.response
            console.log("Log Point 109 D")
            console.log(company_temp_2)

            company = Object.assign(company_temp_1, company_temp_2);
            console.log("Log Point 109 E - Company 0")
            console.log(company[0])

            console.log("Log Point 109 F - Company 1")
            console.log(company[1])

        } 

        //else {
            // Executed - 2
        //    console.log("Log Point 110")
        //    company = builder.Prompts.choice(session, txt, dataMarketData);
        //} 
                    
    } else {  
        // Great! pass the company to the next step in the waterfall which will answer the question.
        // * This will match the format of the response returned from Prompts.choice().

        company = results.response
        console.log("Log Point 111")
        console.log(company)
        next({ response: company })
    }
};




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




var dataMarketData = {
  'a': {
      tickerPrice: 1,
      tickerPriceAsOf: 'Jan 1, 1900',
  },
  'b': {
      tickerPrice: 2,
      tickerPriceAsOf: 'Dec 19, 1980',
  }
};

// Setup Restify Server
var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());