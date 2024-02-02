import dotenv from 'dotenv';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import User from "../models/UserModel.js";
import {authenticateToken, generateToken} from "./Authentication.js";
import {Club, MinecraftAccount} from "../models/Models.js";
import {sendVerificationEmail} from "../calendar/Routes.js";

dotenv.config();
const router = express.Router();

router.post('/register', async (req, res) => {
    let email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    email = email.toLowerCase();

    try {
        const prevEmailUser = await User.findOne({ where: { email: email } });

        if (prevEmailUser && prevEmailUser.isVerified) {
            return res.status(400).json({ error: 'Email is already in use' });
        }

        if (prevEmailUser && !prevEmailUser.isVerified) {
            await User.destroy({ where: { email: email } });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({ email:email, password: hashedPassword });

        console.log(`A row has been inserted with rowid ${newUser.id}`);

        sendVerificationEmail(newUser)

        return res.send(generateToken(newUser));
    } catch (error) {
        console.log("Error registering user", error);
        console.log(req.body);
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    let email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    email = email.toLowerCase();

    try {
        const user = await User.findOne({ where: { email: email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.send(generateToken(user));
    } catch (error) {
        console.log("Error logging in user", error);
        return res.status(500).json({ error: error.message });
    }
});

router.post('/changePassword', authenticateToken, async (req, res) => {
    const email = req.user.email;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    try {
        const user = await User.findOne({ where: { email: email } });
        if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.update({ password: hashedPassword }, { where: { email: email } });

        res.send({ message: 'Password changed' });
    } catch (error) {
        console.log("Error changing password", error);
        return res.status(500).json({ error: error.message });
    }
});

router.get('/account', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                email: req.user.email
            },
            include: [
                {
                    model: Club,
                    as: 'SubscribedClubs',
                },
                {
                    model: Club,
                    as: 'LedClubs',
                }
            ]
        });
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username,
            isVerified: user.isVerified,
            subscriptions: user.SubscribedClubs,
            leaders: user.LedClubs,
        }
        res.status(200).send( userData );
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.delete('/account', authenticateToken, async (req, res) => {
    const email = req.user.email;
    if (!email) {
        return res.status(400).json({ error: 'Error getting user' });
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
        return res.status(401).json({ error: 'Missing token' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, tokenData) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        if(tokenData.user && tokenData.minecraftAcount) {
            try {
                await MinecraftAccount.update({ userId: tokenData.user, isVerified: true }, {where: { id: tokenData.minecraftAcount }});
                res.send("<h1>Your username has been verified!</h1>");
            } catch (error) {
                return res.status(500).json({error: `ERROR: ${error.message}`});
            }
        }else if(tokenData.user){
            console.log(tokenData)
            try {
                await User.update({isVerified: true}, {where: {id: tokenData.user}});
                res.send("<h1>Your account email has been verified!</h1>");
            } catch (error) {
                return res.status(500).json({error: `ERROR: ${error.message}`});
            }
        }
    });
});

export default router;
