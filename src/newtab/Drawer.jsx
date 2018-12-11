import React, { useCallback } from "react"
import classnames from "classnames"

import styles from "./Drawer.css"

const modeToClassName = mode => {
  switch (mode) {
    case "toggleOpen":
      return classnames(styles.modeToggle, styles.isOpen)
    case "toggleClosed":
      return styles.modeToggle
    case "always":
      return styles.modeAlways
    case "hover":
      return styles.modeHover
    case "never":
      return styles.modeNever
  }
}

const positionToClassName = position => {
  switch (position) {
    case "left":
      return styles.positionLeft
    case "right":
      return styles.positionRight
  }
}

export default React.forwardRef(function Drawer(
  {
    className,
    mode = "toggleClosed",
    position = "right",
    onClose = () => {},
    renderHeader,
    renderContents
  },
  ref
) {
  const onBackdropClick = useCallback(() => onClose(), [onClose])

  return (
    <>
      <div
        onClick={onBackdropClick}
        className={classnames(
          styles.backdrop,
          modeToClassName(mode),
          "fullbleed backdrop foo"
        )}
      />

      <aside
        ref={ref}
        className={classnames(
          className,
          styles.drawer,
          modeToClassName(mode),
          positionToClassName(position)
        )}
      >
        {renderHeader(styles.header)}
        {renderContents(styles.contents)}
      </aside>
    </>
  )
})
