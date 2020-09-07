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

        const allActions = await device.actionQueue();
        if (allActions.length == 0) {
            console.log('Action queue empty');
            continue;
        }
        const latest = Object.values(allActions[allActions.length-1])[0];
        console.log('Latest action:', `${latest.action.name} ${JSON.stringify(latest.description.input)} ${latest.description.timeRequested} ${latest.description.status}`);

        for (const actionName in device.actions) {
            try {
                const action = device.actions[actionName];
                const queue = await action.queue();
                console.log(actionName, queue.map(x => `${JSON.stringify(x.description.input)} ${x.description.timeRequested} ${x.description.status}`));
            } catch (err) {
                console.error(err);
            }
        }
    }
})();
