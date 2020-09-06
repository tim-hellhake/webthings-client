/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Link } from "./link";
import { Device } from "./device";

export interface PropertyDescription {
    title: string;
    type: string;
    '@type': string[];
    unit: string;
    description: string;
    minimum: number;
    maximum: number;
    readOnly: boolean;
    multipleOf: number;
    links: Link[];
}

export class Property {
    constructor(public name: string, public description: PropertyDescription, public device: Device) {
    }
    public async getValue(): Promise<any> {
        const wrapper = await this.device.client.get(this.href());
        return wrapper[this.name];
    }
    public async setValue(value: any) {
        const wrapper = { [this.name]: value };
        return this.device.client.put(this.href(), wrapper);
    }
    public href(): string {
        if (this.description.links) {
            const propertyLinks = this.description.links.filter(link => link.rel === 'property');

            if (propertyLinks.length > 0) {
                if (propertyLinks.length > 1) {
                    console.warn('Multiple links to property found');
                }

                const link = propertyLinks[0];

                if (link.href) {
                    return link.href;
                } else {
                    throw Error('Property link has no href')
                }
            } else {
                throw Error('Property has no link to property');
            }
        }
        throw Error('Property has no links');
    }
}
