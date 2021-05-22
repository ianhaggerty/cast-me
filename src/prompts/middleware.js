import path from "path";
import fs from "fs";
import { promisify } from "util";

import * as prompts from "./index.js";
import { PROMPT_ANSWER } from "../config.js";
import * as colors from "../utility/colors.js";
import * as notify from "../utility/notify.js";

const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

export const removeColors = (prompt) =>
  prompt.then((response) => {
    response[PROMPT_ANSWER] = colors.removeColors(response[PROMPT_ANSWER]);
    return response;
  });

export const stripQuotes = (prompt) =>
  prompt.then((response) => {
    response[PROMPT_ANSWER].replace(/['"]+/g, "");
    return response;
  });

export const stripTab = (prompt) =>
  prompt.then((response) => {
    response[PROMPT_ANSWER].replace("\t", "");
    return response;
  });

export const ensureAbsolute = (prompt) =>
  prompt.then((response) => {
    if (!path.isAbsolute(response[PROMPT_ANSWER])) {
      response[PROMPT_ANSWER] = path.join(
        process.cwd(),
        response[PROMPT_ANSWER]
      );
    }

    return response;
  });

export const ensureFolder = async (getPrompt) => {
  // will contain an absolute path
  const response = await getPrompt();

  let stats;
  try {
    stats = await stat(response[PROMPT_ANSWER]);

    if (!stats.isDirectory()) {
      // absolute path exists, but is not a directory
      notify.warn(`The file ${response[PROMPT_ANSWER]} already exists.`);
      // prompt the user for a new directory
      return ensureFolder(getPrompt);
    }
  } catch (err) {
    if (!stats) {
      // absolute path does not exist
      // prompt user to create a new directory
      const confirm = await prompts.createDirectory();

      if (!confirm[PROMPT_ANSWER]) {
        // user entered no, ask for a new directory
        return ensureFolder(getPrompt);
      } else {
        // recursively create the directory
        await mkdir(response[PROMPT_ANSWER], {
          recursive: true,
        });
      }
    }
  }

  return response;
};
