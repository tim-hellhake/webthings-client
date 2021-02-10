/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import {Action} from './action';

export interface ActionInstanceDescription {
    input: Record<string, unknown>;
    href: string;
    status: string;
    timeRequested?: string;
    timeCompleted?: string;
}

export class ActionInstance {
  // eslint-disable-next-line no-unused-vars
  constructor(public description: ActionInstanceDescription, public action: Action) {
  }

  async update(): Promise<void> {
    this.description = <ActionInstanceDescription> await this.action.device.client.get(this.href());
  }

  async cancel(): Promise<void> {
    await this.action.device.client.delete(this.href());
  }

  public href(): string {
    return this.description.href;
  }
}
