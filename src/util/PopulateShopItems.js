import {Purchase, ShopItem, User} from '../models/Models.js';

const shopItems = [
    {
        title: 'Diamond Sword',
        description: 'A sword made of diamonds.',
        cost: 100,
        rarity: 'Rare',
        discounted: false,
    },
    {
        title: 'Floppy Fish',
        description: 'A exotic fish that you always seems to flop out of your inventory.',
        cost: 30,
        rarity: 'Uncommon',
        discounted: false,
        image: '',
    },
    {
        title: 'Shoes of the Rabbit',
        description: 'Grants Jump Boost I while worn.',
        cost: 2500,
        rarity: 'Epic',
        discounted: false,
        image: '',
    },
    {
        title: 'Phantom Wings',
        description: 'Works as elytra, but only at night.',
        cost: 4000,
        rarity: 'Legendary',
        discounted: false,
        image: '',
    },
];

async function populateShopItems() {
    await ShopItem.sync({ force: true}); // this deletes all existing shop items and recreates the table

    for (let item of shopItems) {
        await ShopItem.create(item);
    }

    console.log('Successfully populated events.');
}

populateShopItems().catch(console.error);