import WebSocket from 'ws';
import {Purchase, User} from "../models/Models.js";

let webClients = new Set();
export let minecraftServerSocket = null;

export default function MinecraftSocketHandler(ws, req) {
    if(req.url.endsWith('/minecraftServer')) {
        minecraftServerSocket = ws;

        minecraftServerSocket.on('message', message => {
            const data = JSON.parse(message);
            console.log("Minecraft server sent message: " + message);
            switch (data.type) {
                case 'chatMessage':
                case 'playerJoin':
                case 'playerDeath':
                case 'playerAchievement':
                    broadcast(message, false);
                    break;
                case 'purchaseSuccessful':
                    console.log("Received purchase successful message from Minecraft server");
                    // Get purchase with id from data.purchase
                    const purchaseId = data.purchase;
                    Purchase.findOne({ where: { id: purchaseId } }).then(purchase => {
                        if(purchase) {
                            // Update purchase with status 'complete'
                            purchase.status = 'complete';
                            purchase.save();
                        }else{
                            console.log("Unable to find purchase with id " + purchaseId);
                        }
                    }).catch(err => {
                        console.log("Error finding purchase with id " + purchaseId + ": " + err);
                    });

                    break;
                default:
                    console.log('Unknown message type received from Minecraft server:', data.type);
            }
        });

        minecraftServerSocket.on('close', () => {
            console.log("Minecraft server connection closed");
            minecraftServerSocket = null;
            updateServerStatus();
        });

        minecraftServerSocket.on('error', (error) => {
            console.error(`WebSocket (Minecraft Server) error: ${error}`);
        });

        updateServerStatus();
    } else {
        console.log("Web client connected");
        webClients.add(ws);
        updateClientCount();
        updateServerStatus();

        ws.on('message', message => {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'chatMessage':
                    broadcast(message);
                    break;
                default:
                    console.log('Unknown message type received from web client:', data.type);
            }
        });

        ws.on('close', () => {
            webClients.delete(ws);
            updateClientCount();
        });

        ws.on('error', (error) => {
            console.error(`WebSocket (Web Client) error: ${error}`);
        });
    }

    function broadcast(message, includeMinecraftServer = true) {
        console.log("Broadcasting message: " + message);

        if (includeMinecraftServer && minecraftServerSocket && minecraftServerSocket.readyState === WebSocket.OPEN) {

            // YOU'VE GOT TO BE KIDDING ME! 3 HOURS AND THIS IS HOW IT IS FIXED!?!
            // THIS IS GARBAGE!
            let jsonParsedMessage = JSON.parse(message);
            let stringifiedMessage = JSON.stringify(jsonParsedMessage);

            minecraftServerSocket.send(stringifiedMessage);
        }

        webClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            } else {
                console.log("Unable to send message to web client. Connection is not open.");
            }
        });
    }

    function updateClientCount() {
        const message = JSON.stringify({ type: 'updateClientCount', count: webClients.size });
        broadcast(message, false);
    }

    function updateServerStatus() {
        const message = JSON.stringify({ type: 'updateServerStatus', status: minecraftServerSocket != null });
        broadcast(message, false);
    }
}