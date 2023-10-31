import fs from 'fs';
import PythonShell from 'python-shell';

const databaseLocalPath = 'database/dnd-languages/';

function decodeBase64Image(dest, dataString) {
    let buff = Buffer.from(dataString, 'base64');
    fs.writeFileSync(dest, buff);
    console.log("Image added to:  " + dest)
}

// No longer checking and updating the AI
// This is because its on a Raspberry pi
// And that just sounds stupid lmao
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
        res.status(200).json(trainAI(language));
    }
}

// Not fully implemented
// FIX THIS BEFORE USING
function trainAI(language, res) {
    let pyPath = process.env.PYTHON_PATH || "python3";
    PythonShell.run('../../dnd-languages/TrainAI_auto.py', {pyPath: pyPath, args: [language],}, function (err, results) {
        if(err)
            console.error(err);
            return {"Status": "Training Failed!", "Message": "The AI has failed to train for "+language+"!"};

        if(res)
            return {"Status": "Training Successful!", "Message": "The AI has been trained for "+language+"!" };
    });
}

export function dndLanguagesUpload(req, res) {
    let realJson = JSON.parse(Object.keys(req.body)[0] +Object.values(req.body)[0]);
    const files = fs.readdirSync(databaseLocalPath+realJson.language+'/'+realJson.letter+'/')
    let letterExt = files.length + 1;
    decodeBase64Image(databaseLocalPath+realJson.language+'/'+realJson.letter+'/Letter'+letterExt.toString()+".jpg", realJson.image.replace(/\ /g, '+'));

    // checkCount(realJson.language);

    res.status(200).json({"Status": "Uploaded Successful!", "Message": "The "+letterExt.toString()+"th "+realJson.letter+" has been uploaded to the database" });
}
export function dndLanguagesGetCount(req, res) {
    // console.log("Get count: ", req.body);
    let response = []
    const dir = fs.readdirSync(databaseLocalPath+req.body.language+'/')
    for (const symbol of dir){
        const len = fs.readdirSync(databaseLocalPath+req.body.language+'/'+symbol).length
        response.push(len)
    }
    res.status(200).json({"Symbols":dir,"Numbers":response});
}
