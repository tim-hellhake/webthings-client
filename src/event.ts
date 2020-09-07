/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Link } from "./link";
import { Device } from "./device";
import { EventInstance, EventInstanceDescription } from "./event-instance";
import { hrefFromLinksArray } from "./helpers";

export interface EventDescription {
    title: string;
    description: string;
    type: string;
    input: any;
    links: Link[];
}

export class Event {
    constructor(public name: string, public description: EventDescription, public device: Device) {
    }
    public async log(): Promise<EventInstance[]> {
        const raw: { [key: string]: EventInstanceDescription }[] = await this.device.client.get(this.href());
        return raw.map(x => new EventInstance(Object.values(x)[0], this));
    }
    public href(): string {
        return hrefFromLinksArray(this.description.links, 'event');
    }
}
