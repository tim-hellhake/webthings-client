import { WebThingsClient } from "./webthings-client";
import { EventEmitter } from "events";
import { client as WebSocketClient } from "websocket";
import { PropertyDescription, Property } from "./property";
import { ActionDescription, Action } from "./action";
import { EventDescription, Event } from "./event";
import { Link } from "./link";

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

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
    private device : DeviceDescription;
    private client_ : WebThingsClient;
    private properties_ : { [key: string]: Property } = {};
    private actions_ : { [key: string]: Action } = {};
    private events_ : { [key: string]: Event } = {};
    public connection? : any;
    constructor(device: DeviceDescription, client_: WebThingsClient) {
        super();
        this.device = device;
        this.client_ = client_;
        for (const propertyName in device.properties) {
            this.properties_[propertyName] = new Property(propertyName, device.properties[propertyName], this);
        }
        for (const actionName in device.actions) {
            this.actions_[actionName] = new Action(actionName, device.actions[actionName], this);
        }
        for (const eventName in device.events) {
            this.events_[eventName] = new Event(eventName, device.events[eventName], this);
        }
    }
    public get title () {
        return this.device.title;
    }
    public get type () {
        return this.device.type;
    }
    public get '@context' () {
        return this.device['@context'];
    }
    public get '@type' () {
        return this.device['@type'];
    }
    public get description () {
        return this.device.description;
    }
    public get href () {
        return this.device.href;
    }
    public get properties () {
        return this.properties_;
    }
    public get actions () {
        return this.actions_;
    }
    public get events () {
        return this.events_;
    }
    public get links () {
        return this.device.links;
    }
    public get layoutIndex () {
        return this.device.layoutIndex;
    }
    public get selectedCapability () {
        return this.device.selectedCapability;
    }
    public get iconHref () {
        return this.device.iconHref;
    }
    public get client () {
        return this.client_;
    }
    public get id () {
        return this.href.substr(this.href.lastIndexOf('/')+1);
    }
    public serialize() {
        return this.device;
    }
    public async connect(port = 8080) {
        const href = this.href;
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
                    // console.log('gateway message', message);
                    if (message.type === 'utf8' && message.utf8Data) {
                        const msg = JSON.parse(message.utf8Data);
                        this.emit('message', msg.data);
                        if (msg.id && msg.data) {
                            switch (msg.messageType) {
                                case 'propertyStatus':
                                    for (const key in msg.data)
                                        this.emit('propertyChanged', this.properties[key], msg.data[key]);
                                    break;
                                case 'actionStatus':
                                    for (const key in msg.data)
                                        this.emit('actionTriggered', this.actions[key], msg.data[key]);
                                    break;
                                case 'event':
                                    for (const key in msg.data)
                                        this.emit('eventRaised', this.events[key], msg.data[key]);
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
    public async subscribeEvents(events: {[key: string]: Event}) {
        if (!this.connection) {
            throw Error('Device not connected!');
        }
        const eventdescs: {[key: string]: EventDescription} = {};
        for (const eventName in events) {
            eventdescs[eventName] = events[eventName].serialize();
        }
        await this.connection.send(JSON.stringify({messageType: 'addEventSubscription', data: eventdescs}));
    }
}
