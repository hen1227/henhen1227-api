import cron from "node-cron";

// Every week or start of a month, update the menus
import {scrapeAllMenus} from "./Dining.js";

cron.schedule('0 0 1 * *', () => {
    scrapeAllMenus().then(r => console.log('Updated all the menus for this month!'));
});
