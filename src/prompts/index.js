import inquirer from "inquirer";
import fuzzy from "fuzzy";
import compose from "lodash/fp/compose.js";

import {
  ensureFolder,
  ensureAbsolute,
  stripQuotes,
  removeColors,
  stripTab,
} from "./middleware.js";

import {
  SOURCE_ROOT,
  SOURCE_GLOB,
  SOURCE_MOVE,
  OUTPUT_ROOT,
} from "../store/keys.js";

import * as answers from "./answers.js";

import { PROMPT_ANSWER } from "../config.js";
import { promptMessage } from "../utility/prompts.js";
import { getAnswers, pushAnswer } from "../store/index.js";
import { FgCyan, FgRed } from "../utility/colors.js";

export const sourceRoot = () =>
  ensureFolder(() =>
    ensureAbsolute(persistAutoComplete(SOURCE_ROOT, "Source root directory"))
  );

export const sourceGlob = () =>
  persistAutoComplete(SOURCE_GLOB, "Source glob pattern");

export const sourceWatch = () =>
  inquirer.prompt([
    {
      type: "confirm",
      name: PROMPT_ANSWER,
      message: promptMessage("Watch source files"),
      default: true,
    },
  ]);

export const onCompile = () =>
  inquirer.prompt([
    {
      type: "list",
      name: PROMPT_ANSWER,
      message: promptMessage("After compiling source"),
      choices: Object.values(answers.onCompile),
    },
  ]);

export const onFileCompile = () => {
  return inquirer.prompt([
    {
      type: "list",
      name: PROMPT_ANSWER,
      message: promptMessage(`Choose an action`),
      choices: Object.values(answers.sourceFileCompiled),
    },
  ]);
};

export const srcDest = () =>
  ensureFolder(() =>
    ensureAbsolute(persistAutoComplete(SOURCE_MOVE, "Source move directory"))
  );

export const outputRoot = () =>
  ensureFolder(() =>
    ensureAbsolute(persistAutoComplete(OUTPUT_ROOT, "Output root directory"))
  );

export const onConflict = () =>
  inquirer.prompt([
    {
      type: "list",
      name: PROMPT_ANSWER,
      message: promptMessage(`Output file conflict`),
      choices: Object.values(answers.onConflict),
    },
  ]);

export const onFileConflict = () => {
  return inquirer.prompt([
    {
      type: "list",
      name: PROMPT_ANSWER,
      message: promptMessage(`Choose an action`),
      choices: Object.values(answers.outputFileConflict),
    },
  ]);
};

// Generic Prompts

export const createDirectory = () =>
  inquirer.prompt([
    {
      type: "confirm",
      name: PROMPT_ANSWER,
      message: promptMessage(`Create a new directory`),
      default: false,
    },
  ]);

export const persistAutoComplete = (key, msg) => {
  const prevAnswers = getAnswers(key);
  const prompt = autoComplete(msg, prevAnswers);

  // TODO refactor out middleware
  return compose([stripQuotes, removeColors, stripTab])(prompt).then(
    (response) => {
      pushAnswer(key, response[PROMPT_ANSWER]);
      return response;
    }
  );
};

export const autoComplete = (msg, answers) =>
  inquirer.prompt([
    {
      type: "autocomplete",
      name: PROMPT_ANSWER,
      message: promptMessage(msg),
      source: (_, input) => {
        if (!input) return [];
        return fuzzy
          .filter(input, answers, { pre: FgRed, post: FgCyan })
          .map((el) => el.string);
      },
      suggestOnly: true,
    },
  ]);
