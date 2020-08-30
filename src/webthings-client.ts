/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import fetch, { RequestInit } from 'node-fetch';
import { Device, Property } from './device';
import { Agent } from 'https';

export class WebThingsClient {
    public static async local(token: string) {
        let address = 'localhost';
        let port = 8080;
        let https = false;
        let skipValidation = false;
        console.log(`Probing port ${port}`);
        const response = await fetch(`http://${address}:${port}`, {
            redirect: "manual"
        });

        if (response.headers.get("Location")) {
            port = 4443;
            https = true;
            skipValidation = true;
            console.log(`HTTPS seems to be active, using port ${port} instead`);
        }

        return new WebThingsClient('localhost', port, token, https, skipValidation);
    }

    private protocol: string;
    private fetchOptions: RequestInit = {};

    constructor(private address: string, private port: number, private token: string, useHttps = false, skipValidation = false) {
        this.protocol = useHttps ? 'https' : 'http';

        if (skipValidation) {
            this.fetchOptions = {
                agent: new Agent({
                    rejectUnauthorized: false
                })
            };
        }
    }

    public getDevices(): Promise<Device[]> {
        return this.get('/things');
    }

    public async getProperty(property: Property, propertyName: string) {
        const wrapper = await this.get(this.getPropertyHref(property));
        return wrapper[propertyName];
    }

    public setProperty(property: Property, propertyName: string, value: any) {
        const wrapper = { [propertyName]: value };
        return this.put(this.getPropertyHref(property), wrapper);
    }

    private getPropertyHref(property: Property): string {
        if (property.links) {
            const propertyLinks = property.links.filter(link => link.rel === 'property');

            if (propertyLinks.length > 0) {
                if (propertyLinks.length > 1) {
                    console.warn('Multiple links to property found');
                }

                const link = propertyLinks[0];

                if (link.href) {
                    return link.href;
                } else {
                    console.warn('Property link has no href')
                }
            } else {
                console.warn('Property has no link to property');
            }
        }

        return '';
    }

    public async executeAction(device: Device, actionName: string, input: {} = {}) {
        await this.post(this.getActionsHref(device), {[actionName]: {input: input}});
    }

    private getActionsHref(device: Device): string {
        if (device.links) {
            const actionsLinks = device.links.filter(link => link.rel === 'actions');

            if (actionsLinks.length > 0) {
                if (actionsLinks.length > 1) {
                    console.warn('Multiple links to action found');
                }

                const link = actionsLinks[0];

                if (link.href) {
                    return link.href;
                } else {
                    console.warn('Actions link has no href')
                }
            } else {
                console.warn('Device has no link to actions');
            }
        }

        return '';
    }

    private async get(path: String) {
        const response = await fetch(`${this.protocol}://${this.address}:${this.port}${path}`, {
            ...this.fetchOptions,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            }
        });

        if (response.status !== 200) {
            throw `${response.status}: ${response.statusText}`;
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.indexOf('application/json') < 0) {
            throw `Content-Type is '${response.headers.get('Content-Type')}' but expected 'application/json'`;
        }

        return await response.json();
    }

    private async put(path: String, value: {}) {
        const response = await fetch(`${this.protocol}://${this.address}:${this.port}${path}`, {
            ...this.fetchOptions,
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(value)
        });

        if (response.status !== 200) {
            throw `${response.status}: ${response.statusText}`;
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.indexOf('application/json') < 0) {
            throw `Content-Type is '${response.headers.get('Content-Type')}' but expected 'application/json'`;
        }

        return await response.json();
    }

    private async post(path: String, value: {}) {
        const response = await fetch(`${this.protocol}://${this.address}:${this.port}${path}`, {
            ...this.fetchOptions,
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(value)
        });

        if (response.status < 200 || response.status >= 300) {
            throw `${response.status}: ${response.statusText}`;
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.indexOf('application/json') < 0) {
            throw `Content-Type is '${response.headers.get('Content-Type')}' but expected 'application/json'`;
        }

        return await response.json();
    }
}
