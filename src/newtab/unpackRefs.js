export default function unpackRefs(refs) {
  const unpacked = {}
  Object.keys(refs).forEach(key => {
    unpacked[key] = refs[key].current
  })

  return unpacked
}
