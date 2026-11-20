import textile from './vendor/textile-js.mjs'

export type PreviewNode = string | {
  tag: string
  attributes: Record<string, string>
  children: PreviewNode[]
}

const supportedTags = new Set([
  'a', 'abbr', 'acronym', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'dd',
  'del', 'div', 'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'ins', 'kbd', 'li', 'ol', 'p', 'pre', 'q', 's', 'small', 'span', 'strong', 'sub',
  'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
])

const ignoredTags = new Set(['!', 'iframe', 'object', 'script', 'style', 'template'])

function previewNodes(value: unknown): PreviewNode[] {
  if (typeof value === 'string') return [value]
  if (!Array.isArray(value) || typeof value[0] !== 'string') return []

  const [tag, ...parts] = value
  if (ignoredTags.has(tag)) return []

  const hasAttributes = parts[0] && typeof parts[0] === 'object' && !Array.isArray(parts[0])
  const source = (hasAttributes ? parts.shift() : {}) as Record<string, unknown>

  if (tag === 'img') {
    const label = source.alt || source.title || source.src
    return typeof label === 'string'
      ? [{ tag: 'span', attributes: { class: 'attachment' }, children: [label] }]
      : []
  }

  const children = parts.flatMap(previewNodes)
  if (!supportedTags.has(tag)) return children

  const attributes: Record<string, string> = {}
  if (typeof source.title === 'string') attributes.title = source.title
  if (tag === 'a' && typeof source.href === 'string' && /^(https?:\/\/|mailto:)[^\s]+$/i.test(source.href)) {
    attributes.href = source.href
  }

  if (tag === 'td' || tag === 'th') {
    for (const name of ['colspan', 'rowspan']) {
      const span = String(source[name] ?? '')
      if (/^[1-9]\d{0,2}$/.test(span)) attributes[name] = span
    }
  }

  if ((tag === 'span' || tag === 'td' || tag === 'th') && typeof source.style === 'string') {
    const color = /(?:^|;)\s*color\s*:\s*(#[\da-f]{6}|#[\da-f]{3})\s*(?:;|$)/i.exec(source.style)
    if (color) attributes.color = color[1]
  }

  return [{ tag, attributes, children }]
}

export function parsePreview(source: string): PreviewNode[] {
  return previewNodes(textile.jsonml(source))
}

export async function watchPreview(
  source: NonNullable<typeof orca.document>,
  render: (nodes: PreviewNode[]) => void,
  onError: (error: unknown) => void
) {
  const session = await source.session()
  const renderText = (text: string) => {
    try {
      render(parsePreview(text))
    } catch (error) {
      onError(error)
    }
  }
  renderText(session.value)
  const subscription = session.onReplace(renderText)
  return () => {
    subscription.dispose()
    session.dispose()
  }
}
