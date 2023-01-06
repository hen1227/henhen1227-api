import {api} from 'node-app-store-connect-api';

const {read, readAll, create, update, remove}
    // = await api({'issuerId':'71d3c72a-e63f-4709-a72e-b41ec95ab061', 'apiKey':'J9AVQYFM9C'});
    = await api({'issuerId': '71d3c72a-e63f-4709-a72e-b41ec95ab061', 'apiKey': 'B6QM5L5S9L'});

// = await api({'issuerId':'71d3c72a-e63f-4709-a72e-b41ec95ab061', 'apiKey':'HGRV4S3LG3'});


export class AppStoreConnectApi {
    constructor() {
        this.apps = [];
    }

    async reloadApi() {
        const {data: apps} = await readAll('https://api.appstoreconnect.apple.com/v1/apps');
        for (let i = 0; i < apps.length; i++) {
            const app = apps[i];
            let newApp = new App(app.attributes.name, app.links.self);
            newApp.readReviews(await read(app.relationships.customerReviews.links.related));
            this.apps.push(newApp);
        }
    }
}

class App {
    name;
    reviews = [];
    ratings = [];

    constructor(name, link) {
        this.name = name;
        this.link = link;
    }

    readReviews(data) {
        for (let i = 0; i < data.data.length; i++) {
            let review = data.data[i];
            this.reviews.push(review.attributes);
            this.ratings.push(review.attributes.rating);
        }
    }
    1227
    averageRating() {
        let totalRating = 0;
        for (let i = 0; i < this.ratings.length; i++) {
            totalRating += this.ratings[i];
        }
        return totalRating / this.ratings.length;
    }
}

