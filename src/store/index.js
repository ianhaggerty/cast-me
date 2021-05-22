import Configstore from "configstore";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import uniq from "lodash/uniq.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")
);
const store = new Configstore(packageJson.name);

export const getAnswers = (key) => store.get(key) || [];
export const pushAnswer = (key, answer) =>
  store.set(key, uniq([...getAnswers(key), answer]));

export default store;
