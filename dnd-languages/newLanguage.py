import numpy as np
import cv2
from prompt_toolkit import prompt
import json
import shutil
import os
from zipfile import ZipFile

print(" ")
lang = prompt("What is the languages new name?   ")

characters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]

while not os.path.isdir('C:\server/dnd-languages\database/'+lang+'-Letters/'):
    print("Can't find images folder at: /database/"+lang+"-Letters/")
    prompt("Press enter to check again...")
while not os.path.isfile('C:\server/dnd-languages\database/'+lang+'.png'):
    print("Can't find images folder at: /database/"+lang+".png")
    prompt("Press enter to check again...")
pause = True
while pause:
    pause = False
    for file in os.listdir('C:\server/dnd-languages\database/'+lang+'-Letters/'):
        if not any (file in item+".png" for item in characters):
            print('•   Unexpectedly found: '+file+' /database/'+lang+'-Letters')
            pause = True
    if not len(os.listdir('C:\server/dnd-languages\database/'+lang+'-Letters/')) == len(characters):
        print('•   You are missing '+str(len(characters) - len(os.listdir('C:\server/dnd-languages\database/'+lang+'-Letters/')))+' files in  /database/'+lang+'-Letters/')
        pause = True
    if pause:
        prompt("Press enter to check again...")
shutil.make_archive('C:\server/dnd-languages\database/'+lang+'-Letters', 'zip', 'C:\server/dnd-languages\database/'+lang+'-Letters/')
print(" ")
print("[✓]  Created "+lang+"-Letters.zip")


with open('C:\server/dnd-languages\database\languages.json', 'r+') as f:
    data = json.load(f)
    data[lang] = {
        "languageName": lang,
        "latestVersion": 0
    }
    f.seek(0)
    json.dump(data, f, indent=4)
    f.truncate()
print("[✓]  Added to languages.json ")

if os.path.isfile('C:\server/dnd-languages\database/'+lang+'.png'):
    print("[✓] Already has .tflite file")
else:
    shutil.copyfile('C:\server/dnd-languages\Blank.tflite', 'C:\server/dnd-languages\database/' + lang + '.tflite')
    print("[✓]  Added temp .tflite file for initial training")

if not os.path.isdir('C:\server/dnd-languages\database/'+lang+'/'):
    os.mkdir('C:\server/dnd-languages\database/'+lang+'/')
for char in characters:
    if not os.path.isdir('C:\server/dnd-languages\database/'+lang+'/'+char+'/'):
        os.mkdir('C:\server/dnd-languages\database/'+lang+'/'+char+'/')
print("[✓]  Added empty database")

