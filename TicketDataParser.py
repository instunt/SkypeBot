from selenium import webdriver
from bs4 import BeautifulSoup
import time
import re
import sqlite3
import pdb
import codecs
from collections import defaultdict
import pyautogui
import json
import requests

#############
## treba doplnit parser na attachmenty
#####

def prettify(text):
  try:
    soup = BeautifulSoup(text, "html.parser")  
    body = soup.find('body')
    if body:
      tartext = ''.join(body.findAll(text=True))
      tartext = tartext.encode('utf-8')
    else:    
      tartext = ''.join(soup.findAll(text=True))
      tartext = tartext.encode('utf-8')
  
  except:
    tartext = " "
  
  tartext = unicode(tartext.strip(), 'utf-8')
  return tartext


cas = time.strftime('%d%m%Y')
cas = cas.encode('utf-8')

# SQLite definition of source database with ticket headers
src = sqlite3.connect('M42D_SAP70.sqlite')
s = src.cursor()
      

ciel = 'M42_TData.sqlite'

con = sqlite3.connect(ciel)
c = con.cursor()
                                               

c.execute('''CREATE TABLE IF NOT EXISTS TicketData
          (
          TicketID TEXT, Category TEXT,  RespRole TEXT, CreatedDate TEXT, ClosedDate TEXT,
          Priority TEXT, Subject TEXT, Description TEXT, Solution TEXT
          )
          ''')
                  
           
insertTData = '''
INSERT INTO TicketDAta
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'''

                    
data_tickety = s.execute('''SELECT * FROM TicketData''')

i = 1
for ticket in data_tickety:    
  
  f = list()
    
  subjectT = prettify(ticket[10])
  solutionT = prettify(ticket[11])
  descriptionT = prettify(ticket[15])
          
#          TicketID TEXT, Category TEXT,  RespRole TEXT, CreatedDate TEXT, ClosedDate TEXT,
#          Priority TEXT, Subject TEXT, Description TEXT, Solution TEXT

      
  f.append(ticket[2])
  f.append(ticket[17])
  f.append(ticket[19])  
  f.append(ticket[13])
  f.append(ticket[14])
  f.append(ticket[16])
  f.append(subjectT)
  f.append(descriptionT)
  f.append(solutionT)

    
  c.execute(insertTData,f)
  con.commit()
  
  print str(i)
  i += 1
  