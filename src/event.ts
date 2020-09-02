import { Link } from "./link";
import { Device } from "./device";

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

export interface EventDescription {
    title: string;
    description: string;
    type: string;
    input: any;
    links: Link[];
}

export class Event {
    private name_ : string;
    private event : EventDescription;
    private device_ : Device;
    constructor(name_: string, event: EventDescription, device_: Device) {
        this.name_ = name_;
        this.event = event;
        this.device_ = device_;
    }
    public get title() {
        return this.event.title;
    }
    public get description() {
        return this.event.description;
    }
    public get type() {
        return this.event.type;
    }
    public get input() {
        return this.event.input;
    }
    public get links() {
        return this.event.links;
    }
    public get name() {
        return this.name_;
    }
    public get device() {
        return this.device_;
    }
    public serialize() {
        return this.event;
    }
}
