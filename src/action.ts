import { Link } from "./link";
import { Device } from "./device";

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

export interface ActionDescription {
    title: string;
    type: string;
    '@type': string;
    description: string;
    readOnly: boolean;
    links: Link[];
}

export class Action {
    private name_ : string;
    private action : ActionDescription;
    private device_ : Device;
    constructor(name_: string, action: ActionDescription, device_: Device) {
        this.name_ = name_;
        this.action = action;
        this.device_ = device_;
    }
    public get title() {
        return this.action.title;
    }
    public get type() {
        return this.action.type;
    }
    public get '@type'() {
        return this.action['@type'];
    }
    public get description() {
        return this.action.description;
    }
    public get readOnly() {
        return this.action.readOnly;
    }
    public get links() {
        return this.action.links;
    }
    public get name() {
        return this.name_;
    }
    public get device() {
        return this.device_;
    }
    public serialize() {
        return this.action;
    }
    public async execute(input = {}) {
        await this.device.client.post(this.actionHref, {[this.name]: {input: input}});
    }
    private get actionHref(): string {
        if (this.device.links) {
            const actionsLinks = this.device.links.filter(link => link.rel === 'actions');

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
