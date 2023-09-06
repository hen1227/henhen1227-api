import express from "express";
import {dndLanguagesGetCount, dndLanguagesUpload} from "./DndLanguages.js";
import fs from "fs";
import bodyParser from "body-parser";

const router = express.Router();

router.post('/dnd-languages/upload', bodyParser.urlencoded({ limit: "50mb", extended: false }), (req, res) => dndLanguagesUpload(req, res))
router.post('/dnd-languages/getCount', bodyParser.urlencoded({ limit: "50mb", extended: false }), (req, res) => dndLanguagesGetCount(req, res))
router.get('/dnd-languages/languages.json', function(req, res) {
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
router.get('/dnd-languages/*.zip', function(req, res) {
    res.sendFile("/database"+req.url, {root:'.'});
})
router.get('/dnd-languages/*.tflite', (req, res) => {
    res.sendFile("/database"+req.url, {root:'.'});
    //Google analytics
})
router.get('/dnd-languages/*.png', (req, res) => {
    res.sendFile("/database"+req.url, {root:'.'});
})


export default router;