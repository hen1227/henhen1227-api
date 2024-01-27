import {scrapeAllMenus} from "../calendar/Dining.js";


scrapeAllMenus().then(() => {
    console.log('Updated all menus!');
});

// Bash script to copy the file at /Users/henryabrahamsen/WebstormProjects/henhen1227-api/database/dining/breakfastMenu.json
// to the server at henry@api.henhen1227.com:/home/henry/Projects/henhen1227-api/database/dining
/*

    scp /Users/henryabrahamsen/WebstormProjects/henhen1227-api/database/dining/breakfastMenu.json henry@api.henhen1227.com:/home/henry/Projects/henhen1227-api/database/dining \
    scp /Users/henryabrahamsen/WebstormProjects/henhen1227-api/database/dining/brunchMenu.json henry@api.henhen1227.com:/home/henry/Projects/henhen1227-api/database/dining \
    scp /Users/henryabrahamsen/WebstormProjects/henhen1227-api/database/dining/lunchMenu.json henry@api.henhen1227.com:/home/henry/Projects/henhen1227-api/database/dining \
    scp /Users/henryabrahamsen/WebstormProjects/henhen1227-api/database/dining/dinnerMenu.json henry@api.henhen1227.com:/home/henry/Projects/henhen1227-api/database/dining
*/
