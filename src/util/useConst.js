import { useRef } from "react"

export default function useConst(x) {
  return useRef(x).current
}
