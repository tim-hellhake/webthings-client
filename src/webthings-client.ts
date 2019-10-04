/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import fetch from 'node-fetch';
import { Device, Property } from './device';

export class WebThingsClient {
    constructor(private address: string, private port: number, private token: string) {
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

    private async get(path: String) {
        const response = await fetch(`http://${this.address}:${this.port}${path}`, {
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
        const response = await fetch(`http://${this.address}:${this.port}${path}`, {
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
}
