import axios from 'axios';
import {FundingCost} from "../models/Models.js";

export async function computeCostForTheDay(date) {
    const twentyFourHoursAgo = new Date(date - 24 * 60 * 60 * 1000); // Subtracting 24 hours in milliseconds

    console.log("24 hours ago:", twentyFourHoursAgo);

    const startTimestamp = Math.floor(twentyFourHoursAgo.getTime() / 1000); // Convert to UNIX timestamp
    const endTimestamp = Math.floor(date.getTime() / 1000); // Convert to UNIX timestamp

    const query = `(avg without (cpu) (sum(irate(windows_cpu_time_total{instance="192.168.40.243:9182",mode!="idle"}[5m])) by (mode)) / 4) * 100`;

    const response = await axios.get('http://192.168.40.164:9090/api/v1/query_range', {
        params: {
            query: query,
            start: startTimestamp,
            end: endTimestamp,
            step: 3600 // 1-hour intervals
        }
    });

    if (response.data.status === "success") {
        return combineData(response.data.data.result);
    } else {
        throw new Error(response.data.error);
    }
}

function combineData(data) {
    const combinedData = [];
    const combinedCost = [];
    const combinedTimestamp = [];

    // Assuming each mode has the same number of timestamps and they are in the same order
    const timestamps = data[0].values.map(pair => pair[0]);

    timestamps.forEach((timestamp, index) => {
        const totalValue = data.reduce((sum, modeData) => {
            return sum + parseFloat(modeData.values[index][1]);
        }, 0);
        combinedCost.push(roundToEight(processCost(totalValue)));
        combinedData.push(roundToEight(totalValue));
        combinedTimestamp.push(timestamp*1000);
    });

    return {usage: combinedData, cost: combinedCost, timestamp: combinedTimestamp};
}

function roundToEight(num) {
    return +(Math.round(num + "e+8")  + "e-8");
}

function processCost(data) {
    // https://www.maine.gov/mpuc/regulated-utilities/electricity/delivery-rates
    // Changes every year and couldn't find API for it
    // 28 ¢/kWh
    const electricityCostPerKWhMaine = 0.28; // In Maine

    // https://www.bls.gov/regions/northeast/news-release/averageenergyprices_boston.htm
    // 34.1 ¢/kWh
    // const electricityCostPerKWhBoston = 0.341; // In Boston Area
    // As a percentage
    const cpuUtilization = parseFloat(data);

    // https://www.intel.com/content/www/us/en/products/sku/80815/intel-core-i54590-processor-6m-cache-up-to-3-70-ghz/specifications.html
    // The CPU inside my current computer
    const maxPowerConsumption = 84; // Watts (determined by the CPU TDP)


    // Calculate power consumption for the current utilization
    const currentPowerConsumption = (cpuUtilization / 100) * maxPowerConsumption; // Converts percent to watts
    const currentPowerConsumptionKWh = currentPowerConsumption / 1000; // Convert watts to kWh

    // Calculate cost for running the server for one hour at the current utilization
    const costForOneHour = currentPowerConsumptionKWh * electricityCostPerKWhMaine;

    return costForOneHour;
}

export default async function updateDailyCostToDatabase() {
    const costForTheDay = await computeCostForTheDay(new Date());

    try {
        const date = new Date(costForTheDay.timestamp[0]);
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

        // Insert the cost to the database
        await FundingCost.create({
            date: formattedDate,
            hourlyCosts: costForTheDay.usage, // assuming this is an array or serialized JSON
            totalCost: costForTheDay.cost.reduce((a, b) => a + b, 0)  // summing up the costs for the day
        });
    } catch (error) {
        console.error('An error occurred recording the cost of the minecraft server:', error);
    }
}