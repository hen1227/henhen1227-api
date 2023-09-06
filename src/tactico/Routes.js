import {tacticoGames} from "./Tactico.js";

app.get('/tactico/gamesCount', (req, res) => {
    res.send( tacticoGames.length );
});