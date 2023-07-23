import dotenv from 'dotenv';
dotenv.config();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import express from "express";
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        // Check if the user is already in the database
        db.get(`SELECT * FROM users WHERE username = ?`, [req.body.username], async (err, row) => {
            if (err) {
                return console.error(err.message);
            }

            // If the user exists and is confirmed, send an error message
            if (row && row.confirmed) {
                return res.status(400).json({ message: 'Username is already taken' });
            }

            // If the user exists but is not confirmed, delete it
            if (row && !row.confirmed) {
                db.run(`DELETE FROM users WHERE username = ?`, [req.body.username], (err) => {
                    if (err) {
                        return console.error(err.message);
                    }
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            // Insert the new user into the database
            db.run(`INSERT INTO users(username, password) VALUES(?, ?)`, [req.body.username, hashedPassword], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            });

            // Generate a confirmation token
            const token = jwt.sign({ username: req.body.username }, process.env.JWT_SECRET);

            // For now, just return the token in the response
            res.send({ confirmationLink: `http://192.168.40.50:4001/auth/confirm?token=${token}` });
        });
    } catch {
        res.status(500).send();
    }
});

router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Fetch the user from the database
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // If the user doesn't exist, or the password is incorrect, return an error
        if (!row || !(await bcrypt.compare(password, row.password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate a JWT and send it in the response
        const token = jwt.sign({ username: row.username }, process.env.JWT_SECRET);
        res.send({ accessToken: token });
    });
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// To use the authenticateToken middleware, just add it as a parameter to your route
router.get('/account', authenticateToken, (req, res) => {
    // Fetch the user data from the database
    db.get(`SELECT * FROM users WHERE username = ?`, [req.user.username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Return the user data
        res.send(row);
    });
});

// router.post('/generateVerificationToken', async (req, res) => {
//     try {
//         const token = crypto.randomBytes(16).toString('hex');
//
//         // Store the token in the database, associated with the player's username
//         db.run(`UPDATE users SET verification_token = ? WHERE username = ?`, [token, req.body.username], function (err) {
//             if (err) {
//                 return console.log(err.message);
//             }
//             console.log(`A verification token has been created for ${req.body.username}`);
//         });
//
//         res.send({ message: 'Verification token generated', token: token });
//     } catch {
//         res.status(500).send();
//     }
// });

router.get('/verify', (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        // Update the confirmed status of the user in the database
        db.run(`UPDATE users SET confirmed = 1 WHERE username = ?`, [user.username], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.send("Your account has been verified!");
        });
    });
});


export default router;