import PromiseQueue from "./PromiseQueue.js";

export const configQueue = new PromiseQueue({ active: false });

// configQueue.on("fulfil:all", () => {
//   setTimeout(() => {
//     if (configQueue.isFulfilled()) {
//       configQueue.deactivate();
//       conflictQueue.activate();
//     }
//   }, 100);
// });

export const conflictQueue = new PromiseQueue({ active: false });

conflictQueue.on("fulfil:all", () => {
  setTimeout(() => {
    if (conflictQueue.isFulfilled()) {
      conflictQueue.deactivate();
      compileQueue.activate();
    }
  }, 100);
});

export const compileQueue = new PromiseQueue({ active: false });

compileQueue.on("fulfil:all", () => {
  setTimeout(() => {
    if (compileQueue.isFulfilled()) {
      compileQueue.deactivate();
      postCompileQueue.activate();
    }
  }, 100);
});

export const postCompileQueue = new PromiseQueue({ active: false });

postCompileQueue.on("fulfil:all", () => {
  setTimeout(() => {
    if (postCompileQueue.isFulfilled()) {
      postCompileQueue.deactivate();
      conflictQueue.activate();
    }
  }, 100);
});
