import React from "react"
import cn from "classnames"

import FolderOutlineSvg from "./icons/FolderOutlineSvg"

import styles from "./Bookmark.css"

export default function Bookmark({ className, url, title, isSmall }) {
  return (
    <a className={cn(className, styles.link, isSmall && styles.isSmall)}>
      {url ? (
        <img
          className={styles.image}
          src={`chrome://favicon/size/16@8x/${url}`}
        />
      ) : (
        <FolderOutlineSvg className={styles.image} />
      )}
      {!isSmall && <div className={styles.name}>{title}</div>}
    </a>
  )
}
