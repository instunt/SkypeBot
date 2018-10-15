from bs4 import BeautifulSoup
import time
import re
import sqlite3
import pdb
from operator import itemgetter
import math
import unicodedata
import pickle
import json
from unidecode import unidecode

wordsDat = 'Words.sqlite'

wordD = sqlite3.connect(wordsDat)
wd = wordD.cursor()

stop = wd.execute('''SELECT Word from Words WHERE Category="stopwords" ''')
stopwords = list()

ciel = 'Index.sqlite'

con = sqlite3.connect(ciel)
c = con.cursor()

c.execute('''CREATE TABLE IF NOT EXISTS Indx 
          (
          Word TEXT, Tickets TEXT
          )
          ''')   

insertWords = '''INSERT INTO Indx VALUES (?, ?)'''


for elem in stop:
  stopwords.append(elem[0])
        
  
def indexLine(termlist):
  termIndex = {}
  for index, word in enumerate(termlist):
    if word in termIndex.keys():
      termIndex[word].append(index)
    else:
      termIndex[word] = [index]
  return termIndex
  
#vybuduj index v tvare {key}(inz.no.)[slovo]:occurences   
def createIndex(termlists):
  total = {}
  i=1
  for line in termlists.keys():
    total[line] = indexLine(termlists[line])
    print "index " + str(i)   
    i = i+1  
  return total  
  
#vybuduj obrateny index v tvare: {word[key]:occurences} 
# Priklad: u'buducnost': {764: [337]}, u'logg': {801: [5, 34], 804: [8, 62], 764: [78, 130]}  

 
def createReversedIndex(termlists):
  reversedIndex = {}
  i=1
  for key in termlists.keys():
    for word in termlists[key].keys():
      if word in reversedIndex.keys():
        if key in reversedIndex[word].keys():
          reversedIndex[word][key].extend(termlists[key][word][:])
        else:
          reversedIndex[word][key] = termlists[key][word]
      else:
        reversedIndex[word] = {key: termlists[key][word]}
    print "key " + str(i)   
    i = i+1 
  return reversedIndex  

def cleanupTerm(term):
  term = term.replace('"', '').replace("'", '')
  term = term.replace("(", '').replace(")", '')
  term = term.replace("->", '')
  term = term.replace("...", '')
  term = term.replace("{", '').replace("}", '')
  term = term.replace("|", '')
  return term  
  
  
def tokenize(token):    
  if type(token) == str or type(token) == unicode:
    termReturn = list()
    #token = token.decode('utf8')
    an = unicodedata.normalize('NFKD', unicode(token)).encode('ascii','ignore')
    an = unicode(an.strip(), 'utf-8')
    termlist = an.split()
      
    for o in termlist:
      term = o.lower()

 ##### --- Place for implementing stemmer algorithm        
 #cutting down letters from the end based on suffix list
 ### ------------
      term = cleanupTerm(term)
      if checkterm(term) == True:  
        termReturn.append(term)     
    return termReturn 
  
def checkterm(term):
  if term == None:
    return False
  if term in stopwords:
    return False  
  if re.search('[,:-=!?#]', term):
    return False
  else:
#    if term not in stopwords:    
    return True
  

# SQLite definition of source database with ticket headers
src = sqlite3.connect('M42_TData.sqlite')
s = src.cursor()
                    
#data_tickety = s.execute('''SELECT * FROM JParsed WHERE rowid BETWEEN 10 and 20 ''')
data_tickety = s.execute('''SELECT TicketID, Subject, Description, Solution FROM TicketData''')  

    
i=1
termLists = {}
for row in data_tickety:
  print str(i) 
  wordList = list()  
  for word in row:
    word = tokenize(word)    
    if word:
      for slov in word:
        wordList.append(slov)
           
  termLists[row[0]] = wordList     
  i=i+1

searchBase = {}
searchBase = createIndex(termLists)  
reverseInd = createReversedIndex(searchBase)

ofile = open('indexTickets.json', 'wb')
#pickle.dump(reverseInd, output)
#output.close()

output = json.dumps(reverseInd)
ofile.write(output)
ofile.close()

with open('indexTickets.json', 'rb') as files:
  index = json.load(files)
  
  
progress = 1  
for a in index.keys():
  t = list()
  tckts = str(index[a].keys())

  tckts = tckts.replace('[', '').replace(']', '')
  tckts = tckts.replace("u'", "").replace("'","")
  
  t.append(a)
  t.append(tckts)
  
  c.execute(insertWords,t)                                                                
  con.commit()
  
  print "pokrok: " + str(progress) + " z " + str(len(index.keys())) 
  progress += 1
   