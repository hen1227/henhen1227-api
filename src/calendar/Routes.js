import express from "express";
import {Club, ClubEvent, DeviceToken, User} from "../models/Models.js";
import {
    authenticateToken,
    authenticateTokenButNotRequired,
    generateEmailVerificationLink,
    requireSPSEmail
} from "../auth/Authentication.js";
import { sendNotificationToClubMembers, sendNotificationTo } from "./Notifications.js";
import {Op} from "sequelize";
import {sendEmail} from "../util/SendEmail.js";
import './DiningListener.js';
import {breakfastMenu, brunchMenu, grabngoMenu, dinnerMenu, lunchMenu} from "./Dining.js";


const router = express.Router();

// Create club
router.post('/club', authenticateToken, requireSPSEmail, async (req, res) => {
    const { name, description, color } = req.body;
    const user = await User.findOne({ where: { email: req.user.email } });

    if (!name || !description || !color) {
        return res.status(400).send({ error: 'All fields are required!' });
    }

    // Make sure that club name is unique
    if (await Club.findOne({ where: { name: name } })) {
        return res.status(400).send({ error: 'Club name already exists' });
    }


    try {
        // Create a new club
        const club = await Club.create({
            name,
            description,
            color
        });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // Add the user as a leader to the club
        await club.addLeader(user);


        res.status(201).send(club);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Server error' });
    }
});

// Delete club
router.delete('/club/:clubId', authenticateToken, async (req, res) => {
    const clubId = req.params.clubId;

    // First, let's retrieve the club to check if it exists
    const club = await Club.findByPk(clubId);

    if (!club) {
        return res.status(404).send({ error: 'Club not found' });
    }

    // Check if the authenticated user is a leader of the club
    const user = await User.findOne({ where: { email: req.user.email } });
    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    const isLeader = await club.hasLeader(user);
    if (!isLeader) {
        return res.status(403).send({ error: 'You are not authorized to delete this club' });
    }

    try {
        // Delete the club
        await club.destroy();

        res.status(200).send({ message: 'Club deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Server error' });
    }
});

// Edit club
router.post('/club/:clubId', authenticateToken, async (req, res) => {
    try {
        const clubId = req.params.clubId;
        const {name, description, color} = req.body;
        const userObject = req.user;

        if (!name || !description || !color) {
            return res.status(400).send({error: 'All fields are required!'});
        }

        // Check if club exists
        const club = await Club.findByPk(clubId);

        if (!club) {
            return res.status(404).send({error: 'Club not found'});
        }

        // Check if the authenticated user is a leader of the club
        const user = await User.findOne({where: {email: userObject.email}});

        const isLeader = await club.hasLeader(user);
        if (!isLeader) {
            return res.status(403).send({ error: 'You are not authorized to update this club' });
        }

        // Update the club
        await club.update({
            name,
            description,
            color
        });

        res.status(200).send({ message: 'Club updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Server error' });
    }
});

// Invite Leader to Club
router.post('/club/:clubId/inviteLeader', authenticateToken, async (req, res) => {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const emailToBeAdded = req.body.email;

    if(!userId || !emailToBeAdded){
        return res.status(400).send({error: 'User ID and email are required!'});
    }

    try {
        const club = await Club.findByPk(clubId);

        if (!club) {
            return res.status(404).send({error: 'Club not found'});
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send({error: 'User not found'});
        }

        const userToBeAdded = await User.findOne({where: {email: emailToBeAdded}});

        if (!userToBeAdded) {
            return res.status(404).send({error: 'That email doesn\'t have an account linked to it'});
        }

        if (userToBeAdded.email.indexOf('@sps.edu') === -1){
            return res.status(400).send({error: 'Leaders require SPS emails'});
        }

        // Check if already leader
        const isLeader = await club.hasLeader(userToBeAdded);
        if (isLeader) {
            return res.status(400).send({error: 'That user is already a leader of this club'});
        }

        // Add the user as a leader to the club
        await club.addLeader(userToBeAdded);

        res.status(200).send({message: 'Successfully added leader to the club'});

    } catch (error) {
        console.log(error)
        res.status(500).send({error: 'Server error'});
    }
});

// Get Club details
router.get('/club/:clubId', async (req, res) => {
    const clubId = req.params.clubId;

    try {
        const club = await Club.findByPk(clubId, {
            include: [
                {
                    model: User,
                    as: 'Subscribers'
                },
                {
                    model: User,
                    as: 'Leaders'
                }
            ]
        });

        if (!club) {
            return res.status(404).send({ error: 'Club not found' });
        }

        // You may also want to format the response to be clearer.
        const response = {
            name: club.name, // or any other club property you want to send
            id: club.id,
            color: club.color,
            description: club.description,
            subscribers: club.Subscribers.map(subscriber => {
                return {
                    email: subscriber.email,
                    id: subscriber.id,
                }
            }),
            leaders: club.Leaders.map(leader => {
                return {
                    email: leader.email,
                    id: leader.id,
                }
            })
        }

        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Server error' });
    }
});

// Retrieve all lead clubs for a user
router.get('/:userId/ledClubs', async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await User.findByPk(userId, {
            include: [
                {
                    model: Club,
                    as: 'LedClubs',
                    include: [
                        {
                            model: User,
                            as: 'Subscribers'
                        },
                        {
                            model: User,
                            as: 'Leaders'
                        }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // You may also want to format the response to be clearer.
        const response = user.LedClubs.map(club => {
            return {
                name: club.name, // or any other club property you want to send
                id: club.id,
                color: club.color,
                description: club.description,
                subscribers: club.Subscribers.map(subscriber => {
                    return {
                        email: subscriber.email,
                        id: subscriber.id,
                    }
                }),
                leaders: club.Leaders.map(leader => {
                    return {
                        email: leader.email,
                        id: leader.id,
                    }
                })
            }
        });

        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Server error' });
    }
});

// Retrieve all club events
router.get('/events', async (req, res) => {
    try {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        await ClubEvent.destroy({
            where: {
                datetime: {
                    [Op.lt]: threeHoursAgo
                }
            }
        });
    } catch (error) {
        console.log(error);
    }

    try {
        // Fetch all events
        const allEvents = await ClubEvent.findAll();
        let allEventsData = [];

        // Get the club associated with each event
        for (let i = 0; i < allEvents.length; i++) {
            const event = {};
            event.title = allEvents[i].title;
            event.id = allEvents[i].id;
            event.datetime = allEvents[i].datetime;
            event.location = allEvents[i].location;
            event.sendNotification = allEvents[i].sendNotification;
            event.clubId = allEvents[i].clubId;
            const club = await Club.findByPk(event.clubId);
            event.club = club.name;
            event.clubId = club.id;
            event.color = club.color;
            allEventsData.push(event);
        }

        res.status(200).send(allEventsData);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Create event for club
router.post('/:clubId/events', authenticateToken, requireSPSEmail, async (req, res) => {
    const clubId = req.params.clubId;

    // Extract event details from request body
    const { title, datetime, location, sendNotification } = req.body;

    // Ensure all necessary fields are provided
    if (!title || !datetime || !location) {
        return res.status(400).send({ error: 'Title, datetime and location are required.' });
    }

    try {
        const club = await Club.findByPk(clubId);

        if (!club) {
            return res.status(404).send({ error: 'Club not found.' });
        }

        // Create new event associated with the specified club
        const event = await ClubEvent.create({
            datetime: new Date(datetime),
            title,
            location,
            sendNotification,
            clubId: club.id
        });

        if (sendNotification) {
            const dateObj = new Date(datetime);
            dateObj.setHours(dateObj.getHours() + 1);  // add one hour

            // Extract day, month, hour, and minute
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1);
            const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            // Combine them into desired format
            const formattedTime = `${month}/${day} ${time}`;
            await sendNotificationToClubMembers(`${club.name}: ${title} at ${formattedTime}`, club.id);
        }

        return res.status(201).send({ success: 'Successfully created event'});
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).send({ error: 'Server error.' });
    }
});

// Delete event
router.delete('/events/:eventId', authenticateToken, async (req, res) => {
    const eventId = req.params.eventId;

    // First, let's retrieve the event to check if it exists
    const event = await ClubEvent.findOne({ where: { id: eventId } });

    if (!event) {
        return res.status(404).send({ error: 'Event not found' });
    }

    // Get the club to which this event belongs
    const club = await event.getClub();
    if (!club) {
        return res.status(404).send({ error: 'Associated club for the event not found' });
    }

    // Check if the authenticated user is a leader of the club
    const user = await User.findOne({ where: { email: req.user.email } });
    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    const isLeader = await club.hasLeader(user);
    if (!isLeader) {
        return res.status(403).send({ error: 'You are not authorized to delete this event' });
    }

    try {
        // Delete the event
        await event.destroy();

        res.status(200).send({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Server error' });
    }
});

// Subscribe to club
router.post('/:clubId/subscribe', authenticateToken, async function (req, res) {
    const userId = req.user.id;
    const clubId = req.params.clubId;

    if (!userId) {
        return res.status(400).send({error: 'User ID is required!'});
    }

    try {
        // Fetch the club and user from the database
        const club = await Club.findByPk(clubId);

        // const club = await Club.findByPk(clubId, {
        //     include: [
        //         {
        //             model: User,
        //             as: 'Subscribers'
        //         }
        //     ]
        // });

        const user = await User.findByPk(userId);

        if (!club) {
            return res.status(404).send({error: 'Club not found'});
        }

        if (!user) {
            return res.status(404).send({error: 'User not found'});
        }

        // Add the user as a subscriber to the club
        await club.addSubscriber(user);

        res.status(200).send({message: 'Successfully subscribed to the club'});
    } catch (error) {
        console.log(error)
        res.status(500).send({error: 'Server error'});
    }
});

// Unsubscribe from club
router.post('/:clubId/unsubscribe', authenticateToken, async function (req, res) {
    const userId = req.user.id;
    const clubId = req.params.clubId;

    if (!userId) {
        return res.status(400).send({error: 'User ID is required!'});
    }

    try {
        // Fetch the club and user from the database
        const club = await Club.findByPk(clubId);
        const user = await User.findByPk(userId);

        if (!club) {
            return res.status(404).send({error: 'Club not found'});
        }

        if (!user) {
            return res.status(404).send({error: 'User not found'});
        }

        // Remove the user as a subscriber to the club
        await club.removeSubscriber(user);

        res.status(200).send({message: 'Successfully unsubscribed from the club'});
    } catch (error) {
        res.status(500).send({error: 'Server error'});
    }
});

// Get all clubs, events, and subscriptions
router.get('/allData', authenticateTokenButNotRequired, async (req, res) => {
    try {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        await ClubEvent.destroy({
            where: {
                datetime: {
                    [Op.lt]: threeHoursAgo
                }
            }
        });
    } catch (error) {
        console.log(error);
    }

    // Destroy all clubs that don't have a leader
    try {
        const allClubs = await Club.findAll();
        for (let i = 0; i < allClubs.length; i++) {
            const club = allClubs[i];
            const leaders = await club.getLeaders();
            if (leaders.length === 0) {
                await club.destroy();
            }
        }
    } catch (error) {
        console.log(error);
    }

    try {
        // Fetch all events
        const allEvents = await ClubEvent.findAll();
        let allEventsData = [];

        // Get the club associated with each event
        for (let i = 0; i < allEvents.length; i++) {
            const event = {};
            event.title = allEvents[i].title;
            event.id = allEvents[i].id;
            event.datetime = allEvents[i].datetime;
            event.location = allEvents[i].location;
            event.sendNotification = allEvents[i].sendNotification;
            event.clubId = allEvents[i].clubId;
            const club = await Club.findByPk(event.clubId);
            event.club = club.name;
            event.clubId = club.id;
            event.color = club.color;
            allEventsData.push(event);
        }

        // Fetch all clubs and extract required fields
        const allClubsRaw = await Club.findAll();
        const allClubs = allClubsRaw.map(club => ({
            id: club.id,
            name: club.name,
            color: club.color,
            description: club.description
        }));

        // Initialize empty arrays for ledClubs and subscribedClubs
        let ledClubs = [];
        let subscribedClubs = [];

        // Check if user is signed in
        if (req.user && req.user.email) {
            const user = await User.findOne({ where: { email: req.user.email } });

            if (user) {
                // Fetch clubs user is leading and extract required fields
                const ledClubsRaw = await user.getLedClubs();
                ledClubs = ledClubsRaw.map(club => ({
                    id: club.id,
                    name: club.name,
                    color: club.color,
                    description: club.description
                }));

                // Fetch clubs user has subscribed to and extract required fields
                const subscribedClubsRaw = await user.getSubscribedClubs();
                subscribedClubs = subscribedClubsRaw.map(club => ({
                    id: club.id,
                    name: club.name,
                    color: club.color,
                    description: club.description
                }));
            }
        }

        // Return consolidated data
        res.json({
            allEvents: allEventsData,
            allClubs: allClubs,
            ledClubs: ledClubs,
            subscribedClubs: subscribedClubs
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Add device token to notification database
router.post('/saveDeviceToken', authenticateToken, async (req, res) => {
    try {
        const { deviceToken, platform } = req.body;
        const userId = req.user.id;

        console.log("deviceToken: ", deviceToken)

        if (!userId || !deviceToken || !platform) {
            return res.status(400).json({ error: 'UserId, token, and platform are required.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if the token already exists for the user
        const existingToken = await DeviceToken.findOne({
            where: {
                userId: userId,
                token: deviceToken
            }
        });

        if (existingToken) {
            return res.status(200).json({ message: 'Token already saved.' });
        }

        // Save the new token
        await DeviceToken.create({
            userId: userId,
            token: deviceToken,
            platform: platform
        });

        await sendNotificationTo("Welcome to SPS Now!", deviceToken, platform);

        res.status(200).json({ message: 'Device token saved successfully.' });
    } catch (error) {
        console.error('Error saving device token:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Send Verification Email to User
router.post('/sendVerificationEmail', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({ error: 'UserId is required.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        await sendVerificationEmail(user);

        res.status(200).json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Get All Menu Data
router.get('/menu', async (req, res) => {
    try {
        const breakfastData= breakfastMenu;
        const brunchData   = brunchMenu;
        const grabngo   = grabngoMenu;
        const lunchData    = lunchMenu;
        const dinnerData   = dinnerMenu;


        const menuData = {
            'breakfast': breakfastData,
            'brunch': brunchData,
            'grabngo': grabngo,
            'lunch': lunchData,
            'dinner': dinnerData,
        }
        return res.status(200).send(menuData);
    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: 'Server error' });
    }
});

export async function sendVerificationEmail(user) {
    // Send verification email
    const verificationLink = generateEmailVerificationLink(user.id);
    const emailBody = `
            Hi ${user.email},<br><br>
            Please click on the link below to verify your email address:<br><br>
            <a href="${verificationLink}">Click here to verify account!</a><br><br>
            Thanks,<br>
            SPS Computer Science Club,<br>
            Henry Abrahamsen
        `;
    const emailSubject = 'SPS Now: Please verify your email address';
    await sendEmail(user.email, emailSubject, emailBody, true);
}

export default router;
