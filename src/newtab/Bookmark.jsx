import React, { useCallback } from "react"
import cn from "classnames"

import FolderOutlineSvg from "./icons/FolderOutlineSvg"

import styles from "./Bookmark.css"

const noOp = () => {}

export default function Bookmark({
  className,
  id,
  url,
  title,
  isSmall,
  onOpenFolder,
  onClick = noOp,
  onPickUp = noOp,
  onDragStart = noOp,
  ...linkProps
}) {
  const onLinkClick = useCallback(
    ev => {
      if (!url) {
        onOpenFolder(id)
      }

      onClick(ev)
    },
    [id, url, onClick, onOpenFolder]
  )

  const onLinkDragStart = useCallback(
    ev => {
      ev.dataTransfer.setDragImage(
        ev.currentTarget,
        ev.nativeEvent.offsetX,
        ev.nativeEvent.offsetY
      )
      ev.dataTransfer.setData("text/x-bookmark-id", String(id))

      requestAnimationFrame(() => {
        onPickUp(id)
      })

      onDragStart(ev)
    },
    [onDragStart, id]
  )

  return (
    <a
      {...linkProps}
      className={cn(className, styles.link)}
      href={url}
      draggable
      onClick={onLinkClick}
      onDragStart={onLinkDragStart}
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
