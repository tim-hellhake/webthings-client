/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Link } from "./link";
import { Device } from "./device";
import { Property } from "./property";
import { ActionInstance, ActionInstanceDescription } from "./action-instance";
import { hrefFromLinksArray } from "./helpers";

export interface ActionDescription {
    title: string;
    type: string;
    '@type': string;
    description: string;
    readOnly: boolean;
    links: Link[];
    input: { [key: string]: Property }
}

export class Action {
    constructor(public name: string, public description: ActionDescription, public device: Device) {
    }
    public async execute(input = {}): Promise<ActionInstance> {
        const raw: { [key: string]: any } = await this.device.client.post(this.device.actionsHref(), { [this.name]: { input: input } });
        return new ActionInstance(Object.values(raw)[0], this);
    }
    public async queue(): Promise<ActionInstance[]> {
        const raw: { [key: string]: ActionInstanceDescription }[] = await this.device.client.get(this.href());
        return raw.map(x => new ActionInstance(Object.values(x)[0], this));
    }
    public href(): string {
        return hrefFromLinksArray(this.description.links, 'action');
    }
}
