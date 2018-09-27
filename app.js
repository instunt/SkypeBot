// JavaScript Document

var restify = require('restify');
var builder = require('botbuilder');
var inMemoryStorage = new builder.MemoryBotStorage();
var _ = require('lodash')
var array = require('lodash/array')

const sqlite3 = require('sqlite3').verbose();

var wordsDB = new sqlite3.Database('Words.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the words database.');
});

var indxDB = new sqlite3.Database('Index.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the index database.');    
});



/// Sqlite functions

wordsDB.getAsync = function (sql) {
  var that = this;
  const results = []
  return new Promise((resolve, reject) => {
    wordsDB.each(sql , (err, row) => {
      if (err)
        reject(err);
      else
        results.push(row);
    }, (err, n) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(results);      
      }        
    });
  })
};

indxDB.getAsync = function (sql) {
  var that = this;
  return new Promise(function (resolve, reject) {
    that.get(sql, function(err) {
      if (err)
        reject(err);
      else
        resolve();
    });
  })
};

async function keywordSelection(word) {
  var val;
  var sqlStmt = `SELECT Word
                FROM Words
                WHERE Category = "keywords"
                AND Word ="${word}"`;
  console.log(sqlStmt);
  var row = await wordsDB.getAsync(sqlStmt)
  if (!row) {
   console.log("word not found");
  }
  else {
    console.log("found");
    console.log(row);
    
  } 
  val = row;
  return val;   
} 


//Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.POST || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

//Create chat connector for communicating with the Bor Framework Service
var connector = new builder.ChatConnector({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

//Listen for messages from users
server.post('/api/messages', connector.listen());

//Receive messages from user and echo
var bot = new builder.UniversalBot(connector, [
  function (session) {
    session.send("Hello, how can I help you?");
    session.beginDialog('determineQuery');
  },
  function (session, results) {
    session.dialogData.queryData = results.response;
    session.send(`Thank you, query has been confirmed and you requested: ${session.dialogData.queryData}`)
    session.endDialog();
  }
                                   
]).set('storage', inMemoryStorage);

  
bot.dialog('determineQuery', [
  function (session) {
    builder.Prompts.text(session, "Please enter your question:")
  },
  async function (session, results) {      
    
    let splitted = results.response.split(" ");
    var keywords = "keywords: " 
    
    for (var i = 0; i < splitted.length; i++) {
      let word = splitted[i]      
      var keywordOk = await keywordSelection(word) 
      console.log()
      keywords = keywords + splitted[i] + " "
    
    //     if (row.word !== undefined) {
         //here is a check if word is a keyword
         //console.log("keyword")
         //console.log(row.word)
         
 //        let sqlin = `SELECT Tickets tickets
 //                    FROM Indx
 //                    WHERE Word = ?`;
         
 //        indxDB.each(sqlin, [row.word], (err, row2) => {
 //         if (err) {
//            throw err;
 //         }
 //         if (row2.tickets !== undefined) {
            
            //console.log(row2.tickets)
//            let ticketSplit = row2.tickets.split(",");
//            for (var a = 0; a < ticketSplit.length; a++) {
//              let ticketID = ticketSplit[i]
//              ticketArray.push(ticketSplit[i])
              //console.log(ticketID)
            
 //           }
            
            
//          }
//         })
                         
         //next, select all ticket IDs from indexTickets for keyword
         // then compile a list of tickets with all keywords included and return
         
//         } 
       }       
                  
      
      session.send("%s", keywords)
      session.endDialogWithResult(results);
    } 
]);

bot.dialog('helpDialog', function (session) {
  session.endDialog("This is helper dialog. Say 'goodbye to end")
}).triggerAction({matches: 'Help'});

bot.endConversationAction('goodbyeAction', "Bye!", { matches: 'Goodbye' });

bot.recognizer({
  recognize: function (context, done) {
  var intent = {score: 0.0 };
  
    if (context.message.text) {
      switch (context.message.text.toLowerCase()) {
        case 'help':
          intent = { score: 1.0, intent: 'Help' };
          break;
        case 'goodbye':
          intent = { score: 1.0, intent: 'Goodbye' };
          break;
      }
    }
    done(null, intent);
  }
});


