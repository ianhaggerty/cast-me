import { EventEmitter } from "events";

class Queue extends EventEmitter {
  constructor(...args) {
    super();
    this.array = Array.apply(Array, ...args);
  }

  enqueue(el) {
    this.array.push(el);
    // this.emit("enqueue", el);
  }

  dequeue() {
    const el = this.array.shift();

    // if (el) {
    //   this.emit("dequeue", el);

    //   if (!this.array.length) {
    //     this.emit("empty");
    //   }
    // }

    return el;
  }

  isEmpty() {
    return !this.array.length;
  }
}

export default Queue;
