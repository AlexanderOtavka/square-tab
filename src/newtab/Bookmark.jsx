import React, { useCallback } from "react"
import cn from "classnames"

import FolderOutlineSvg from "./icons/FolderOutlineSvg"

import styles from "./Bookmark.css"

export default function Bookmark({
  className,
  id,
  url,
  title,
  isSmall,
  onOpenFolder,
  onClick,
  ...linkProps
}) {
  const onLinkClick = useCallback(
    ev => {
      if (onClick) onClick(ev)
      if (!url) {
        onOpenFolder(id)
      }
    },
    [id, url, onClick, onOpenFolder]
  )

  return (
    <a
      {...linkProps}
      className={cn(className, styles.link, isSmall && styles.isSmall)}
      href={url}
      onClick={onLinkClick}
    >
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
