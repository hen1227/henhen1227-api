import express from "express";
import {getDownloadCount} from "./appStoreConnectApi.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const downloadCount = await getDownloadCount();
    console.log(downloadCount)
    res.send(`Download Count: ${downloadCount}`);
});

router.get('/stats-image', async (req, res) => {
    const downloads = await getDownloadCount();  // Your actual function to get data
    // const apps = await getAppCount();  // Your actual function to get data
    // const avgRating = await getAvgRating();  // Your actual function to get data
    // const ratingCount = await getRatingCount();  // Your actual function to get data

    const draw = SVG(document.documentElement).size(300, 150);

    draw.text(`Downloads: ${downloads}`).move(10, 20);
    draw.text(`Apps: ${apps}`).move(10, 40);
    draw.text(`Avg Rating: ${avgRating}`).move(10, 60);
    draw.text(`Rating Count: ${ratingCount}`).move(10, 80);

    res.set('Content-Type', 'image/svg+xml');
    res.send(draw.svg());
});

export default router;
