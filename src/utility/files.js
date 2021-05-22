import glob from "glob";
import fs from "fs";
import path from "path";

import * as prompts from "../prompts/index.js";
import * as answers from "../prompts/answers.js";
import * as notify from "./notify.js";

import { getAnswer } from "./prompts.js";
import { promisify } from "util";

const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);
const mkdir = promisify(fs.mkdir);
const globA = promisify(glob);

export const postCompileFlow = async (
  srcFile,
  { srcRoot, srcDest, onCompile, onConflict }
) => {
  const sourceFileRel = path.relative(srcRoot, srcFile);
  notify.event(`${sourceFileRel} has been compiled`);
  const action =
    onConflict === answers.onCompile.ASK
      ? await getAnswer(prompts.onFileCompile())
      : onCompile;

  let outFile;
  switch (action) {
    case answers.onCompile.MOVE:
      if (!srcDest) {
        srcDest = await getAnswer(prompts.srcDest());
      }
      outFile = path.join(srcDest, path.relative(srcRoot, srcFile));
      await mkdir(path.parse(outFile).dir, { recursive: true });
      await rename(srcFile, outFile);
      break;
    case answers.onCompile.DELETE:
      await unlink(srcFile);
      break;
    default:
      break;
  }
  return;
};

export const sourceFilesExist = async ({ srcRoot, srcGlob }) => {
  const files = await globA(path.join(srcRoot, srcGlob), { nodir: true });
  return !!files.length;
};
