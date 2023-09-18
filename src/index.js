import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { createServer} from 'http';
import minecraftRoutes from './minecraft/Routes.js';
import minecraftSocketHandler from './minecraft/SocketHandler.js';
import authRoutes from './auth/Routes.js';
import dndRoutes from './dnd-languages/Routes.js';
import calendarRoutes from './calendar/Routes.js';
import clubInvitationRoutes from './club-invitation/Routes.js';
import { startTacticoServer, tacticoGames } from "./tactico/Tactico.js";
import { Server } from 'socket.io'
import WebSocket, { WebSocketServer } from 'ws';

import sequelize from "./models/Sequelize.js";
import {authenticateMinecraftWs} from "./auth/Authentication.js";

let port = process.env.PORT || 4001;
const corsWhitelist = ['ws://api.henhen1227.com', 'http://localhost:3000', 'http://192.168.40.50:4001', 'http://localhost:4001', 'http://henhen1227.com', 'https://henhen1227.com','http://www.henhen1227.com', 'https://www.henhen1227.com']
const wss = new WebSocketServer({ noServer: true });
const app = express();
app.use(cors());
app.use(express.json());
app.use('/minecraft', minecraftRoutes);
app.use('/auth', authRoutes);
app.use('/dnd-languages', dndRoutes);
app.use('/calendar', calendarRoutes);
app.use('/club-invitation', clubInvitationRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {});

// Handle Socket.IO connections
startTacticoServer(io);

// Handle upgrade requests manually
httpServer.on('upgrade', (request, socket, head) => {
    if (request.url.startsWith('/tactico')) {
        // Let Socket.IO handle this request
        io.engine.handleUpgrade(request, socket, head, (ws) => {
            io.engine.emit('connection', ws, request);
        });
    } else {
        // Let the plain WebSocket server handle this request
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});

wss.on('connection', (ws, request) => {
    if(request.url.endsWith('/minecraftServer')) {
        authenticateMinecraftWs(ws, request, minecraftSocketHandler);
    } else if (request.url.endsWith('/minecraftClient')) {
        minecraftSocketHandler(ws, request);
    } else {
        console.log('Unknown websocket connection');
    }
});


//MARK: Downloads
app.get('/platform-climber/download', (req, res) => {
    let path = `/downloads/PlatformClimber-0.1.1-mac.dmg`;
    res.download(path, {root:'.'});
});

app.get('/resume', (req, res) => {
    let path = `/downloads/Resume(01-23).pdf`;
    res.download(path, {root:'.'});
});

app.get('/downloads/minecraft/originsModpack', (req, res) => {
    let path = `/downloads/Henhen1227_Origins_Server.zip`;
    res.download(path, {root:'.'});
});

//MARK: MAIN
app.get('/', (req, res) => {
	res.sendFile('/src/index.html', {root:'.'});
});

sequelize.sync({ force: false, alter: true })
    .then(() => {
        console.log('All tables have been successfully created, if they didn\'t already exist');
        // Only start the server after the sync has completed
        httpServer.listen(port, () => {
            console.log(`Server started on port: ${port}`);
        });
    })
    .catch(error => console.log('This error occurred', error));

process.on('exit', function () {
    console.log('About to exit, waiting for remaining connections to complete');
});
