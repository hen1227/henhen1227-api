import { Server } from 'socket.io'
import { createServer} from 'http';


let io = null
export let crossGames = []
let openGame = null

export function init4CrossServer(app){
    const httpServer = createServer(app);

    io = new Server(httpServer, {})
    addHandlers()
}

function Game(serverIO, gameCode) {
    this.serverIO = serverIO.to(gameCode)
    this.gameCode = gameCode

    this.player1 = null
    this.player2 = null

    this.moveCount = 0
    this.currentTurn = 0
}

Game.prototype.startGame = function(){
    const self = this
    this.player1.on("move", function (player, x1, y1, x2, y2){
        // console.log("Moved peice from p 1")
        self.move(player, x1, y1, x2, y2);
    })
    this.player2.on("move", function (player, x1, y1, x2, y2){
        // console.log("Moved peice from p 2")

        self.move(player, x1, y1, x2, y2);
    })

    this.player1.on("resign", function (){
        this.serverIO.emit("gameOver", 1);
    })

    this.player1.on("offerDraw", function (){
        this.serverIO.emit("offerDraw", 0);
    })

    this.player1.on("gameOver", function (){

    })

    this.player2.on("resign", function (){
        this.serverIO.emit("gameOver", 0);
    })

    this.player2.on("offerDraw", function (){
        this.serverIO.emit("offerDraw", 0);
    })
};

Game.prototype.move = function(player, x1, y1, x2, y2){
    console.log("Player ["+player+"] Wants to move ("+x1+","+y1+") to ("+x2+","+y2+")")
    if(this.currentTurn ===  player){
        this.serverIO.emit("move", player, x1, y1, x2, y2)

        this.moveCount++;

        this.switchTurns()
    }
}

Game.prototype.end = function (){
    this.serverIO.disconnectSockets();
}

Game.prototype.switchTurns = function(){
    this.currentTurn = (this.currentTurn + 1) % 2
}


const addHandlers = function() {
    io.sockets.on("connect", function(socket) {
        console.log("Connection")

        socket.emit("gameTypeRequest")

        socket.on("playOnline", function() {
            addToGame(socket)
        })

        socket.on("hostGame", function(desiredGameCode) {
            createNewGame(socket, desiredGameCode)
        })

        socket.on("cancelSearch", function() {
            openGame.end()
        })

        socket.onAny((event, args) => {
            console.log(`received event: ${event}`);
        });
    })

    io.sockets.on("error", (error) => {
        console.log(error)
    });
}

const addToGame = function(socket){
    if(openGame == null || !openGame.player1.connected){
        console.log("Creating new game")
        openGame = new Game(io, "RG-"+randomGameCode())
        openGame.player1 = socket

        socket.emit("setPlayerNumber", 0)

        crossGames.push(openGame)

        socket.join(openGame.gameCode)
    }else{
        console.log("Adding player to game, starting match")

        openGame.player2 = socket

        socket.emit("setPlayerNumber", 1)

        openGame.serverIO.emit("playerJoined")

        socket.join(openGame.gameCode)

        openGame.startGame()

        openGame = null
    }
}

const createNewGame = function(socket, gameCode) {
    let newGame = new Game(io, gameCode);
    newGame.player1 = socket

    crossGames.push(newGame)
}

const randomGameCode = function() {
    let length = 5
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
