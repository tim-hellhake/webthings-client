/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Link } from "./link";
import { Device } from "./device";

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
}
