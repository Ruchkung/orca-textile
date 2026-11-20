import { watchPreview, type PreviewNode } from './preview'

const preview = document.querySelector<HTMLElement>('#preview')!
const entity = document.createElement('template')

function decodeEntities(text: string) {
  return text.replace(/&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/gi, (reference) => {
    entity.innerHTML = reference
    return entity.content.textContent ?? reference
  })
}

function renderNode(node: PreviewNode): Node {
  if (typeof node === 'string') return document.createTextNode(decodeEntities(node))

  const element = document.createElement(node.tag)
  for (const [name, value] of Object.entries(node.attributes)) {
    if (name === 'color') {
      element.style.color = value
    } else if (name === 'href') {
      element.setAttribute('href', value)
      element.addEventListener('click', (event) => {
        event.preventDefault()
        void orca.shell?.openExternal(value).catch(() => {
          element.title = 'Could not open the link in your browser.'
        })
      })
      element.addEventListener('auxclick', (event) => event.preventDefault())
    } else {
      element.setAttribute(name, value)
    }
  }
  element.append(...node.children.map(renderNode))

  if (node.tag !== 'table') return element

  const wrapper = document.createElement('div')
  wrapper.className = 'table-scroll'
  wrapper.tabIndex = 0
  wrapper.setAttribute('role', 'region')
  wrapper.setAttribute('aria-label', element.querySelector('caption')?.textContent?.trim() || 'Table')
  wrapper.append(element)
  return wrapper
}

function showError(error: unknown) {
  preview.textContent = 'Could not render the Textile preview.'
  console.error(error)
}

try {
  if (!orca.document) throw new Error('Orca did not provide a document to preview.')

  const stop = await watchPreview(orca.document, (nodes) => {
    preview.replaceChildren(...nodes.map(renderNode))
    if (!preview.textContent?.trim() && !preview.firstElementChild) {
      preview.textContent = 'This file is empty.'
    }
  }, showError)
  window.addEventListener('pagehide', stop, { once: true })
} catch (error) {
  showError(error)
}
