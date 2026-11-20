import { assert, mockEditorHost, test } from 'orca/testing'

import * as preview from './preview'

test('renders headings, lists, Thai text, status colours and table headings', () => {
  const nodes = preview.parsePreview('h1. รายงาน\n\n* รายการ\n\n|_. สถานะ |\n| %{color:#2E7D4F}● ต่อแล้ว% |')
  assert.deepEqual(nodes[0], { tag: 'h1', attributes: {}, children: ['รายงาน'] })
  assert.match(JSON.stringify(nodes), /"tag":"ul"/)
  assert.match(JSON.stringify(nodes), /"tag":"th"/)
  assert.match(JSON.stringify(nodes), /"color":"#2E7D4F"/)
})

test('displays link labels and attachment names while excluding active markup and unwanted requests', () => {
  const nodes = preview.parsePreview('"Website":https://example.com "Link":javascript:alert(1) !chart.png!\n\n<script>hideMe()</script>\n\n<span onclick="doThing()" style="background:url(/ignored)">Readable text</span>')
  const result = JSON.stringify(nodes)
  assert.match(result, /"href":"https:\/\/example\.com"/)
  assert.match(result, /Readable text/)
  assert.match(result, /chart\.png/)
  assert.equal(/"href":"javascript:|"tag":"script"|hideMe|onclick|background|"src":/.test(result), false)
})

test('renders the open document and follows replacement text without submitting edits', async () => {
  const host = mockEditorHost({ text: 'h2. Before' })
  try {
    const headings: string[] = []
    let rendered!: () => void
    let renderFailed!: (error: unknown) => void
    const replacement = new Promise<void>((resolve, reject) => {
      rendered = resolve
      renderFailed = reject
    })
    const unsubscribe = await preview.watchPreview(host.orca.document!, (nodes) => {
      headings.push((nodes[0] as { children: string[] }).children[0])
      if (headings.length === 2) rendered()
    }, renderFailed)
    host.replace('h2. After')
    await replacement
    unsubscribe()
    assert.deepEqual(headings, ['Before', 'After'])
    assert.deepEqual(host.edits, [])
  } finally {
    host.dispose()
  }
})

test('renders a Redmine table directly after a paragraph', () => {
  const nodes = preview.parsePreview('*Request*\n|_. Route |_. Notes |\n| @POST items@ | Create an item |')
  const table = nodes.find(node => typeof node !== 'string' && node.tag === 'table')
  assert.ok(table && typeof table !== 'string')
  const rows = table.children.filter(node => typeof node !== 'string' && node.tag === 'tr')
  assert.equal(rows.length, 2)
  assert.match(JSON.stringify(rows[0]), /"tag":"th"/)
  assert.match(JSON.stringify(rows[1]), /"tag":"code"/)
})

test('preserves pipes inside a code block', () => {
  const nodes = preview.parsePreview('bc. Example\n| One | Two |')
  assert.equal(nodes.some(node => typeof node !== 'string' && node.tag === 'table'), false)
  assert.match(JSON.stringify(nodes[0]), /Example\\n\| One \| Two \|/)
})
