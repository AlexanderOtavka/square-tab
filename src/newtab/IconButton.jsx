import React from "react"
import classnames from "classnames"

import styles from "./IconButton.css"

export default function IconButton({ className, icon, ...buttonProps }) {
  return (
    <button className={classnames(className, styles.button)} {...buttonProps}>
      {icon}
    </button>
  )
}
