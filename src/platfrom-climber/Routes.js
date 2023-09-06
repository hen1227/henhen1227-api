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
    res.send(value);
});

app.get('/platform-climber/highscore', (req, res) => {
    let value = platformClimberHighScores(false);
    res.send(value);
});