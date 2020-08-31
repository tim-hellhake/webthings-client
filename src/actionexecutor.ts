import { Action } from "./action";

/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

export interface ActionExecutorDescription {
    input: {[key: string]: any};
    href: string;
    status: string;
    timeRequested?: string;
    timeCompleted?: string;
}

export class ActionExecutor {
    constructor(public description: ActionExecutorDescription, public action: Action) {
    }
    async update() {
        this.description = await this.action.device.client.get(this.href());
    }
    async cancel() {
        await this.action.device.client.delete(this.href());
    }
    public href() {
        return this.description.href;
    }
}