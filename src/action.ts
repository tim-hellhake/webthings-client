/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Link } from "./link";
import { Device } from "./device";

export interface ActionDescription {
    title: string;
    type: string;
    '@type': string;
    description: string;
    readOnly: boolean;
    links: Link[];
}

export class Action {
    constructor(public name: string, public description: ActionDescription, public device: Device) {
    }
    public async execute(input = {}) {
        await this.device.client.post(this.href(), { [this.name]: { input: input } });
    }
    public href(): string {
        if (this.device.description.links) {
            const actionsLinks = this.device.description.links.filter(link => link.rel === 'actions');

            if (actionsLinks.length > 0) {
                if (actionsLinks.length > 1) {
                    console.warn('Multiple links to action found');
                }

                const link = actionsLinks[0];

                if (link.href) {
                    return link.href;
                } else {
                    throw Error('Actions link has no href')
                }
            } else {
                throw Error('Device has no link to actions');
            }
        }

        throw Error('Device has no links');
    }
}
