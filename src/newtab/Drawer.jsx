import React, { useCallback } from "react"
import classnames from "classnames"

import styles from "./Drawer.css"

const modeToClassName = mode => {
  switch (mode) {
    case "toggle":
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

export default function Drawer({
  className,
  mode = "toggle",
  position = "right",
  isOpen = false,
  onClose = () => {},
  renderHeader,
  renderContents
}) {
  const onBackdropClick = useCallback(() => onClose(), [onClose])

  const sharedClassName = classnames(
    isOpen && styles.isOpen,
    modeToClassName(mode)
  )

  return (
    <>
      <div
        onClick={onBackdropClick}
        className={classnames(
          styles.backdrop,
          sharedClassName,
          "fullbleed backdrop"
        )}
      />

      <aside
        className={classnames(
          className,
          styles.drawer,
          sharedClassName,
          positionToClassName(position)
        )}
      >
        {renderHeader(styles.header)}
        {renderContents(styles.contents)}
      </aside>
    </>
  )
}
