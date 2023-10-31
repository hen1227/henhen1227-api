##
## DO NOT RUN ON RASPBERRY PI
## IT WOULD PROBABLY DIE
## :I
##

from math import sqrt
import random
import cv2
import numpy as np
import os
import csv
from prompt_toolkit import prompt
from PIL import Image, ImageDraw as D
import shutil
import json

from tflite_model_maker.config import QuantizationConfig
from tflite_model_maker.config import ExportFormat
from tflite_model_maker import model_spec
from tflite_model_maker import object_detector

import tensorflow as tf


def distanceCoords(a,b,x,y):
    return sqrt( (a - x)**2 + (b - y)**2 )

def moveLetter(path, des, letter):
    if not os.path.exists(des):
        os.makedirs(des)

    letterExtension = 1

    while os.path.exists(des+"/Letter"+str(letterExtension)+".jpg"):
        letterExtension += 1

    print("saved:  " +  des+"/Letter"+str(letterExtension)+".jpg")
    im1 = Image.open(path)
    rgb_im = im1.convert('RGB')
    rgb_im.save(r""+des+"/Letter"+str(letterExtension)+".jpg")
    # os.rename(path, des+"/Letter"+str(letterExtension)+".png")
    return language + '-Verified/'+letter+"/Letter"+str(letterExtension)+".jpg"
    return r""+csvPath + language + '-Verified/'+letter+"/Letter"+str(letterExtension)+".jpg"
    return r""+des+"/Letter"+str(letterExtension)+".jpg"


# sourcePath = "C:/xampp/htdocs/dnd-languages/uploads/"
# csvPath = "C:/xampp/htdocs/dnd-languages/uploads/"

sourcePath = "C:\server\dnd-languages\database/" # THIS IS FOR OLD WINDOWS SERVER
csvPath = "C:\server\dnd-languages\database/" # THIS IS FOR OLD WINDOWS SERVER

languages = np.array(["Draconic","Dwarvish","Elvish"])
language = prompt("What langauge? ")
unknownLanguage = False
while (language in languages) == False:
    language = prompt("Didn't Recognize Language, try again: ")

completeResetYN = prompt("Do you wish to train new data? Y/N ")
if completeResetYN == "Y" or completeResetYN == "y":
    print("Preforming Complete Reset")
    if os.path.exists(sourcePath+language+".csv"):
        os.remove(sourcePath+language+".csv")

    if os.path.exists(sourcePath+language+"-Verified"):
        shutil.rmtree(sourcePath+language+"-Verified")

    # Minimum percentage of pixels of same hue to consider dominant colour
    MIN_PIXEL_CNT_PCT = (1.0/20.0)

    letters = os.listdir(sourcePath+language)

    for letter in letters:
        if letter != '.DS_Store':
            images = os.listdir(sourcePath + language + "/" +letter)
            for imagePath in images:
                path = sourcePath + language + '/'+ letter +'/' + imagePath
                pathDest = sourcePath + language + '-Verified/'+ letter

                image = cv2.imread(path)
                if image is None:
                    print("Failed to load iamge.")
                    exit(-1)

                image_hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
                # We're only interested in the hue
                h,_,_ = cv2.split(image_hsv)
                # Let's count the number of occurrences of each hue
                bins = np.bincount(h.flatten())
                # And then find the dominant hues
                peaks = [00]

                # Now let's find the shape matching each dominant hue
                for i, peak in enumerate(peaks):
                    # First we create a mask selecting all the pixels of this hue
                    mask = cv2.inRange(h, int(peak), int(peak))
                    # And use it to extract the corresponding part of the original colour image
                    blob = cv2.bitwise_and(image, image, mask=mask)

                    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                    coords = [-1,-1,-1,-1]
                    for j, contour in enumerate(contours):
                        bbox = cv2.boundingRect(contour)

                        if coords[0] == -1 :
                            coords[0] = bbox[0]
                            coords[1] = bbox[1]
                            coords[2] = bbox[0]+bbox[2]
                            coords[3] = bbox[1]+bbox[3]
                        else:
                            #Change the outmost point if it is farther away than the other one

                            if distanceCoords(coords[2],coords[3],bbox[0],coords[1]) > distanceCoords(coords[2],coords[3],coords[0],coords[1]):
                                coords[0] = bbox[0]
                            if distanceCoords(coords[0],coords[1],bbox[0]+bbox[2],coords[3]) > distanceCoords(coords[0],coords[1],coords[2],coords[3]):
                                coords[2] = bbox[0]+bbox[2]
                            if distanceCoords(coords[2],coords[3],coords[0],bbox[1]) > distanceCoords(coords[2],coords[3],coords[0],coords[1]):
                                coords[1] = bbox[1]
                            if distanceCoords(coords[0],coords[1],coords[2],bbox[1]+bbox[3]) > distanceCoords(coords[0],coords[1],coords[2],coords[3]):
                                coords[3] = bbox[1]+bbox[3]

                if coords[0] > 0 or coords[1] > 0:
                    # Add slight padding to outline`
                    coords[0] -= 5
                    coords[1] -= 5
                    coords[2] += 5
                    coords[3] += 5

                    #Move to verified folder

                    newPathEnding = moveLetter(path, pathDest, letter)

                    #          0        1         2        3       4   5  6    7      8    9  10
                    # data = [USE, image_path, catagory, x_min, y_min,"","", x_max, y_max,"","")
                    with Image.open(sourcePath+newPathEnding) as imageImg:
                        resizedImage = imageImg.resize((512, 200))
                        width, height = imageImg.size

                    randomNum = random.randint(1,12)
                    dataAssignment = "UNASSIGNED"

                    if randomNum < 6 :
                        dataAssignment = "TRAIN"
                    elif randomNum < 7 :
                        dataAssignment = "TEST"
                    elif randomNum < 8 :
                        dataAssignment = "VALIDATION"

                    data = [
                        dataAssignment,
                        csvPath+newPathEnding,
                        letter,
                        coords[0]/(width),
                        coords[1]/(height),
                        "",
                        "",
                        (coords[2] - coords[0])/(width),
                        (coords[3] - coords[1])/(height),
                        "",
                        ""
                        ]

                    # i = Image.open(csvPath+newPathEnding)
                    # draw = D.Draw(i)
                    # draw.rectangle([(coords[0],coords[1]),(coords[2],coords[3])],outline="gray",width=4)
                    # i.show()

                    # prompt("Next!")

                    with open(sourcePath+language + '.csv', 'a', newline='') as file:
                        writer = csv.writer(file)
                        writer.writerow(data)
else:
    print("Just training AI then: ")



prompt("Press Enter to continue... ")

assert tf.__version__.startswith('2')

# tf.get_logger().setLevel('ERROR')
# from absl import logging
# logging.set_verbosity(logging.ERROR)

# Spec-name             mb    ms    %
# EfficientDet-Lite0	4.4	  37	25.69%
# EfficientDet-Lite1	5.8	  49	30.55%
# EfficientDet-Lite2	7.2	  69	33.97%
# EfficientDet-Lite3	11.4  116	37.70%
# EfficientDet-Lite4	19.9  260	41.96%

spec = model_spec.get('efficientdet_lite0')

train_data, validation_data, test_data = object_detector.DataLoader.from_csv(sourcePath+language+".csv")
print(train_data)

model = object_detector.create(train_data, model_spec=spec, validation_data=validation_data)

model.evaluate(test_data)

model.export(export_dir=sourcePath,tflite_filename=language+'.tflite')

# model.export(export_dir='.',tflite_filename=language+'.tflite', export_format=[ExportFormat.SAVED_MODEL, ExportFormat.LABEL])

with open('C:\server\dnd-languages\database\languages.json', 'r+') as f:
    data = json.load(f)
    data[language] += 1
    f.seek(0)
    json.dump(data, f, indent=4)
    f.truncate()
