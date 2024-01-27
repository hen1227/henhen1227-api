import express from 'express';
import {Purchase, ShopItem, User, GameWin, FundingCost, MinecraftAccount} from "../models/Models.js";
import { Op } from "sequelize";
import cron from "node-cron";
import {authenticateMinecraftServer, authenticateToken, generateMinecraftVerificationLink} from "../auth/Authentication.js";
import {minecraftServerSocket} from "./SocketHandler.js";
import fs from "fs";
import updateDailyCostToDatabase from "./CostCalculator.js";

const router = express.Router();

router.post('/playerJoined', authenticateMinecraftServer, async (req, res) => {
    console.log(req.body);
    const username = req.body.username;
    const uuid = req.body.uuid;
    const isOp = req.body.isOp;

    // Validate that the necessary data was provided
    if (!username || !uuid) {
        return res.status(400).json({ error: "Required data missing" });
    }

    // Fetch the user from the database
    try {
        const minecraftAccount = await MinecraftAccount.findOne({ where: { uuid: uuid } });

        console.log(minecraftAccount)

        // If the user doesn't exist, return a message
        if (!minecraftAccount) {
            console.log("Creating account")
            // Create Minecraft Account entry
            MinecraftAccount.create({ username: username, uuid: uuid, isOp: isOp });

            return res.send("Welcome!");
            // return res.send("You do not yet have a mc.henhen1227.com account linked to this account. Create one at https://mc.henhen1227.com/register");
        }

        MinecraftAccount.update({ username: username, isOp: isOp }, { where: { uuid: uuid } })

        if(!minecraftAccount.userId){
            // No Account linked
            return res.send(`Welcome back! You have ${minecraftAccount.points} points.`);
        }

        const user = await User.findOne({ where: { id: minecraftAccount.userId } });

        if(!user){
            // No Account linked
            MinecraftAccount.update({ userId: null, isVerified: false }, { where: { uuid: uuid } })
            return res.send(`Welcome back! You have ${minecraftAccount.points} points.`);
        }

        // If the user exists but is not verified, generate a verification link and return it
        if (!minecraftAccount.isVerified) {
            const confirmationLink = generateMinecraftVerificationLink(user.id, minecraftAccount.id)
            return res.send("Your account isn't verified. To verify it, please go to this link: " + confirmationLink + "");
        }

        // If the user exists and is already verified, return a different message
        return res.send("Welcome back! \n You have ${minecraftAccount.points} points.");
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.post('/points', authenticateMinecraftServer, async (req, res) => {
    try {
        console.log(req.body)
        if (!req.body.username || !req.body.points){
            return res.status(400).send({message: "Missing username or points"});
        }
        // Add points to the player's existing points
        await MinecraftAccount.increment('points', { by: req.body.points, where: { username: req.body.username } });
        console.log(`Points have been updated for ${req.body.username}`);
        return res.send({ message: 'Points updated' });
    } catch (error) {
        console.error(error);
        return res.status(500).send();
    }
});

router.get('/points/:username', async (req, res) => {
    let username = req.params.username;
    if (!username) {
        return res.status(400).send({message: "Missing username"});
    }

    try {
        const player = await MinecraftAccount.findOne({ where: { username: username } });
        if(!player){
            return res.status(404).send({message: "Player not found", points: -404});
        }

        return res.status(200).send({points: player.points});
    } catch (error) {
        console.error(error);
        return res.status(500).send();
    }
});

router.get('/players', async (req, res) => {
    try {
        // Include game wins that have mcId = ,
        const players = await MinecraftAccount.findAll({
            attributes: ['username', 'uuid', 'isOp', 'points', 'isVerified', 'userId'],
            include: [
                {
                    model: GameWin,
                    attributes: ['gameType', 'count']
                }
            ]
        });

        console.log(players)

        // attributes: ['username', 'uuid', 'isOp', 'isVerified', 'userId']
        res.json(players);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching players' });
    }
});

router.post('/gameWin', authenticateMinecraftServer, async (req, res) => {
    console.log(req.body)
    try {
        const { username, gameType } = req.body;

        // Validate that the necessary data was provided
        if (!username || !gameType) {
            return res.status(400).json({ error: "Required data missing" });
        }

        // Check if the user exists
        const minecraftAccount = await MinecraftAccount.findOne({ where: { username: username } });

        if (!minecraftAccount) {
            console.log("User not found");
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch or create the game wins record for this user and game type
        const [record, created] = await GameWin.findOrCreate({
            where: { mcId: minecraftAccount.id, gameType },
            defaults: { count: 0 }
        });

        // If the record was not newly created, increment the count
        // if (!created) {
            await record.increment('count');
        // }

        res.status(200).json({ success: true, message: "Win recorded successfully" });
    } catch (error) {
        console.error("Error recording win:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/buyItem', authenticateMinecraftServer, async (req, res) => {
    console.log(req.body)
    try {
        const { username, itemUniqueId, price } = req.body;

        // Validate that the necessary data was provided
        if (!username || !itemUniqueId || !price) {
            return res.status(400).json({ error: "Required data missing" });
        }

        // Check if the user exists
        const minecraftAccount = await MinecraftAccount.findOne({ where: { username: username } });

        if (!minecraftAccount) {
            console.log("User not found");
            return res.status(404).json({ error: "User not found" });
        }

        if (minecraftAccount.points < price) {
            // Using 202 is kinda slopy...
            return res.status(202).json({ message: "Insufficient points" });
        }

        // Subtract the cost from the user's points and save
        minecraftAccount.points -= price;
        await minecraftAccount.save();

        // Fetch or create the game wins record for this user and game type
        const [record, created] = await Purchase.findOrCreate({
            where: { mcId: minecraftAccount.id, purchase: itemUniqueId },
            defaults: { count: 0 }
        });

        // If the record was not newly created, increment the count
        // if (!created) {
            await record.increment('count');
        // }

        res.status(200).json({ success: true, message: "Purchase recorded successfully." });
    } catch (error) {
        console.error("Error recording purchase:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/dailyDiscounts', async (req, res) => {
    try {
        // Fetch items where discounted is true
        const discountedItems = await ShopItem.findAll({
            where: {
                discounted: true
            }
        });

        res.json(discountedItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching daily discounts' });
    }
});

router.get('/shopItems', async (req, res) => {
    console.log("Accessing Items");
    const shopItems = await ShopItem.findAll({
        order: [
            ['discounted', 'DESC'],
            ['rarity', 'DESC'] // or 'ASC' depending on your needs
        ]
    });
    res.json(shopItems);
});

router.post('/shopItems', authenticateToken, async (req, res) => {
    // const { title, description, uniqueId, cost, rarity, material, lore, enchantments, flags, unbreakable, mendingAllowed, repairAllowed } = req.body;
    const { title, description, uniqueId, cost, rarity  } = req.body;
    console.log(req.body);
    console.log("created item: " + title);

    // create a new item
    const item = await ShopItem.create({
        title: title,
        uniqueId: uniqueId,
        cost: cost,
        rarity: rarity,
        description: description,
        discounted: false
    });

    // send back the new item
    res.json(item);
});

router.delete('/shopItems/:id', authenticateToken, async (req, res) => {
    console.log("deleted item: " + req.params.id);
    try {
        const item = await ShopItem.findByPk(req.params.id);
        if (item) {
            await item.destroy();
            res.json({ success: 'Item deleted successfully' });
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the item' });
    }
});

router.post('/purchase', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.body;

        // Retrieve user and item from the database
        const user = await User.findOne({ where: { username: req.user.username } });
        const item = await ShopItem.findByPk(itemId);

        // Check if the user and item exist
        if (!user || !item) {
            return res.status(404).json({ error: 'User or item not found' });
        }

        console.log("User: " + user.username + " is purchasing item: " + item.title);

        // Check if the user has enough points
        if (user.points < item.cost) {
            return res.status(400).json({ error: 'Insufficient points' });
        }

        // Calculate a random location
        // Intentionally determining the location here instead of in the Minecraft server
        // testing different locations on the server causes freezes and this is easier to
        // return to the front end.
        // const location = { x: Math.floor(Math.random() * 8000) - 4000, z: Math.floor(Math.random() * 8000) - 4000};

        // For testing
        const location = { x: Math.floor(Math.random() * 80) - 40, z: Math.floor(Math.random() * 80) - 40};

        // Subtract the cost from the user's points and save
        if (item.discounted) {
            user.points -= Math.ceil(item.cost/2);
        }else{
            user.points -= item.cost;
        }
        await user.save();

        // Create a new purchase
        const purchase = await Purchase.create({
            userId: user.id,
            itemId: item.id,
            location,
            timestamp: new Date()
        });

        // If the Minecraft server is connected, send the purchase data
        if (minecraftServerSocket === null) {
            res.status(500).json({ error: 'Minecraft server not connected' });
        } else {
            minecraftServerSocket.send(JSON.stringify({ type: 'purchase', purchase: purchase, item: item }));
            return res.json({ success: 'Purchase successful', purchase });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// router.get('/monthlyCost', async (req, res) => {
//     const { year, month } = req.query;  // Assuming year and month are query parameters, e.g., /monthlyCost?year=2023&month=8
//
//     // Validate the input
//     if (!year || !month) {
//         return res.status(400).send({ error: 'Both year and month are required parameters.' });
//     }
//
//     try {
//         const costs = await FundingCost.findAll({
//             where: fn('strftime', '%Y-%m', col('date')), `${year}-${month}`,
//             order: [['date', 'ASC']]
//         });
//
//         if(!costs || costs.length === 0) {
//             return res.status(404).send({ error: 'No data found for the specified month.' });
//         }
//
//         const breakdown = costs.map(cost => ({
//             date: cost.date,
//             totalCost: cost.totalCost
//         }));
//
//         const monthlyTotal = breakdown.reduce((sum, day) => sum + day.totalCost, 0);
//
//         res.send({ monthlyTotal, breakdown });
//     } catch (error) {
//         console.error('An error occurred fetching monthly cost:', error);
//         res.status(500).send({ error: 'Internal Server Error' });
//     }
// });

router.get('/costsLast30Days', async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);  // 30 days ago from today

        // Convert dates to 'YYYY-MM-DD' format for consistency with the database
        const formattedEndDate = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
        const formattedStartDate = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`;

        const costs = await FundingCost.findAll({
            where: {
                date: {
                    [Op.between]: [formattedStartDate, formattedEndDate]
                }
            },
            order: [['date', 'ASC']]
        });

        if (!costs || costs.length === 0) {
            return res.status(404).send({ error: 'No data found for the past 30 days.' });
        }

        const breakdown = costs.map(cost => ({
            date: cost.date,
            totalCost: cost.totalCost
        }));

        const totalFor30Days = breakdown.reduce((sum, day) => sum + day.totalCost, 0);

        res.send({ totalFor30Days, breakdown });
    } catch (error) {
        console.error('An error occurred fetching costs for the last 30 days:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.post('/costOfDay', (req, res) => {
    const dateRequested = req.body.date;

    // Convert the date to your specified format
    const formattedDate = dateRequested.split("-").reverse().join("-");

    fs.readFile('./database/minecraftMonthlyCost.txt', 'utf-8', (err, data) => {
        if(err) {
            return res.status(500).send({error: 'Failed to read the data file.'});
        }

        // Split the data into sections by the date delimiter
        const sections = data.split('=====');
        let desiredSection = null;

        // Find the section with the desired date
        for(let section of sections) {
            if(section.includes(`#${formattedDate}#`)) {
                desiredSection = section;
                break;
            }
        }

        if(!desiredSection) {
            return res.status(404).send({error: `No data found for date ${formattedDate}`});
        }

        // Extract hourly costs. Assuming they are in the line after "...cost of each hour separated by commas..."
        const lines = desiredSection.split('\n').filter(line => line.trim() !== '');
        const costLines = lines[2].split(',').map(cost => parseFloat(cost.trim()));

        // Sum up the total cost
        const totalCost = costLines.reduce((acc, cost) => acc + cost, 0);

        res.send({
            hourlyCosts: costLines,
            totalCost: totalCost
        });
    });
});

cron.schedule('0 0 * * *', async () => { // this runs every day at midnight
    // Daily discounts
    try {
        const allItems = await ShopItem.findAll({
            attributes: ['id'] // fetch only the id field
        });

        // reset the discounted status of all items
        await ShopItem.update({ discounted: false }, { where: {} });

        // get ids and pick 3 random ones
        const ids = allItems.map(item => item.id);
        const randomIds = [];
        for(let i=0; i<1; i++) {
            const index = Math.floor(Math.random() * ids.length);
            randomIds.push(ids.splice(index, 1)[0]); // remove the id from the array to avoid picking it again
        }

        // set the discounted status of the random items
        await ShopItem.update({ discounted: true }, { where: { id: randomIds } });
    } catch (error) {
        console.error('An error occurred while updating daily discounts:', error);
    }

    // Update the daily cost
    await updateDailyCostToDatabase();
});

export default router;
