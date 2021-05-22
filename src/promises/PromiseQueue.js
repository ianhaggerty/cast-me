import Queue from "./Queue.js";

/**
 * A queue of promises. Resolved in sequence - FIFO.
 */
class PromiseQueue extends Queue {
  constructor({ active = true }) {
    super();
    this.resolving = false;
    this.isActive = active;
  }

  isFulfilled() {
    return this.isEmpty() && !this.resolving;
  }

  activate() {
    this.isActive = true;

    if (this.isFulfilled()) {
      this.emit("fulfil:all");
    } else {
      this.dequeue();
    }
  }

  deactivate() {
    this.isActive = false;
  }

  enqueue(promiseFn) {
    return new Promise((resolve, reject) => {
      super.enqueue({
        promise: promiseFn,
        resolve,
        reject,
      });

      this.dequeue();
    });
  }

  dequeue() {
    if (this.resolving || !this.isActive) {
      return false;
    }
    const item = super.dequeue();
    if (!item) {
      return false;
    }
    this.resolving = true;
    item
      .promise()
      .then((value) => {
        this.resolving = false;
        item.resolve(value);

        if (this.isEmpty()) {
          this.emit("fulfil:all");
        } else {
          this.dequeue();
        }
      })
      .catch((err) => {
        this.resolving = false;
        item.reject(err);

        if (this.isEmpty()) {
          this.emit("fulfil:all");
        } else {
          this.dequeue();
        }
      });
    return true;
  }
}

export default PromiseQueue;
