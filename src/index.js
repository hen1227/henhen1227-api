import bodyParser from "body-parser";
import fs from "fs";

import express from 'express';
import Database from "easy-json-database";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// import AppStoreConnectApi from "./appStoreConnectApi.js";
import { dndLanguagesUpload, dndLanguagesGetCount } from "./dndLanguages.js";
import cors from 'cors';

let app = express();
let port = process.env.PORT || 80

app.use(express.json());

const corsWhitelist = ['http://localhost:3000', 'http://henhen1227.com', 'https://henhen1227.com']
const corsOptions = {
    origin: function (origin, callback) {
        if (corsWhitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

app.use(cors(corsOptions));

app.listen(port, function(){
    console.log("Server started on port: "+port)
});

//MARK: APP STORE API

// let appStoreApi = new AppStoreConnectApi();
// appStoreApi.reloadApi();

let lastAppStoreUpdate = Date.now();

updateAppStore();
setInterval(updateAppStore, 4  * 60 * 60 * 1000);

function updateAppStore(){
    // appStoreApi.reloadApi();

    const today = new Date();
    lastAppStoreUpdate = String(today.getMonth()+1) + '-' + String(today.getDate()) + '-' + today.getFullYear() + ' ' + String(today.getHours()) + ":" + String(today.getMinutes()) + ":" + String(today.getSeconds()).padStart(2, '0');

    console.log(lastAppStoreUpdate);
}

app.get('/appstore/apps', (req, res) => {
    res.send({
        "data" : appStoreApi.apps,
        "lastUpdate" : lastAppStoreUpdate,
    });
});


//MARK: D&D LANGUAGES

app.post('/dnd-languages/upload', bodyParser.urlencoded({ extended: false }), (req, res) => dndLanguagesUpload(req, res))
app.post('/dnd-languages/getCount', bodyParser.urlencoded({ extended: false }), (req, res) => dndLanguagesGetCount(req, res))
app.get('/dnd-languages/database/languages.json', function(req, res) {
    fs.readFile('dnd-languages/database/languages.json', (err, data) => {
        if(err){
            console.log('Something went wrong');
            console.log(err);
            res.end("failed to load")
        } else {
            const obj = JSON.parse(data);
            res.send(obj)
        }
    })
})
app.get('/dnd-languages/database/*.zip', function(req, res) {res.sendFile(__dirname+req.url.slice(14)) })
app.get('/dnd-languages/database/*.tflite', (req, res) => { res.sendFile(__dirname+req.url.slice(14)) })
app.get('/dnd-languages/database/*.png', (req, res) => {
    console.log(__dirname + req.url.slice(14));
    res.sendFile(__dirname + req.url.slice(14)) })



//MARK: PLATFORM CLIMBER
const platformClimberDB = new Database("./database/platformClimber.json", {
    snapshots: {
        enabled: true,
        interval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        folder: './database/backups/'
    }
});

let platformClimberScores = platformClimberDB.get("scores");
let platformClimberNames = platformClimberDB.get("names");



const platformClimberHighScores = ((asObject) => {
    let value = [];
    if(asObject) {
        for(let i = 0; i < platformClimberScores.length; i++){
            let score = {};
            score[platformClimberNames[i]] = platformClimberScores[i];
            value.push(score);
        }

    }else{
        for (let i = 0; i < platformClimberScores.length; i++) {
            value.push([platformClimberNames[i], platformClimberScores[i]]);
        }
    }
    return value;
});

app.post('/platform-climber/highscore', (req, res) => {
    let score = req.body.score;
    let name = req.body.name;
    let changed = false;
    for (let i = 0; i < platformClimberScores.length; i++) {
        if(Number(score) >= Number(platformClimberScores[i])){
            let tmpScore = platformClimberScores[i];
            let tmpName = platformClimberNames[i];
            platformClimberScores[i] = score;
            platformClimberNames[i] = name;
            score = tmpScore;
            name = tmpName;

            changed = true;
        }
    }
    if(changed){
        platformClimberDB.set('scores', platformClimberScores.join(","));
        platformClimberDB.set('names', platformClimberNames.join(","));
    }

    let value = platformClimberHighScores(true);
    console.log(value);

    res.send(value);
});

app.get('/platform-climber/highscore', (req, res) => {
    let value = platformClimberHighScores(false);
    console.log(value);
    res.send(value);
});


app.get('/platform-climber/download', (req, res) => {
    let path = `${__dirname}/downloads/PlatformClimber-0.1.1-mac.dmg`;
    res.download(path);
});



//MARK: MAIN

app.get('*', (req, res) => {
	res.sendFile(`${__dirname}/index.html`);
});


process.on('exit', function () {
    console.log('About to exit, waiting for remaining connections to complete');
});