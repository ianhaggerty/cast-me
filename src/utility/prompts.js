import chalk from "chalk";
import { PADDING_AMOUNT, PADDING_CHAR, PROMPT_ANSWER } from "../config.js";

export const promptMessage = (msg) =>
  (chalk.inverse(msg) + " ").padEnd(PADDING_AMOUNT, PADDING_CHAR);

export const getAnswer = async (prompt) => {
  return prompt.then((response) => response[PROMPT_ANSWER]);
};
