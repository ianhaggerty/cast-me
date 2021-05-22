import chalk from "chalk";
import emoji from "node-emoji";

export const generic = (msg) =>
  console.log(emoji.get("small_blue_diamond") + msg);

export const important = (msg) =>
  console.log(chalk.yellow(emoji.get("fire") + msg));

export const event = (msg) => console.log(chalk.green(emoji.get("bell") + msg));

export const star = (msg) => console.log(chalk.yellow(emoji.get("star") + msg));

export const info = (msg) =>
  console.log(chalk.cyan(emoji.get("newspaper") + msg));

export const warn = (msg) =>
  console.log(chalk.red(emoji.get("exclamation") + msg));

export const progress = (msg) => console.log(emoji.get("hourglass") + msg);

export const file = (msg) =>
  console.log(emoji.get("file_folder") + chalk.cyan(msg));
