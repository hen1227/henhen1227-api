import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const router = express.Router();
import { db } from '../auth/database.js';

router.post('/userJoined', (req, res) => {
    const username = req.body.username;

    // Fetch the user from the database
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // If the user doesn't exist, return a message
        if (!row) {
            return res.send("No account exists under this username");
        }

        // If the user exists but is not verified, generate a verification link and return it
        if (!row.confirmed) {
            const token = jwt.sign({ username: row.username }, process.env.JWT_SECRET);
            const confirmationLink = `http://192.168.40.50:3000/verify?token=${token}`
            return res.send({ confirmationLink });
        }

        // If the user exists and is already verified, return a different message
        return res.send("This account is already verified");
    });
});

router.post('/points', async (req, res) => {
    try {
        // Check if the user is already in the database
        db.get(`SELECT * FROM users WHERE username = ?`, [req.body.username], (err, row) => {
            if (err) {
                return console.error(err.message);
            }

            // If the user does not exist, create a new user with the points
            if (!row) {
                db.run(`INSERT INTO users(username, points) VALUES(?, ?)`, [req.body.username, req.body.points], function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    console.log(`A row has been inserted with rowid ${this.lastID}`);
                });

                return res.send({ message: 'User created and points updated' });
            }

            // If the user exists, add points to the player's existing points
            db.run(`UPDATE users SET points = points + ? WHERE username = ?`, [req.body.points, req.body.username], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log(`Points have been updated for ${req.body.username}`);
            });

            res.send({ message: 'Points updated' });
        });
    } catch {
        res.status(500).send();
    }
});


import WebSocket, { WebSocketServer } from 'ws';
import jwt from "jsonwebtoken";

const wss = new WebSocketServer({ port: 2555 });

console.log("WebSocket server listening on port 2555");
wss.on('connection', (ws) => {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message)
        let parsedMessage = JSON.parse(message);
        console.log('parsed: %s', parsedMessage)

        if (parsedMessage.origin === 'minecraft') {
            // Broadcast message to all clients except the sender
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        } else {
            // Broadcast message to all clients
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    });
    // ws.on('message', (message) => {
    //
    //     console.log(`Received message => ${message}`)
    //     wss.clients.forEach((client) => {
    //         if (client.readyState === WebSocket.OPEN) {
    //             console.log("Sending message")
    //             client.send(message);
    //         }
    //     });
    // });
});

export default router;