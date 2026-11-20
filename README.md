# Textile for Orca

Open `.textile` files in **Source** with syntax highlighting, then switch to **Preview** in the same tab to read the formatted document. Requires Orca Desktop 1.4.248 or later.

## Install and use

1. Enable plugins in **Settings → Plugins**.
2. Run `orca plugin install Ruchkung/orca-textile@v0.1.1` and follow the approval instructions from Orca.
3. Open a `.textile` file and switch between **Source** and **Preview**.

Preview renders Textile headings, lists, tables, emphasis, links, and code blocks locally. It supports hexadecimal text colors and shows image names or descriptions as text. Redmine-specific macros and references such as `{{toc}}` and `[[Wiki]]` need Redmine to resolve.

The preview uses [textile-js 2.1.1](https://github.com/borgar/textile-js), distributed under the [MIT license](editor/vendor/textile-js.LICENSE), with a [compatibility patch](editor/vendor/textile-js.patch) for Redmine tables that start directly after a paragraph.

## Develop locally

Run `orca plugin dev load . --json` from this folder to load the development copy.

## Verify

```sh
orca plugin test . --json
orca plugin check . --json
orca plugin validate . --json
```

## License

[MIT](LICENSE)
