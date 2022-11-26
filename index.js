let express  = require('express');
//const cors = require('cors');
const Redis = require("ioredis");
let client = new Redis("rediss://default:118c83543daf4eeb8386a110be7ec287@us1-careful-beagle-37021.upstash.io:37021");

let app = express();
let port = process.env.PORT || 5001

//app.use(cors());
// app.use(cookieParser());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(port, function(){
	console.log("Server started on port: "+port)
});

let platform_climber_highscore = [];
let platform_climber_names = [];

client.get("platform-climber-highscores", (err, result) => {
    if (err || !result) {
        console.error(err);
        console.log("Unable to load prevoius highscores");
        platform_climber_highscore = [10,10,10,10,10];
    } else {
        result.split(",").forEach((score) => {
            platform_climber_highscore.push(score);
        });
    }
});

client.get("platform-climber-names", (err, result) => {
    if (err || !result) {
        console.error(err);
        console.log("Unable to load prevoius highscores names");
        platform_climber_names = ["Unable","to","load","past","highscores"];
    } else {
        result.split(",").forEach((score) => {
            platform_climber_names.push(score);
        });
    }
});

const platform_climber_highscore_values = ((asObject) => {
    let value = [];
    if(asObject) {
        for(var i = 0; i < platform_climber_highscore.length; i++){
            let score = {};
            score[platform_climber_names[i]] = platform_climber_highscore[i];
            value.push(score);
        }

    }else {
        for (let i = 0; i < platform_climber_highscore.length; i++) {
            value.push([platform_climber_names[i], platform_climber_highscore[i]]);
        }
    }
    return value;
});

app.post('/platform-climber/highscore', (req, res) => {
    let score = req.body.score;
    let name = req.body.name;
    let changed = false;
    for (let i = 0; i < platform_climber_highscore.length; i++) {
        if(Number(score) >= Number(platform_climber_highscore[i])){
            let tmp = platform_climber_highscore[i];
            let tmp_name = platform_climber_names[i];
            platform_climber_highscore[i] = score;
            platform_climber_names[i] = name;
            score = tmp;
            name = tmp_name;
            
            changed = true;
        }
    }
    if(changed){
        client.set('platform-climber-highscores', platform_climber_highscore.join(","));
        client.set('platform-climber-names', platform_climber_names.join(","));
    }

    let value = platform_climber_highscore_values(true);
    console.log(value);

    res.send(value);
});

app.get('/platform-climber/highscore', (req, res) => {
    let value = platform_climber_highscore_values(false);
    console.log(value);
    res.send(value);
});
app.get('/platform-climber/download', (req, res) => {
    let path = `${__dirname}/downloads/PlatformClimber-0.1.1-mac.dmg`;
    res.download(path);
});

app.get('*', (req, res) => {
	res.sendFile(`${__dirname}/index.html`);
});


process.on('exit', function () {
    console.log('About to exit, waiting for remaining connections to complete');
});