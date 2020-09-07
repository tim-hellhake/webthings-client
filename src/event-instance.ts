/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Event } from "./event";

export interface EventInstanceDescription {
    data?: any;
    timestamp: string;
}

export class EventInstance {
    constructor(public description: EventInstanceDescription, public event: Event) {
    }
} 
