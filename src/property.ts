import { Link } from "./link";
import { Device } from "./device";

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

export interface IProperty {
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

export class Property{
    private name_ : string;
    private property : IProperty;
    private device_ : Device;
    constructor(name_: string, property: IProperty, device_: Device) {
        this.name_ = name_;
        this.property = property;
        this.device_ = device_;
    }
    public get title() {
        return this.property.title;
    }
    public get type() {
        return this.property.type;
    }
    public get '@type'() {
        return this.property['@type'];
    }
    public get unit() {
        return this.property.unit;
    }
    public get description() {
        return this.property.description;
    }
    public get minimum() {
        return this.property.minimum;
    }
    public get maximum() {
        return this.property.maximum;
    }
    public get readOnly() {
        return this.property.readOnly;
    }
    public get multipleOf() {
        return this.property.multipleOf;
    }
    public get links() {
        return this.property.links;
    }
    public get name() {
        return this.name_;
    }
    public get device () {
        return this.device_;
    } 
    public serialize() {
        return this.property;
    }
    public async getValue() {
        const wrapper = await this.device.client.get(this.href);
        return wrapper[this.name];
    }
    public async setValue(value: any) {
        const wrapper = { [this.name]: value };
        return this.device.client.put(this.href, wrapper);
    }
    private get href() {
        if (this.links) {
            const propertyLinks = this.links.filter(link => link.rel === 'property');

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
