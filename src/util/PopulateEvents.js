import {Event, ShopItem} from '../models/Models.js';

const events = [
    {
        title: 'Snowball Tag',
        short_description: 'A classic game of tag with snowballs!',
        long_description: 'A high-stakes version of the childhood game of Tag. Can you outmaneuver your friends and avoid being "it"?',
        isRace: false,
        isPvP: false,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'Zombie Survival',
        short_description: 'Survive against a zombie and phantom horde!',
        long_description: 'Stranded in a desolate world with only iron tools, can you survive the relentless onslaught of the undead hordes?',
        isRace: false,
        isPvP: true,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'Enderdragon Race',
        short_description: 'A mad dash to defeat the Enderdragon!',
        long_description: 'A race to the death against the mighty Enderdragon. Will you be the first to slay the beast and claim victory for yourself?',
        isRace: true,
        isPvP: true,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'Maze Run',
        short_description: 'Escape a deadly maze!',
        long_description: 'Trapped in a dangerous maze filled with deadly traps and fearsome monsters. Can you find the way out before your friends do?',
        isRace: true,
        isPvP: true,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'Build Battle',
        short_description: 'Battle of creativity!',
        long_description: 'Put your building skills to the test in a battle of creativity and architectural prowess. Who will build the best structure under the time limit?',
        isRace: false,
        isPvP: false,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'PvP Showdown',
        short_description: 'Fight to the death in various PvP games!',
        long_description: 'Show your combat skills in a series of PvP battles. From sword duels to archery contests, prove you are the best warrior!',
        isRace: false,
        isPvP: true,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'Spleef',
        short_description: 'Don’t fall!',
        long_description: 'Fight to stay on solid ground in a tense match of Spleef. Break blocks under your opponents and be the last one standing!',
        isRace: false,
        isPvP: true,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'Treasure Hunt',
        short_description: 'Find hidden treasures!',
        long_description: 'A race to uncover hidden treasures. Will you be the one to decipher the clues and find the loot?',
        isRace: true,
        isPvP: false,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'Parkour Race',
        short_description: 'Race through challenging parkour!',
        long_description: 'Test your agility and speed in a thrilling parkour race. Can you overcome all obstacles and reach the finish line first?',
        isRace: true,
        isPvP: false,
        image: '',
        type: 'custom_world',
    },
    {
        title: 'Speed Mining',
        short_description: 'Mine as fast as you can!',
        long_description: 'Put your pickaxe to work in a race against time. Who can gather the most resources within the time limit?',
        isRace: true,
        isPvP: false,
        image: '',
        type: 'custom_world',
    }
];

async function populateEvents() {
    await Event.sync({ force: true }); // this deletes all existing events and recreates the table

    for (let event of events) {
        await Event.create(event);
    }

    console.log('Successfully populated events.');
}

populateEvents().catch(console.error);