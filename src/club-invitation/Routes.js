import express from "express";
import {sendEmail} from "../util/SendEmail.js";
import fs, {readFile} from "fs";

const router = express.Router();

router.post('/sendMCInvitation', async (req, res) => {
    let email = req.body.email;
    if (!email) {
        return res.status(400).send({error: "Email is required"});
    }

    // Append the message to the file
    fs.appendFile('database/club-invitation/MinecraftClub.txt', email+'\n', (err) => {
        if (err) {
            console.error('Error appending to the file:', err);
            // return res.status(500).send({error: "Error appending to the file"});
        } else {
            console.log('Message appended successfully!');
        }
    });

    // Check if is valid email
    if(email.indexOf('@') === -1 || email.indexOf('.') === -1) {
        return res.status(400).send({error: "Invalid email"});
    }


    email = email.toLowerCase();

    await readFile('src/club-invitation/MinecraftInvitationEmail.html', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return res.status(500).send({error: "Error reading the file"});
        }

        try {
            await sendEmail(email, "Invited: SPS Minecraft Club", data, true);
            res.send({message: "Email sent"});
        } catch (error) {
            console.log("Error sending email", error);
            res.status(500).send({error: "Error sending email"});
        }
    });
});

router.post('/sendCSInvitation', async (req, res) => {
    let email = req.body.email;
    if (!email) {
        return res.status(400).send({error: "Email is required"});
    }

    // Append the message to the file
    fs.appendFile('database/club-invitation/ComputerScienceClub.txt', email+'\n', (err) => {
        if (err) {
            console.error('Error appending to the file:', err);
            // return res.status(500).send({error: "Error appending to the file"});
        } else {
            console.log('Message appended successfully!');
        }
    });

    // Check if is valid email
    if(email.indexOf('@') === -1 || email.indexOf('.') === -1) {
        return res.status(400).send({error: "Invalid email"});
    }


    email = email.toLowerCase();

    await readFile('src/club-invitation/CSInvitationEmail.html', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return res.status(500).send({error: "Error reading the file"});
        }

        try {
            await sendEmail(email, "Invited: SPS Computer Science Club", data, true);
            res.send({message: "Email sent"});
        } catch (error) {
            console.log("Error sending email", error);
            res.status(500).send({error: "Error sending email"});
        }
    });

});


export default router;
