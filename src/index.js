#!/usr/bin/env node

import clear from "console-clear";
import fs from "fs";
import { promisify } from "util";
import ffmpeg from "fluent-ffmpeg";
import chokidar from "chokidar";
import path from "path";
import compose from "lodash/fp/compose.js";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-prompt";

import * as answers from "./prompts/answers.js";
import * as prompts from "./prompts/index.js";
import * as notify from "./utility/notify.js";
import * as print from "./utility/print.js";

import { sourceFilesExist, postCompileFlow } from "./utility/files.js";
import { getAnswer } from "./utility/prompts.js";
import { screencastPreset, logger } from "./ffmpeg/index.js";
import { OUTPUT_CONTAINER } from "./config.js";
import {
  configQueue,
  conflictQueue,
  compileQueue,
  postCompileQueue,
} from "./promises/queues.js";

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

inquirer.registerPrompt("autocomplete", autocomplete);

const usrCfg = {
  srcRoot: null,
  srcGlob: null,
  srcDest: null,
  srcWatch: null,
  outRoot: null,
  onCompile: null,
  onConflict: null,
};

(async function run() {
  clear();
  print.intro();

  configQueue.activate();

  // User configuration
  usrCfg.srcRoot = await getAnswer(configQueue.enqueue(prompts.sourceRoot));
  usrCfg.srcGlob = await getAnswer(configQueue.enqueue(prompts.sourceGlob));

  await configQueue.enqueue(() => print.sourceFiles(usrCfg));

  usrCfg.onCompile = await getAnswer(configQueue.enqueue(prompts.onCompile));

  if (usrCfg.onCompile === answers.onCompile.MOVE) {
    usrCfg.srcDest = await getAnswer(configQueue.enqueue(prompts.srcDest));
  }

  usrCfg.srcWatch = await getAnswer(configQueue.enqueue(prompts.sourceWatch));

  if (
    !usrCfg.srcWatch &&
    !(await configQueue.enqueue(() => sourceFilesExist(usrCfg)))
  ) {
    notify.warn("No source files found. Terminating.");
    process.exit();
  }

  usrCfg.outRoot = await getAnswer(configQueue.enqueue(prompts.outputRoot));
  usrCfg.onConflict = await getAnswer(configQueue.enqueue(prompts.onConflict));

  configQueue.deactivate();
  conflictQueue.activate();

  // Chokidar watch
  const watcher = chokidar.watch(path.join(usrCfg.srcRoot, usrCfg.srcGlob), {
    persistent: usrCfg.srcWatch,
    ignored: "**/node_modules/**",
    awaitWriteFinish: true, // polls for file size before emitting
    usePolling: true, // necessary for sub-directory watch
  });

  // For each source file found
  watcher.on("add", async (sourceFile) => {
    const srcFileRel = path.parse(path.relative(usrCfg.srcRoot, sourceFile));

    const outFile = path.join(
      usrCfg.outRoot,
      srcFileRel.dir,
      srcFileRel.name + OUTPUT_CONTAINER
    );

    let onFileConflict;
    if (await exists(outFile)) {
      await conflictQueue.enqueue(() =>
        (async () => {
          notify.warn(
            `${path.relative(usrCfg.outRoot, outFile)} already exists`
          );
          if (usrCfg.onConflict === answers.onConflict.ASK) {
            onFileConflict = await getAnswer(prompts.onFileConflict());
          } else {
            onFileConflict = usrCfg.onConflict;
          }
        })()
      );

      if (onFileConflict === answers.outputFileConflict.LEAVE) {
        return;
      }
    }

    // FFMPEG command
    const command = compose([
      logger(sourceFile, usrCfg),
      screencastPreset,
      ffmpeg,
    ])(sourceFile);

    command.on("end", () => {
      postCompileQueue.enqueue(() => postCompileFlow(sourceFile, usrCfg));
    });

    // ensure directory exists before delegating to FFMPEG
    await mkdir(path.parse(outFile).dir, { recursive: true });

    // Kick off FFMPEG after conflicts resolved
    await compileQueue.enqueue(() => Promise.resolve(command.save(outFile)));
  });
})();
