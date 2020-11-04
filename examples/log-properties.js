/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const { WebThingsClient } = require('../lib/webthings-client');

// Create a token at http://[your-gateway]/oauth/authorize?response_type=code&client_id=local-token&scope=/things:readwrite
const token = '';

(async () => {
    const webThingsClient = await WebThingsClient.local(token);
    // const webThingsClient = new WebThingsClient('gateway.local', 80, token);
    const devices = await webThingsClient.getDevices();

    for (const device of devices) {
        console.log(`---${device.description.title}---`);

        for (const propertyName in device.properties) {
            try {
                const property = device.properties[propertyName];
                const value = await property.getValue();
                console.log(`${propertyName}: ${value}`);
            } catch (err) {
                console.error(err);
            }
        }
    }
})();
