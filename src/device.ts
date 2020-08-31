import { WebThingsClient } from "./webthings-client";
import { IProperty, Property } from "./property";
import { IAction, Action } from "./action";
import { IEvent, Event } from "./event";
import { Link } from "./link";

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

export interface IDevice {
    title: string;
    type: string;
    '@context': string;
    '@type': string[];
    description: string;
    href: string;
    properties: { [key: string]: IProperty };
    actions: { [key: string]: IAction };
    events: { [key: string]: IEvent };
    links: Link[];
    layoutIndex: number;
    selectedCapability: string;
    iconHref?: any;
}

export class Device {
    private device : IDevice;
    private client_ : WebThingsClient;
    private properties_ : { [key: string]: Property } = {};
    private actions_ : { [key: string]: Action } = {};
    private events_ : { [key: string]: Event } = {};
    public connection? : any;
    constructor(device: IDevice, client_: WebThingsClient) {
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
    public serialize() {
        return this.device;
    }
}
