import {scrapeAllMenus} from "../calendar/Dining.js";

//node /Users/henryabrahamsen/WebstormProjects/henhen1227-api/src/util/PopulateDiningMenus.js

scrapeAllMenus().then(() => {
    console.log('Updated all menus!');
    console.log("YOU RAN THIS FROM HENHEN1227-API PROJECT, NOT CALENDAR-BACKEND");
    console.log('Dont forget to run "\nscp -r /Users/henryabrahamsen/WebstormProjects/henhen1227-api/database/dining henry@api.henhen1227.com:/home/henry/Projects/calendar-backend/database/\n"');
});

/*
    scp -r /Users/henryabrahamsen/WebstormProjects/henhen1227-api/database/dining henry@api.henhen1227.com:/home/henry/Projects/calendar-backend/database/
*/
