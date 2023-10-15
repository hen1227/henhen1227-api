import jwt from "jsonwebtoken";
import fs from "fs";

export async function getDownloadCount() {
    const keyId = process.env.APPLE_KEY_ID;
    const issuerId = process.env.APPLE_ISSUER_ID;
    const vendorId = process.env.APPLE_VENDOR_ID;


    console.log("Getting download count")
    console.log(issuerId)
    console.log(keyId)
    console.log(vendorId)

    // Path to the API Key file in .secrets
    const keyFilePath = `.secrets/AuthKey_${keyId}.p8`;

    try {
        let now = Math.round((new Date()).getTime() / 1000); // Notice the /1000
        let nowPlus20 = now + 1199 // 1200 === 20 minutes


        // Read API key from file
        const apiKey = fs.readFileSync(keyFilePath, 'utf8');

        // Generate JWT token
        const token = jwt.sign(
            {
                'iss': issuerId,
                'exp': nowPlus20,
                'aud': 'appstoreconnect-v1'
            },
            apiKey,
            {
                algorithm: 'ES256',
                header: {
                    alg: 'ES256',
                    kid: keyId,
                    typ: 'JWT'
                }
            }
        );

        // App Store Connect API URL
        const apiUrl = 'https://api.appstoreconnect.apple.com/v1/salesReports';
        const queryParameters = '?filter[frequency]=YEARLY&filter[reportType]=SALES&filter[reportSubType]=SUMMARY&filter[vendorNumber]='+vendorId;

        const response = await fetch(apiUrl + queryParameters, {
            method: 'GET',
            headers: {
                'Accept': 'application/a-gzip',
                'Authorization': `Bearer ${token}`,
            }
        });

        console.log(response.body);

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        return [0];

    } catch (error) {
        console.error('Failed to fetch download count:', error);
        return null;
    }
}
