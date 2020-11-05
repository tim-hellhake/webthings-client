/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import {Link} from './link';

export function hrefFromLinksArray(links: Link[], rel: string): string {
  if (links) {
    const actionLinks = links.filter((link) => link.rel === rel);

    if (actionLinks.length > 0) {
      if (actionLinks.length > 1) {
        console.warn(`Multiple links to ${rel} found`);
      }

      const link = actionLinks[0];

      if (link.href) {
        return link.href;
      } else {
        throw Error(`${rel} link has no href`);
      }
    } else {
      throw Error(`${rel} has no link to ${rel}`);
    }
  }

  throw Error(`${rel} has no links`);
}
