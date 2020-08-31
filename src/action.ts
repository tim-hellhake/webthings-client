/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Link } from "./link";
import { Device } from "./device";
import { Property } from "./property";
import { ActionExecutor, ActionExecutorDescription } from "./actionexecutor";

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
    public async execute(input = {}): Promise<ActionExecutor> {
        const raw: { [key: string]: any } = await this.device.client.post(this.device.actionsHref(), { [this.name]: { input: input } });
        return new ActionExecutor(Object.values(raw)[0], this);
    }
    public async queue(): Promise<ActionExecutor[]> {
        const raw = await this.device.client.get(this.href());
        if (raw.length == 0) 
            return [];
        return raw.map((x: { [key: string]: ActionExecutorDescription }) => new ActionExecutor(Object.values(x)[0], this));
    }
    public href(): string {
        if (this.description.links) {
            const actionLinks = this.description.links.filter(link => link.rel === 'action');

            if (actionLinks.length > 0) {
                if (actionLinks.length > 1) {
                    console.warn('Multiple links to action found');
                }

                const link = actionLinks[0];

                if (link.href) {
                    return link.href;
                } else {
                    throw Error('Action link has no href')
                }
            } else {
                throw Error('Action has no link to actions');
            }
        }

        throw Error('Action has no links');
    }
}