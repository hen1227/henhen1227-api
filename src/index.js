import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import {createServer} from 'http';
import appleRoutes from './apple/Routes.js';
import dndRoutes from './dnd-languages/Routes.js';
import clubInvitationRoutes from './club-invitation/Routes.js';
import {startTacticoServer} from "./tactico/Tactico.js";
import {Server} from 'socket.io'
import {WebSocketServer} from 'ws';

let port = process.env.PORT || 4001;
// const corsWhitelist = ['ws://api.henhen1227.com', 'http://localhost:3000', 'http://192.168.40.50:4001', 'http://localhost:4001', 'http://henhen1227.com', 'https://henhen1227.com','http://www.henhen1227.com', 'https://www.henhen1227.com']
const wss = new WebSocketServer({noServer: true});
const app = express();
app.use(cors());
app.use(express.json());
// Many old projects have been retired, view commit 10bcd2b to see their history
// app.use('/minecraft', minecraftRoutes);
// app.use('/auth', authRoutes);
app.use('/apple', appleRoutes);
app.use('/dnd-languages', dndRoutes);
// app.use('/calendar', calendarRoutes);
app.use('/club-invitation', clubInvitationRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {path: '/tactico'});

// Handle Socket.IO connections
startTacticoServer(io);

// Handle upgrade requests manually
// TODO: Fix Tactico's implementation! This is kinda messy
httpServer.on('upgrade', (request, socket, head) => {
    console.log(request.url)
    if (request.url.startsWith('/socket.io')) {
        io.engine.handleUpgrade(request, socket, head, (ws) => {
            io.engine.ws.emit('connection', ws, request);
        });
    } else {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});

wss.on('connection', (ws, request) => {
    console.log(request.url)
    if (request.url.endsWith('/minecraftServer')) {
        authenticateMinecraftWs(ws, request, minecraftSocketHandler);
    } else if (request.url.endsWith('/minecraftClient')) {
        minecraftSocketHandler(ws, request);
    } else if (request.url.endsWith('/socket.io')) {
        console.log('SocketIO websocket connection.');
    } else {
        console.log('Unknown websocket connection');
    }
});

// MARK: GitHub Webhooks
// On push of a project, pull the latest changes and restart the server


//MARK: Downloads
app.get('/resume', (req, res) => {
    let path = `/downloads/Henry_Abrahamsen_Resume_11-01.pdf`;
    res.download(path, {root: '.'});
});
app.get('/download/keysoundboard_driver', (req, res) => {
    let path = `/downloads/KeySoundboardDriver.pkg`;
    res.download(path, {root: '.'});
});
app.get('/download/keysoundboard_driver_uninstall', (req, res) => {
    let path = `/downloads/Uninstaller.pkg`;
    res.download(path, {root: '.'});
});

//MARK: MAIN
app.get('/', (req, res) => {
    res.sendFile('/src/index.html', {root: '.'});
});

// Only start the server after the sync has completed
httpServer.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});

process.on('exit', function () {
    console.log('About to exit, waiting for remaining connections to complete');
});
