import puppeteer from "puppeteer";
import fs from "fs";

const scrapeMenu = async (mealType, month, year="2024") => {
    try {
        const URL = `https://sps.flikisdining.com/menu/st-pauls-school/${mealType}/print-menu/week/${year}-${month}-01`;
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: executablePath,
        });
        const page = await browser.newPage();

        // Set up request interception to block stylesheets
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.resourceType() === 'stylesheet') {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(URL, {waitUntil: 'networkidle2'});

        // 5 seconds
        await delay(5000);

        // console.log(await page.content())
        // Get all menu days
        const menuDays = await page.$$('.menu-day-contents');

        const menuDaysJSON = await Promise.all(menuDays.map(async menuDay => {
            try {

                // For each menu-day-contents div, we extract the date (assuming it's present in each)
                const date = await menuDay.$eval('.menu-day-date', node => node.innerHTML);

                // Trim everything that isn't a number
                const plainDate = date.replace(/\D/g, '');

                // Then, for each section-foods div inside the menu-day-contents div
                const sections = await menuDay.$$('.section-foods > div');
                const dayData = await Promise.all(sections.map(async section => {
                    let sectionTitle = null;
                    // Try to get station-title from the section div
                    try {
                        sectionTitle = await section.$eval('.station-title', node => node.innerText);
                    } catch (e) {
                        // The section-title might not exist in some sections, so we handle potential errors
                    }

                    // Get all food names from the section div
                    const foodNodes = await section.$$('.food-name > menu-item-content');
                    const foods = await Promise.all(foodNodes.map(foodNode => foodNode.evaluate(node => node.innerText)));

                    return {
                        sectionTitle: sectionTitle,
                        foods: foods
                    };
                }));

                return {
                    date: plainDate,
                    sections: dayData
                };
            } catch (e) {
                console.error('Error in menuDayJSON:', e);
            }
        }));

        const jsonString = JSON.stringify(menuDaysJSON, null, 2);

        // Save to json file
        fs.writeFileSync(`./database/dining/${mealType}Menu.json`, jsonString);

        await browser.close();
    } catch (e) {
        console.error('Error in scrapeMenu:', e);
    }
};

export const scrapeAllMenus = async () => {
    // Current month int
    const month = new Date().getMonth() + 1;
    const year = "" + new Date().getFullYear();

    console.log("Starting to scrape menus for the month: ", month);

    await scrapeMenu('breakfast', month, year);
    console.log('Updated the breakfast menu for this month!');

    await scrapeMenu('brunch', month, year);
    console.log('Updated the brunch menu for this month!');

    await scrapeMenu('lunch', month, year);
    console.log('Updated the lunch menu for this month!');

    await scrapeMenu('dinner', month, year);
    console.log('Updated the dinner menu for this month!');
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
}

if(process.env.PRODUCTION_ENVIRONMENT) {
    scrapeAllMenus().then(() => {
        console.log('Updated all menus!');
    });
}

const getMenu = (mealType) => {
    // TODO: Research if there is a better way to do this.
    // Is it possible to load the json as if it were an import, then update it after scraping the menu.
    return JSON.parse(fs.readFileSync(`./database/dining/${mealType}Menu.json`, 'utf8'));
}

export const breakfastMenu = getMenu('breakfast');
export const brunchMenu = getMenu('brunch');
export const lunchMenu = getMenu('lunch');
export const dinnerMenu = getMenu('dinner');
