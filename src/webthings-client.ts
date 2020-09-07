/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import fetch, { RequestInit } from 'node-fetch';
import { Device, DeviceDescription } from './device';
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

    constructor(private address: string, private port: number, public token: string, useHttps = false, skipValidation = false) {
        this.protocol = useHttps ? 'https' : 'http';

        if (skipValidation) {
            this.fetchOptions = {
                agent: new Agent({
                    rejectUnauthorized: false
                })
            };
        }
    }

    public async getDevices(): Promise<Device[]> {
        const descriptions: DeviceDescription[] = await this.get('/things');
        return descriptions.map(description => new Device(description, this));
    }

    private async request(method: string, path: string, body: any, args: { [key: string]: any } = {}) {
        const headers: { [key: string]: string } = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.token}`,
        };
        const params = {
            ...this.fetchOptions,
            method: method,
            headers: headers
        }
        if (!args.nobody) {
            headers['Content-Type'] = 'application/json';
            if (args.strbody)
                params.body = body;
            else
                params.body = JSON.stringify(body);
        }
        const response = await fetch(`${this.protocol}://${this.address}:${this.port}${path}`, params);

        if (response.status < 200 || response.status >= 300) {
            throw `${response.status}: ${response.statusText}`;
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.indexOf('application/json') < 0) {
            if (args.expectnocontent)
                return null;
            else
                throw `Content-Type is '${response.headers.get('Content-Type')}' but expected 'application/json'`;
        }

        return await response.json();
    }

    public async get(path: string) {
        return this.request('GET', path, null, { nobody: true });
    }

    public async put(path: string, value: any =  null) {
        return this.request('PUT', path, value);
    }

    public async post(path: string, value: any =  null) {
        return this.request('POST', path, value);
    }

    public async delete(path: string) {
        this.request('DELETE', path, '', { strbody: true, expectnocontent: true });
    }
}