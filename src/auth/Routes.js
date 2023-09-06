import dotenv from 'dotenv';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import User from "../models/UserModel.js";
import {authenticateToken, generateToken} from "./Authentication.js";
import {Club} from "../models/Models.js";
import {DataTypes} from "sequelize";

dotenv.config();
const router = express.Router();

router.post('/register', async (req, res) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    try {
        const prevEmailUser = await User.findOne({ where: { email: email } });

        if (prevEmailUser && prevEmailUser.isVerified) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        if (prevEmailUser && !prevEmailUser.isVerified) {
            await User.destroy({ where: { email: email } });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ email:email, password: hashedPassword });

        console.log(`A row has been inserted with rowid ${newUser.id}`);

        return res.send(generateToken(newUser));
    } catch (error) {
        console.log("Error registering user", error);
        console.log(req.body);
        res.status(500).send();
    }
});

router.post('/login', async (req, res) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    try {
        const user = await User.findOne({ where: { email: email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        res.send(generateToken(user));
    } catch (error) {
        console.log("Error logging in user", error);
        return res.status(500).json({ error: error.message });
    }
});

router.get('/account', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.user.email } });
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username,
            isVerified: user.isVerified,
            isUsernameVerified: user.isUsernameVerified,
            mcUUID: user.mcUUID,
            isOp: user.isOp,
            points: user.points,
        }
        res.status(200).send( userData );
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.delete('/account', authenticateToken, async (req, res) => {
    const email = req.user.email;
    if (!email) {
        return res.status(400).json({ message: 'Error getting user' });
    }

    try {
        const userId = req.user.id;
        await User.destroy({ where: { email: email } });

        // Check clubs this user was a leader of
        // Fetch all clubs led by the user
        const ledClubs = await Club.findAll({
            include: [{
                model: User,
                as: 'Leaders',
                where: { id: userId }
            }]
        });

        for (let club of ledClubs) {
            // Check if the club has any leaders left
            const remainingLeaders = await club.getLeaders();

            if (remainingLeaders.length === 0) {
                // If no leaders remain, delete the club

                // Notify all subscribers that the club has been deleted
                const subscribers = await club.getSubscribers();
                for (let subscriber of subscribers) {
                    sendNotification (`The club ${club.name} has been deleted by ${email}.`);
                }

                await club.destroy();
            }
        }

        res.status(200).send({ message: 'Account deleted' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/verify', (req, res) => {
    const token = req.query.token;
    console.log("token: ", token);

    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, tokenData) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        if(tokenData.isVerifyingUsername) {
            try {
                await User.update({isUsernameVerified: true}, {where: {username: tokenData.user.username}});
                res.send("Your username has been verified!");
            } catch (error) {
                return res.status(500).json({error: error.message});
            }
        }else if(tokenData.isVerifyingEmail){
            try {
                await User.update({isVerified: true}, {where: {email: tokenData.user.email}});
                res.send("Your account email has been verified!");
            } catch (error) {
                return res.status(500).json({error: error.message});
            }
        }
    });
});

export default router;
