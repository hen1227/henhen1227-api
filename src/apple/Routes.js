//MARK: APP STORE API

// let appStoreApi = new AppStoreConnectApi();
// appStoreApi.reloadApi().then();
// let lastAppStoreUpdate = Date.now();
// updateAppStore();
// setInterval(updateAppStore, 4  * 60 * 60 * 1000);
// function updateAppStore(){
//     appStoreApi.reloadApi().then();
//
//     const today = new Date();
//     lastAppStoreUpdate = String(today.getMonth()+1) + '-' + String(today.getDate()) + '-' + today.getFullYear() + ' ' + String(today.getHours()) + ":" + String(today.getMinutes()) + ":" + String(today.getSeconds()).padStart(2, '0');
//
//     console.log(lastAppStoreUpdate);
// }
//
// app.get('/appstore/apps', (req, res) => {
//     res.send({
//         "data" : appStoreApi.apps,
//         "lastUpdate" : lastAppStoreUpdate,
//     });
// });