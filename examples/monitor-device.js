/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const { WebThingsClient } = require('../lib/webthings-client');

// Create a token at http://[your-gateway]/oauth/authorize?response_type=code&client_id=local-token&scope=/things:readwrite
const token = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjA1ZDUyNTRjLTY1NGMtNGJkYy1hNmZhLTk4YTJjYzkxOTdmNSJ9.eyJyb2xlIjoidXNlcl90b2tlbiIsImlhdCI6MTU5MTM2NDkzMiwiaXNzIjoiaHR0cHM6Ly9teXBlcnNvbmFscmVjeWNsZWJpbi5tb3ppbGxhLWlvdC5vcmcifQ.RmqDrcQESSHyIRa9K2ZuZ5GIBuc-q88XlzLPajI-iUVv6R-3Amb3_AQ8-g6Bp5Iw9fJsiUPGqSxsjg9TGXFGsw';

(async () => {
    const webThingsClient = await WebThingsClient.local(token);
    const devices = await webThingsClient.getDevices();

    for (const device of devices) {
        device.on('connectFailed', () => {
            console.log(device.title, ':', 'Failed to connect');
        });
        device.on('error', (error) => {
            console.log(device.title, ':', 'Something went wrong', error);
        });
        device.on('close', () => {
            console.log(device.title, ':', 'Connection closed');
        });
        device.on('propertyChanged', (property, value) => {
            console.log(device.title, ':', `Property ${property.name} changed to ${value}`);
        });
        device.on('actionTriggered', (action, info) => {
            console.log(device.title, ':', `Action ${action.name} triggered with input ${JSON.stringify(info.input)}`);
        });
        device.on('eventRaised', (action, info) => {
            console.log(device.title, ':', `Event ${action.name} raised: ${info.data}`);
        });
        device.on('connectStateChanged', (state) => {
            console.log(device.title, ':', device.id, state ? 'connected' : 'disconnected');
        });
        device.connect().then(() => {
            setTimeout(async () => {
                await device.subscribeEvents(device.events);
                console.log(device.title, ':', 'Subscribed to all events');
            }, 100);
        });
    }
})();
