import {scrapeAllMenus} from "../calendar/Dining.js";


scrapeAllMenus().then(() => {
    console.log('Updated all menus!');
});
