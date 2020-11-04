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

    webThingsClient.on('connectFailed', (device_id) => {
        console.log(device_id, ':', 'Failed to connect');
    });
    webThingsClient.on('error', (error) => {
        console.log('Something went wrong', error);
    });
    webThingsClient.on('close', () => {
        console.log('Connection closed');
    });
    webThingsClient.on('propertyChanged', (device_id, property_name, value) => {
        console.log(device_id, ':', `Property ${property_name} changed to ${value}`);
    });
    webThingsClient.on('actionTriggered', (device_id, action_name, info) => {
        console.log(device_id, ':', `Action ${action_name} triggered with input ${JSON.stringify(info.input)}`);
    });
    webThingsClient.on('eventRaised', (device_id, event_name, info) => {
        console.log(device_id, ':', `Event ${event_name} raised: ${info.data}`);
    });
    webThingsClient.on('connectStateChanged', (device_id, state) => {
        console.log(device_id, ':', state ? 'connected' : 'disconnected');
    });
    webThingsClient.on('deviceModified', (device_id) => {
        console.log(device_id, ':', 'modified');
    });
    webThingsClient.on('deviceAdded', async (device_id) => {
        console.log(device_id, ':', 'added');
        const device = await webThingsClient.getDevice(device_id);
        await webThingsClient.subscribeEvents(device, device.events);
        console.log(device.id(), ':', 'Subscribed to all events');
    });
    webThingsClient.on('deviceRemoved', (device_id) => {
        console.log(device_id, ':', 'removed');
    });
    webThingsClient.on('pair', (info) => {
        console.log('pair', info.status);
    });
    
    await webThingsClient.connect();
    setTimeout(async () => {
        const devices = await webThingsClient.getDevices();
        for (const device of devices) {
            await webThingsClient.subscribeEvents(device, device.events);
            console.log(device.id(), ':', 'Subscribed to all events');
        }
    }, 100);
})();