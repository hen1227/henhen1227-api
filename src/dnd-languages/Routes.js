import express from "express";
import {dndLanguagesGetCount, dndLanguagesUpload} from "./DndLanguages.js";
import fs from "fs";
import bodyParser from "body-parser";

const router = express.Router();

router.post('/upload', bodyParser.urlencoded({ limit: "50mb", extended: false }), (req, res) => dndLanguagesUpload(req, res))
router.post('/getCount', bodyParser.urlencoded({ limit: "50mb", extended: false }), (req, res) => dndLanguagesGetCount(req, res))
router.get('/languages.json', function(req, res) {
    fs.readFile('database/dnd-languages/languages.json', (err, data) => {
        if(err){
            console.log('Something went wrong getting languages.json');
            console.log(err);
            res.end("failed to load")
        } else {
            const obj = JSON.parse(data);
            res.send(obj)
        }
    })
})
router.get('/*.zip', function(req, res) {
    res.sendFile("/database/dnd-languages"+req.url, {root:'.'});
})
router.get('/*.tflite', (req, res) => {
    res.sendFile("/database/dnd-languages"+req.url, {root:'.'});
    //Google analytics
})
router.get('/*.png', (req, res) => {
    res.sendFile("/database/dnd-languages"+req.url, {root:'.'});
})


export default router;
