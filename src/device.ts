/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

export interface Device {
    title: string;
    type: string;
    '@context': string;
    '@type': string[];
    description: string;
    href: string;
    properties: { [key: string]: Property };
    actions: { [key: string]: Action };
    events: { [key: string]: Event };
    links: Link[];
    layoutIndex: number;
    selectedCapability: string;
    iconHref?: any;
}

export interface Property {
    title: string;
    type: string;
    '@type': string;
    unit: string;
    description: string;
    minimum: number;
    maximum: number;
    readOnly: boolean;
    multipleOf: number;
    links: Link[];
}

export interface Action {
    title: string;
    type: string;
    '@type': string;
    description: string;
    readOnly: boolean;
    links: Link[];
}

export interface Event {
}

export interface Link {
    rel: string;
    href: string;
}
