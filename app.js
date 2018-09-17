// JavaScript Document

var restify = require('restify');
var builder = require('botbuilder');
var inMemoryStorage = new builder.MemoryBotStorage();
const sqlite3 = require('sqlite3');

var wordsDB = new sqlite3.Database('Words.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the words database.');
});
//var mysql = require('mysql');

//var con = mysql.createConnection({
//   host: "localhost",
//   user: "yourusername",
//   password: "yourpassword",
//   database: "mydb"
//});

//  con.connect(finction(err) {
//  con.query("SELECT * FROM table", function (err, result, fields) {
//    if (err) throw err;
//      console.log(result};
//  });
// });

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
  function (session, results) {      
//    var sql = `SELECT Word word
//            FROM Words
//            WHERE Category = "keywords"
//            `;
          
//      wordsDB.each(sql, (err, row) => {
//        if (err) {
//        throw err;
//        }       
//      });
    
    var splitted = results.response.split(" ");
    var keywords = "keywords: " 
    for (var i = 0; i < splitted.length; i++) {
      keywords = keywords + " , " + splitted[i]
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