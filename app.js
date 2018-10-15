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

var ticketsDB = new sqlite3.Database('M42_TData.sqlite', sqlite3.OPEN_READONLY, (err) => {
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
  const results = []
  return new Promise((resolve, reject) => {
    indxDB.each(sql , (err, row) => {
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

ticketsDB.getAsync = function (sql) {
  var that = this;
  const results = []
  return new Promise((resolve, reject) => {
    ticketsDB.each(sql , (err, row) => {
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


async function keywordSelection(word) {
  var val = 0;
  var sqlStmt = `SELECT Word
                FROM Words
                WHERE Category = "keywords"
                AND Word ="${word}"`;
//  console.log(sqlStmt);
  var row = await wordsDB.getAsync(sqlStmt)
  if (!row) {
   console.log("word not found");
  }
  else if (typeof row[0] != 'undefined' ) {
    console.log("word found");
    val = 1;    
  } 
  
  return val;   
} 

async function ticketSelection(word) {
   var val;
   var sqlStmt = `SELECT Tickets tickets
                  FROM Indx
                  WHERE Word ="${word}"`;
 //  console.log(sqlStmt);
   var row = await indxDB.getAsync(sqlStmt)
   if (!row) {
    console.log("ticket not found")
   }
   else if (typeof row[0] != 'undefined' ) {
    console.log("tickets found")
    val = row
  //  console.log(row)
    try {
      return row[0].tickets;
    }
    catch (err) {
      throw err;
    }
    
   }
}

async function ticketDataSelection(ticket) {
  var val
  var sqlStmt = `SELECT Category category
                  FROM TicketData
                  WHERE TicketID ="${ticket}"`;
                  
  console.log(sqlStmt)
  var row = await ticketsDB.getAsync(sqlStmt)
  if (!row) {
    console.log("ticket not found")
  }
  else if (typeof row != 'undefined' ) {
    console.log("ticket found")
    val = row
    //console.log(row[0].category)
    try {
    return row[0].category;
  }
  catch (err) {
    throw (err)
  }
    
  }
                  
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
 //   session.send(`Thank you, query has been confirmed and you requested: ${session.dialogData.queryData}`)
    session.endDialog();
  }
                                   
]).set('storage', inMemoryStorage);

  
bot.dialog('determineQuery', [
  function (session) {
    builder.Prompts.text(session, "Please enter your question:")
  },
  async function (session, results) {      
    session.send("Processing...");
    let inputString = results.response.toLowerCase();
    let splitted = inputString.split(" ");
    var keywords = "keywords: " 
    var arrayz = []
        
    for (var i = 0; i < splitted.length; i++) {
      let word = splitted[i]      
      var keywordOk = await keywordSelection(word) 
      
    
      if (keywordOk == 1) {
        try {
          keywords = keywords + splitted[i] + " " 
          var ticketsSel = await ticketSelection(word)
          if (typeof ticketsSel != 'undefined'){
          
            var ticketSplit = ticketsSel.split(",");
            arrayz.push(ticketSplit)
          }
        }
        catch (err) {
          throw err;
        }
                


      }    
  }
  var intersect = _.intersection(...arrayz)
  
  console.log(arrayz)
  var arrayCat = [] 
  for (var i = 0; i < intersect.length; i++) {
    var category = await ticketDataSelection(intersect[i].trim())
    arrayCat.push(category)
    
  }
   
 var map = _.countBy(arrayCat)
 console.log(keywords)
 var firstHighest = 0;
 var firstHD = "";
 var totalCount = 0;
 
 // later add logic to display also second highest if there is not a big difference, or create an array with top results, which are not so much apart
 
 
 for (var el in map) {
  if (map.hasOwnProperty(el)) {
    totalCount = totalCount + map[el]
    if (map[el] > firstHighest) {
      firstHighest = map[el];
      firstHD = el;
      
    }

    
  }
 
 };
 
 var percentageTotal = ( firstHighest / totalCount ) * 100;
 
 console.log(firstHighest);
 console.log(firstHD);
 console.log(percentageTotal + " %");
               
   
var returnString = firstHD + " " + percentageTotal + "%"                 
      
      session.send("Role corresponding to your query is: %s", returnString )
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


