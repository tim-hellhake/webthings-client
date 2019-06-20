/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const os = require('os');
const express = require('express');
const bodyParser = require('body-parser');
const hueColorLamp = require('./hue-color-lamp.json');

const DEBUG = false;

function debug(log) {
    if (DEBUG) {
        console.log(log);
    }
}

function getIpAddress() {
    const networkInterfaces = os.networkInterfaces();

    for (const name in networkInterfaces) {
        const networkInterface = networkInterfaces[name];

        for (const subInterfaceName in networkInterface) {
            const subInterface = networkInterface[subInterfaceName];

            if (subInterface.family == 'IPv4' && subInterface.internal == false) {
                debug(`Found ip address ${subInterface.address}`);
                return subInterface.address;
            }
        }
    }

    throw 'No ip address found';
}

class HueBridgeEmulator {
    start() {
        this.lights = {};

        const descriptionPath = '/description.xml';
        const prefix = '001788';
        const postfix = '7ebe7d';
        const serialNumber = `${prefix}${postfix}`;
        const bridgeId = `${prefix}FFFE${postfix}`;
        const uuid = `2f402f80-da50-11e1-9b23-${serialNumber}`;
        const ipAddress = getIpAddress();
        const port = 80;

        const app = express();
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        app.use((req, res, next) => {
            debug(`${req.ip} ${req.method} ${req.originalUrl}`);
            next();
        });

        app.get(descriptionPath, (req, res) => {
            res.status(200).send(this.createDescription(ipAddress, port, serialNumber, uuid));
        });

        app.post('/api', (req, res) => {
            const result = [{ success: { username: 'foo' } }];
            res.status(200).contentType('application/json').send(JSON.stringify(result));
        });

        app.get('/api/foo/lights', (req, res) => {
            res.status(200).contentType('application/json').send(JSON.stringify(this.lights));
        });

        app.get('/api/foo/lights/:id', (req, res) => {
            const light = this.lights[req.params.id];

            if (light) {
                res.status(200)
                    .contentType('application/json')
                    .send(JSON.stringify(light));
            } else {
                res.status(404).send();
            }
        });

        app.put('/api/foo/lights/:id/state', (req, res) => {
            const id = req.params.id;
            const light = this.lights[id];
            const state = req.body;
            debug(`Received state change ${JSON.stringify(state)}`);

            if (light) {
                const result = [];

                for (let key in state) {
                    const value = state[key];
                    light.state[key] = value;
                    result.push({ success: { [`/lights/${id}/state/${key}`]: value } });
                }

                res.status(200)
                    .contentType('application/json')
                    .send(JSON.stringify(result));
            } else {
                res.status(404).send();
            }
        });

        const restServer = app.listen(port, () => {
            console.log(`Api is listening on ${restServer.address().address}:${restServer.address().port}`);
        });

        const dgram = require('dgram');
        const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        socket.on('message', (msg, rinfo) => {
            if (msg.indexOf('M-SEARCH') >= 0) {
                debug(`Received M-SEARCH from ${rinfo.address}:${rinfo.port}`);
                const uin = `uuid:${uuid}`;

                socket.send(this.createResponse(ipAddress, port, descriptionPath, bridgeId,
                    'upnp:rootdevice', `${uin}::upnp:rootdevice`
                ), rinfo.port, rinfo.address, (error) => {
                    if (error) {
                        console.error(error);
                    }
                });
                socket.send(this.createResponse(ipAddress, port, descriptionPath, bridgeId,
                    uin, uin
                ), rinfo.port, rinfo.address, (error) => {
                    if (error) {
                        console.error(error);
                    }
                });
                socket.send(this.createResponse(ipAddress, port, descriptionPath, bridgeId,
                    'urn:schemas-upnp-org:device:basic:1', uin
                ), rinfo.port, rinfo.address, (error) => {
                    if (error) {
                        console.error(error);
                    }
                });
            }
        });

        socket.on('listening', () => {
            const address = socket.address();
            console.log(`Discovery is listening on ${address.address}:${address.port}`);
        });

        socket.bind(1900, () => {
            socket.addMembership('239.255.255.250');
        });
    }

    addLight(name) {
        const light = Object.assign({}, hueColorLamp);
        light.name = name;
        const ids = Object.keys(this.lights);
        const lastId = ids.length > 0 ? Math.max.apply(null, ids) + 1 : 0;
        this.lights[lastId] = light;
    }

    createDescription(ip, port, serialNumber, uuid) {
        return `<?xml version='1.0' encoding='UTF-8' ?>
<root xmlns='urn:schemas-upnp-org:device-1-0'>
<specVersion>
<major>1</major>
<minor>0</minor>
</specVersion>
<URLBase>http://${ip}:${port}/</URLBase>
<device>
<deviceType>urn:schemas-upnp-org:device:Basic:1</deviceType>
<friendlyName>Philips hue (${ip})</friendlyName>
<manufacturer>Royal Philips Electronics</manufacturer>
<manufacturerURL>http://www.philips.com</manufacturerURL>
<modelDescription>Philips hue Personal Wireless Lighting</modelDescription>
<modelName>Philips hue bridge 2015</modelName>
<modelNumber>BSB002</modelNumber>
<modelURL>http://www.meethue.com</modelURL>
<serialNumber>${serialNumber}</serialNumber>
<UDN>uuid:${uuid}</UDN>
<presentationURL>index.html</presentationURL>
<iconList>
<icon>
<mimetype>image/png</mimetype>
<height>48</height>
<width>48</width>
<depth>24</depth>
<url>hue_logo_0.png</url>
</icon>
</iconList>
</device>
</root>
    `.replace(new RegExp('\n', 'g'), '\r\n');
    }

    createResponse(ip, port, path, bridgeid, st, usn) {
        return `HTTP/1.1 200 OK
HOST: 239.255.255.250:1900
EXT:
CACHE-CONTROL: max-age=100
LOCATION: http://${ip}:${port}${path}
SERVER: Linux/3.14.0 UPnP/1.0 IpBridge/1.29.0
hue-bridgeid: ${bridgeid}
ST: ${st}
USN: ${usn}
    
    `.replace(new RegExp('\n', 'g'), '\r\n');
    }
}

module.exports = HueBridgeEmulator;
