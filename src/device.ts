/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { WebThingsClient } from "./webthings-client";
import { EventEmitter } from "events";
import { client as WebSocketClient } from "websocket";
import { PropertyDescription, Property } from "./property";
import { ActionDescription, Action } from "./action";
import { EventDescription, Event } from "./event";
import { Link } from "./link";

export interface DeviceDescription {
    title: string;
    type: string;
    '@context': string;
    '@type': string[];
    description: string;
    href: string;
    properties: { [key: string]: PropertyDescription };
    actions: { [key: string]: ActionDescription };
    events: { [key: string]: EventDescription };
    links: Link[];
    layoutIndex: number;
    selectedCapability: string;
    iconHref?: any;
}

export class Device extends EventEmitter {
    public properties: { [key: string]: Property } = {};
    public actions: { [key: string]: Action } = {};
    public events: { [key: string]: Event } = {};
    public connection?: any;
    constructor(public description: DeviceDescription, public client: WebThingsClient) {
        super();
        for (const propertyName in description.properties) {
            this.properties[propertyName] = new Property(propertyName, description.properties[propertyName], this);
        }
        for (const actionName in description.actions) {
            this.actions[actionName] = new Action(actionName, description.actions[actionName], this);
        }
        for (const eventName in description.events) {
            this.events[eventName] = new Event(eventName, description.events[eventName], this);
        }
    }
    public href(): string {
        return this.description.href;
    }
    public id(): string {
        return this.href().substr(this.href().lastIndexOf('/') + 1);
    }
    public async connect(port = 8080) {
        const href = this.href();
        const thingUrl = `ws://localhost:${port}${href}`;
        const webSocketClient = new WebSocketClient();

        webSocketClient.on('connectFailed', (error: any) => {
            this.emit('connectFailed', error);
        });

        await new Promise((resolve) => {
            webSocketClient.on('connect', async (connection: any) => {
                connection.on('error', (error: any) => {
                    this.emit('error', error);
                });

                connection.on('close', () => {
                    this.emit('close');
                });

                connection.on('message', (message: any) => {
                    if (message.type === 'utf8' && message.utf8Data) {
                        const msg = JSON.parse(message.utf8Data);
                        this.emit('message', msg.data);
                        if (msg.id && msg.data) {
                            switch (msg.messageType) {
                                case 'propertyStatus':
                                    for (const key in msg.data) {
                                        const property = this.properties[key];
                                        if (!property)
                                            throw Error(`Unknown property ${key}`);
                                        this.emit('propertyChanged', property, msg.data[key]);
                                    }
                                    break;
                                case 'actionStatus':
                                    for (const key in msg.data) {
                                        const action = this.actions[key];
                                        if (!action)
                                            throw Error(`Unknown action ${key}`);
                                        this.emit('actionTriggered', action, msg.data[key]);
                                    }
                                    break;
                                case 'event':
                                    for (const key in msg.data) {
                                        const event = this.events[key];
                                        if (!event)
                                            throw Error(`Unknown event ${key}`);
                                        this.emit('eventRaised', event, msg.data[key]);
                                    }
                                    break;
                                case 'connected':
                                    this.emit('connectStateChanged', msg.data);
                                    break;
                                default:
                                    console.warn('Unknown message from device', this.id, ':', msg.messageType, '(', msg.data, ')');
                            }
                        }
                    }
                });

                this.connection = connection;
                resolve();
            });

            webSocketClient.connect(`${thingUrl}?jwt=${this.client.token}`);
        });
    }
    public async subscribeEvents(events: { [key: string]: Event }) {
        if (!this.connection) {
            throw Error('Device not connected!');
        }
        const eventdescs: { [key: string]: EventDescription } = {};
        for (const eventName in events) {
            eventdescs[eventName] = events[eventName].description;
        }
        await this.connection.send(JSON.stringify({ messageType: 'addEventSubscription', data: eventdescs }));
    }
}
