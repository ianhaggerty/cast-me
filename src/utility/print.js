import chalk from "chalk";
import figlet from "figlet";
import glob from "glob";
import path from "path";
import { promisify } from "util";
import * as notify from "./notify.js";

const globA = promisify(glob);

export const intro = () =>
  console.log(
    chalk.yellow(
      figlet.textSync("cast-me", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 80,
        whitespaceBreak: true,
      })
    )
  );

export const sourceFiles = async ({ srcRoot, srcGlob }) => {
  const files = await globA(path.join(srcRoot, srcGlob), { nodir: true });

  if (files.length) {
    notify.star("Source Files");
    for (const file of files) {
      notify.file(path.relative(srcRoot, file));
    }
  } else {
    notify.warn("No Source Files Found");
  }
};
