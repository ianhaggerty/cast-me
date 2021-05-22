import cliProgress from "cli-progress";
import chalk from "chalk";
import path from "path";

import { PADDING_AMOUNT, PADDING_CHAR } from "../config.js";
import { stdout } from "process";
import { compileQueue } from "../promises/queues.js";

export const screencastPreset = (command) =>
  command
    .audioCodec("aac")
    .audioBitrate(128)
    .audioChannels(1)
    .fps(8)
    .videoCodec("libx264")
    .withOptions(["-crf 28"]);

function formatter(options, params, payload) {
  const size = Math.round(params.progress * options.barsize);
  const barComplete = options.barCompleteString.substr(0, size);
  const barIncomplete = options.barCompleteString
    .substr(size)
    .split("")
    .map(() => "_")
    .join("");

  const color = Math.round(params.progress * 100) === 100 ? "green" : "yellow";

  const title = (chalk.bgCyan(payload.name) + " ").padEnd(
    PADDING_AMOUNT - 11,
    PADDING_CHAR
  );
  const progress = chalk[color](Math.round(params.value) + "% ").padEnd(
    20,
    PADDING_CHAR
  );

  return `🔥 ${title} ${progress} [${barComplete}${barIncomplete}]`;
}

const progressBars = {};
let multiBar = null;

const getMultiBar = () =>
  new cliProgress.MultiBar(
    {
      clearOnComplete: true,
      hideCursor: true,
      format: formatter,
    },
    cliProgress.Presets.shades_classic
  );

const clearMultiBar = () => {
  compileQueue.enqueue(() => {
    if (multiBar) {
      multiBar = null;
      stdout.write("\n");
    }
    return Promise.resolve();
  });
};

export const logger = (srcFile, usrCfg) => (command) => {
  const { srcRoot } = usrCfg;
  const srcFileRel = path.relative(srcRoot, srcFile);
  let resolution = null;
  multiBar = multiBar ? multiBar : getMultiBar();

  command.on("start", () => {
    compileQueue.enqueue(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            if (resolution) {
              clearMultiBar();
              resolve();
            } else {
              resolution = resolve;
            }
          }, 100);
        })
    );

    progressBars[srcFileRel] = multiBar.create(100, 0, {
      name: srcFileRel,
    });
  });

  command.on("progress", (progress) => {
    if (!progressBars[srcFileRel]) return;
    progressBars[srcFileRel].update(progress.percent);
  });

  command.on("end", () => {
    if (progressBars[srcFileRel]) {
      progressBars[srcFileRel].update(100);
      progressBars[srcFileRel].stop();
    }

    setTimeout(() => {
      if (resolution) {
        clearMultiBar();
        resolution();
      } else {
        resolution = true;
      }
    }, 100);
  });

  return command;
};
