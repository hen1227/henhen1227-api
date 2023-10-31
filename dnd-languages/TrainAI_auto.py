##
## DO NOT RUN ON RASPBERRY PI
## IT WOULD PROBABLY DIE
## :I
##


import os
import sys

import numpy as np
from sklearn.model_selection import cross_val_predict

import tensorflow as tf
assert tf.__version__.startswith('2')

from tflite_model_maker import model_spec
from tflite_model_maker import image_classifier
from tflite_model_maker.config import ExportFormat
from tflite_model_makr.config import QuantizationConfig
from tflite_model_maker.image_classifier import DataLoader

import matplotlib.pyplot as plt

import cv2
from prompt_toolkit import prompt
import json

languages = []


sourcePath = '..\database\dnd-languages/'

with open(sourcePath + 'languages.json', 'r+') as f:
    data = json.load(f)
    # print(data)
    print("Languages listed in languages.json: ")
    for lang in data:
        print(lang)
        languages.append(lang)

# language = prompt("What langauge? ")
language = sys.argv[1]

while not language in languages:
    language = prompt("Didn't Recognize Language `" + language"` , try again: ")


if not os.path.isdir(sourcePath+language+'/'):
    os.mkdir(sourcePath+language+'/')

letters = os.listdir(sourcePath+language)
# print(letters)

for letter in letters:

    images = os.listdir(sourcePath+language+'/'+letter)
    # print(images)

    for image in images:
        img = cv2.imread(sourcePath+language+'/'+letter+'/'+image)
        h, w, c = img.shape
        crop_image = img[0:h, round(w/2)-round(h/2):round(w/2)+round(h/2)]
        # print(w)
        # print(h)
        # print(round(w/2)-round(h/2))
        # cv2.imshow('Image',crop_image)
        # cv2.waitKey(0)
        size = (224, 224)
        resized_image = cv2.resize(crop_image, size)
        number = 0
        # while os.path.isfile(sourcePath+language+'-Verified/'+letter+'/Letter'+str(number)+'.png'):
        #     number+=1

        cv2.imwrite(sourcePath+language+'/'+letter+'/'+image, resized_image)


data = DataLoader.from_folder(sourcePath+language+'')
train_data, test_data = data.split(0.9)

model = image_classifier.create(train_data)

loss, accuracy = model.evaluate(test_data)

model.export(export_dir=sourcePath, tflite_filename=language+'.tflite',)


with open(sourcePath + '\languages.json', 'r+') as f:
    data = json.load(f)
    data[language]['latestVersion'] += 1
    f.seek(0)
    json.dump(data, f, indent=4)
    f.truncate()