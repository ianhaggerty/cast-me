/**
 * Run this file to reset persisted data.
 * (suggestions, API tokens, etc)
 */

import * as keys from "./keys";
import store from "./index";

for (const key of keys) {
  store.set(key, undefined);
}
