/**
 * Template literal tag that creates a document fragment.
 * @param {[string]} strings
 * @param {never} values
 */
export default function html([htmlString], values) {
  // For XSS security, don't allow them to substitute in values.
  if (values) {
    throw new Error("No template substitution allowed for HTML.")
  }

  const template = document.createElement("template")
  template.innerHTML = htmlString
  return template.content
}
