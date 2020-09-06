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

        for (const actionName in device.actions) {
            try {
                const action = device.actions[actionName];
                const queue = await action.queue();
                for(const actionexecutor of queue) {
                    console.log('Canceling', actionexecutor.href());
                    await actionexecutor.cancel();
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
})();
