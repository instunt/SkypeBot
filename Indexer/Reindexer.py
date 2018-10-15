import pdb
import json
import sqlite3

ciel = 'Index.sqlite'

con = sqlite3.connect(ciel)
c = con.cursor()

c.execute('''CREATE TABLE IF NOT EXISTS Indx 
          (
          Word TEXT, Tickets TEXT
          )
          ''')   

insertWords = '''INSERT INTO Indx VALUES (?, ?)'''


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
  