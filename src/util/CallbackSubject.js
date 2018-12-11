import { Subject } from "rxjs"

export default class CallbackSubject extends Subject {
  constructor() {
    super()
    this.callback = (...args) => this.next(args)
  }
}
