/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import {WebThingsClient} from './webthings-client';
import {EventEmitter} from 'events';
import {client as WebSocketClient, connection as WebSocketConnection, IMessage} from 'websocket';
import {PropertyDescription, Property} from './property';
import {ActionDescription, Action} from './action';
import {EventDescription, Event} from './event';
import {Link} from './link';
import {EventInstance, EventInstanceDescription} from './event-instance';
import {ActionInstance, ActionInstanceDescription} from './action-instance';
import {hrefFromLinksArray} from './helpers';

export interface DeviceDescription {
    title: string;
    type: string;
    '@context': string;
    '@type': string[];
    description: string;
    href: string;
    properties: { [key: string]: PropertyDescription };
    actions: { [key: string]: ActionDescription };
    events: { [key: string]: EventDescription };
    links: Link[];
    layoutIndex: number;
    selectedCapability: string;
    iconHref?: Record<string, unknown>;
}

export class Device extends EventEmitter {
    public properties: { [key: string]: Property } = {};

    public actions: { [key: string]: Action } = {};

    public events: { [key: string]: Event } = {};

    private connection?: WebSocketConnection;

    constructor(public description: DeviceDescription, public client: WebThingsClient) {
      super();
      for (const propertyName in description.properties) {
        this.properties[propertyName] = new Property(propertyName, description.properties[propertyName], this);
      }
      for (const actionName in description.actions) {
        this.actions[actionName] = new Action(actionName, description.actions[actionName], this);
      }
      for (const eventName in description.events) {
        this.events[eventName] = new Event(eventName, description.events[eventName], this);
      }
    }

    public href(): string {
      return this.description.href;
    }

    public id(): string {
      return this.href().substr(this.href().lastIndexOf('/') + 1);
    }

    public actionsHref(): string {
      return hrefFromLinksArray(this.description.links, 'actions');
    }

    public eventsHref(): string {
      return hrefFromLinksArray(this.description.links, 'events');
    }

    public async eventLog(): Promise<{ [key: string]: EventInstance }[]> {
      const raw = <Record<string, EventInstanceDescription>[]> await this.client.get(this.eventsHref());
      return raw.map((x) => {
        const key = Object.keys(x)[0];
        const value = x[key];
        return {[key]: new EventInstance(value, this.events[key])};
      });
    }

    public async actionQueue(): Promise<{ [key: string]: ActionInstance }[]> {
      const raw = <Record<string, ActionInstanceDescription>[]> await this.client.get(this.actionsHref());
      return raw.map((x) => {
        const key = Object.keys(x)[0];
        const value = x[key];
        return {[key]: new ActionInstance(value, this.actions[key])};
      });
    }

    public async connect(port = 8080): Promise<void> {
      const href = this.href();
      const socketUrl = `ws://${this.client.address}:${port}${href}`;
      const webSocketClient = new WebSocketClient();

      webSocketClient.on('connectFailed', (error: Error) => {
        this.emit('connectFailed', error);
      });

      await new Promise((resolve) => {
        webSocketClient.on('connect', async (connection: WebSocketConnection) => {
          connection.on('error', (error: Error) => {
            this.emit('error', error);
          });

          connection.on('close', () => {
            this.emit('close');
          });

          connection.on('message', (message: IMessage) => {
            if (message.type === 'utf8' && message.utf8Data) {
              const msg = JSON.parse(message.utf8Data);
              this.emit('message', msg.data);
              if ('id' in msg && 'data' in msg) {
                switch (msg.messageType) {
                  case 'propertyStatus':
                    for (const key in msg.data) {
                      const property = this.properties[key];
                      if (!property) {
                        throw Error(`Unknown property ${key}`);
                      }
                      this.emit('propertyChanged', property, msg.data[key]);
                    }
                    break;
                  case 'actionStatus':
                    for (const key in msg.data) {
                      const action = this.actions[key];
                      if (!action) {
                        throw Error(`Unknown action ${key}`);
                      }
                      this.emit('actionTriggered', action, msg.data[key]);
                    }
                    break;
                  case 'event':
                    for (const key in msg.data) {
                      const event = this.events[key];
                      if (!event) {
                        throw Error(`Unknown event ${key}`);
                      }
                      this.emit('eventRaised', event, msg.data[key]);
                    }
                    break;
                  case 'connected':
                    this.emit('connectStateChanged', msg.data);
                    break;
                  case 'thingModified':
                    this.emit('deviceModified', msg.data);
                    break;
                  default:
                    console.warn('Unknown message from device', this.id(), ':', msg.messageType, '(', msg.data, ')');
                }
              }
            }
          });

          this.connection = connection;
          resolve();
        });

        webSocketClient.connect(`${socketUrl}?jwt=${this.client.token}`);
      });
    }

    public async disconnect(): Promise<void> {
      if (!this.connection) {
        throw Error('Socket not connected!');
      }
      this.connection.close();
    }

    public async subscribeEvents(events: { [key: string]: Event }): Promise<void> {
      if (!this.connection) {
        throw Error('Device not connected!');
      }
      const eventdescs: { [key: string]: EventDescription } = {};
      for (const eventName in events) {
        eventdescs[eventName] = events[eventName].description;
      }
      await this.connection.send(JSON.stringify({messageType: 'addEventSubscription', data: eventdescs}));
    }
}
