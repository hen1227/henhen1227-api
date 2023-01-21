import fs from 'fs';

import PythonShell from 'python-shell';
//Using edit-json-file for NodeJS, based off the NPM documentation for edit-file-json


const databaseLocalPath = 'database/dnd-languages/';


function decodeBase64Image(dest, dataString) {
    let buff = Buffer.from(dataString, 'base64');
    fs.writeFileSync(dest, buff);
    console.log("Image added to:  " + dest)
}


function checkCount(language) {
    let totalDownloads = 0;
    const dir = fs.readdirSync(databaseLocalPath+language+'/')
    for (const symbol of dir){
        const len = fs.readdirSync(databaseLocalPath+language+'/'+symbol).length
        totalDownloads += len;
    }
    let currentVersion = JSON.parse(fs.readFileSync(databaseLocalPath+'languages.json'));
    if(totalDownloads > currentVersion[language]['lastUpdate'] + 100){
        currentVersion[language]['lastUpdate'] = totalDownloads;
        fs.writeFile(databaseLocalPath+'languages.json', currentVersion, 'utf8');
        //run training script
        trainAI(language);
        
    }
}

function trainAI(language) {
    PythonShell.run('py/calculate.py', {pyPath: pyPath, args: [tmpPath],}, function (err, results) {
        if (err) {
            PythonShell.run('py/clean_up.py', {pyPath: pyPath, args: [tmpPath2]}, function (err, results2) {
                if (err) throw err;
                res.json(
                    {
                        message: "error: Running clean up",
                        ang: 0,
                        vec: 0,
                    }
                );
            });
        } else {
            let data = JSON.parse(results);
            let message = data[0];
            let ang = data[1];
            let vec = data[2];
            res.json(
                {
                    message: message,
                    ang: ang,
                    vec: vec,
                }
            );
        }
    });
}

export function dndLanguagesUpload(req, res) {
    let realJson = JSON.parse(Object.keys(req.body)[0] +Object.values(req.body)[0]);
    const files = fs.readdirSync(databaseLocalPath+realJson.language+'/'+realJson.letter+'/')
    let letterExt = files.length + 1;
    decodeBase64Image(databaseLocalPath+realJson.language+'/'+realJson.letter+'/Letter'+letterExt.toString()+".jpg", realJson.image.replace(/\ /g, '+'));

    checkCount(realJson.language);

    res.status(200).json({"Status": "Uploaded Successful!", "Message": "The "+letterExt.toString()+"th "+realJson.letter+" has been uploaded to the database" });
}
export function dndLanguagesGetCount(req, res) {
    console.log("Get count: " + req.body);
    let response = []
    const dir = fs.readdirSync(databaseLocalPath+req.body.language+'/')
    for (const symbol of dir){
        const len = fs.readdirSync(databaseLocalPath+req.body.language+'/'+symbol).length
        response.push(len)
    }
    res.status(200).json({"Symbols":dir,"Numbers":response});
}