import { Server } from 'socket.io'

let io = null
export let crossGames = []
let openGame = null

export function init4CrossServer(httpServer){
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

    console.log("Game with code:" + self.gameCode)


    this.player1.on("move", function (player, x1, y1, x2, y2){
        // console.log("Moved peice from p 1")
        self.move(player, x1, y1, x2, y2);
    })
    this.player2.on("move", function (player, x1, y1, x2, y2){
        // console.log("Moved peice from p 2")

        self.move(player, x1, y1, x2, y2);
    })


    this.player1.on("resign", function (){
        self.serverIO.emit("gameOver", 1);
    })

    this.player1.on("offerDraw", function (){
        self.serverIO.emit("offerDraw", 0);
    })

    this.player1.on("gameOver", function (player){
        self.serverIO.emit("gameOver", player);
    })

    this.player1.on("disconnect", function (){
        self.serverIO.emit("serverEnded");
    })

    this.player1.on("requestRematch", function(){
        self.serverIO.emit("requestRematch", 0);
    })

    this.player1.on("acceptRematch", function(){
        self.resetGame();
        self.serverIO.emit("startGame");
    })

    //****

    this.player2.on("resign", function (){
        self.serverIO.emit("gameOver", 0);
    })

    this.player2.on("offerDraw", function (){
        self.serverIO.emit("offerDraw", 1);
    })

    this.player2.on("gameOver", function (player){
        self.serverIO.emit("gameOver", player);
    })

    this.player2.on("disconnect", function (){
        self.serverIO.emit("serverEnded");
    })

    this.player2.on("requestRematch", function(){
        self.serverIO.emit("requestRematch", 1);
    })

    this.player2.on("acceptRematch", function(){
        self.resetGame();
        self.serverIO.emit("startGame");
    })
};

Game.prototype.resetGame = function(){
    this.moveCount = 0
    this.currentTurn = 0
}

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
    crossGames = crossGames.filter(function(el) { return el !== this; });
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

        socket.on("joinGameCode", function (desiredGameCode) {
            joinWithGameCode(socket, desiredGameCode)
        })

        socket.on("cancelSearch", function() {
            openGame.end()
        })

        socket.onAny((event, args) => {
            console.log(`received event: ${event} with args: ${args}`);
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

        socket.join(openGame.gameCode)

        openGame.serverIO.emit("playerJoined")

        openGame.startGame()

        openGame = null
    }
}

const createNewGame = function(socket, gameCode) {
    let newGame = new Game(io, gameCode);
    newGame.player1 = socket

    newGame.player1.on("disconnect", function () {
        newGame.end()
    })

    crossGames.push(newGame)
}

const joinWithGameCode = function (socket, gameCode){
    let foundGame = false
    for(let i = 0; i < crossGames.length; i++){
        const game = crossGames[i];
        console.log(game.gameCode);
        console.log(gameCode);

        if(game.gameCode.trim() === gameCode.trim()){

            console.log("Found game with matching Game Code")

            console.log(game.serverIO)

            foundGame = true

            game.player2 = socket

            socket.emit("setPlayerNumber", 1)

            socket.join(gameCode)

            game.serverIO.emit("playerJoined")

            game.startGame()

            break;
        }
    }
    if(!foundGame){
        socket.emit("gameCodeNotFound");
    }
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
