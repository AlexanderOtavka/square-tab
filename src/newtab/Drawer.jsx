import React from "react"
import classnames from "classnames"

import styles from "./Drawer.css"

export default React.forwardRef(function Drawer(
  { isOpen, className, renderHeader, renderContents },
  ref
) {
  return (
    <aside ref={ref} className={classnames(className, styles.drawer)}>
      {renderHeader(styles.header)}
      {renderContents(styles.contents)}
    </aside>
  )
})
