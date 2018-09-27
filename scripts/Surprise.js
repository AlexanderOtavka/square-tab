const Surprise = new class {
  constructor() {
    const images = [
      {
        url: "../images/surprise/hello-there.jpg",
        greeting: "Hello There"
      },
      {
        url: "../images/surprise/fine-addition.jpg",
        greeting: "A fine addition to my collection"
      },
      {
        url: "../images/surprise/reeee.jpg",
        greeting: "REEEEEEEEEE!"
      },
      {
        url: "../images/surprise/good-trick.jpg",
        greeting: "That's a good trick"
      },
      {
        url: "../images/surprise/the-senate.jpg",
        greeting: "I am The Senate"
      },
      {
        url: "../images/surprise/tragedy.jpg",
        greeting:
          "Have you ever heard the Tragedy of Darth Plagueis " + '"The Wise"?'
      },
      {
        url: "../images/surprise/treason.jpg",
        greeting: "It's treason then"
      },
      {
        url: "../images/surprise/high-ground.jpg",
        greeting: "Don't try it, Anakin"
      }
    ]

    this.initialImageData = {
      url: "../images/surprise/surprise-to-be-sure.jpg",
      greeting: "...but a welcome one."
    }

    this.currentImageData = images[Math.floor(Math.random() * images.length)]
  }

  /**
   * @returns {boolean} true when we are in the first week of April
   */
  get isTime() {
    const now = new Date()
    return now.getMonth() === 3 && now.getDate() < 7
  }
}()

window.Surprise = Surprise
