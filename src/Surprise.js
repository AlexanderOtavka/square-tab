const images = [
  {
    url: "/public/images/surprise/hello-there.jpg",
    greeting: "Hello There"
  },
  {
    url: "/public/images/surprise/fine-addition.jpg",
    greeting: "A fine addition to my collection"
  },
  {
    url: "/public/images/surprise/reeee.jpg",
    greeting: "REEEEEEEEEE!"
  },
  {
    url: "/public/images/surprise/good-trick.jpg",
    greeting: "That's a good trick"
  },
  {
    url: "/public/images/surprise/the-senate.jpg",
    greeting: "I am The Senate"
  },
  {
    url: "/public/images/surprise/tragedy.jpg",
    greeting:
      "Have you ever heard the Tragedy of Darth Plagueis " + '"The Wise"?'
  },
  {
    url: "/public/images/surprise/treason.jpg",
    greeting: "It's treason then"
  },
  {
    url: "/public/images/surprise/high-ground.jpg",
    greeting: "Don't try it, Anakin"
  }
]

export const initialImageData = {
  url: "/public/images/surprise/surprise-to-be-sure.jpg",
  greeting: "...but a welcome one."
}

export const currentImageData =
  images[Math.floor(Math.random() * images.length)]

/**
 * @returns {boolean} true when we are in the first week of April
 */
export function isTime() {
  const now = new Date()
  return now.getMonth() === 3 && now.getDate() < 7
}
