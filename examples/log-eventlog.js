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
    const devices = await webThingsClient.getDevices();

    for (const device of devices) {
        console.log(`---${device.description.title}---`);

        const allEvents = await device.eventLog();
        if (allEvents.length == 0) {
            console.log('Event log empty');
            continue;
        }
        const latest = Object.values(allEvents[allEvents.length-1])[0];
        console.log('Latest event:', `${latest.event.name} ${JSON.stringify(latest.description.data)} ${latest.description.timestamp}`);

        for (const eventName in device.events) {
            try {
                const event = device.events[eventName];
                const log = await event.log();
                console.log(eventName, log.map(x => `${JSON.stringify(x.description.data)} ${x.description.timestamp}`));
            } catch (err) {
                console.error(err);
            }
        }
    }
})();
