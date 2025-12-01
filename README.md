# Markdown ↔ Plate JSON Converter

A server-side Node.js/Bun utility for **bidirectional conversion** between Markdown and Plate editor JSON format. This tool uses the official `@platejs/markdown` plugin with GitHub Flavored Markdown (GFM) support.

## Features

- **Markdown → Plate JSON**: Full conversion support for all Markdown elements
- **Plate JSON → Markdown**: Partial conversion with known limitations (see below)
- Support for GitHub Flavored Markdown (tables, task lists, strikethrough, etc.)
- Handle all standard Markdown elements (headers, lists, code blocks, links, images, etc.)
- Server-side conversion (no React dependencies required)
- Fast conversion powered by Bun runtime
- Command-line interface with auto-detection of conversion direction
- TypeScript support with full type safety

## ⚠️ Known Limitations

**JSON to Markdown conversion** currently has limitations with the Plate markdown serializer:

- **Lists** (ordered and unordered) are not serialized back to markdown
- **Task lists** may not serialize properly
- **Some nested structures** may lose formatting

**Recommendation**: For production use, the **Markdown → JSON conversion works perfectly**. The JSON format preserves all structure and can be used directly in Plate editors. The reverse conversion (JSON → Markdown) is provided as a convenience but may not preserve all elements.

If you need full bidirectional conversion, consider:
1. Using the Plate JSON format as your source of truth
2. Implementing a custom serializer for specific use cases
3. Contributing to the Plate project to improve markdown serialization

## Installation

Install dependencies using Bun:

```bash
bun install
```

## Usage

### Markdown to JSON

Convert a markdown file to Plate JSON:

```bash
bun run test
```

This will convert `test.md` to `output.json`.

### JSON to Markdown (Reverse)

Convert Plate JSON back to markdown:

```bash
bun run test:reverse
```

This will convert `output.json` to `output.md`.

### Custom Input/Output

The converter auto-detects the conversion direction based on file extension:

```bash
# Markdown → JSON
bun run converter.ts input.md output.json

# JSON → Markdown
bun run converter.ts input.json output.md
```

### Programmatic Usage

You can also use the converter in your own code:

**Markdown to JSON:**
```typescript
import { convertMarkdownToPlateJSON } from './converter'

const markdownContent = '# Hello World\n\nThis is **bold** text.'
const plateJSON = await convertMarkdownToPlateJSON(markdownContent)
console.log(plateJSON)
```

**JSON to Markdown:**
```typescript
import { convertPlateJSONToMarkdown } from './converter'

const plateJSON = [
  { type: 'h1', children: [{ text: 'Hello World' }] }
]
const markdown = convertPlateJSONToMarkdown(plateJSON)
console.log(markdown) // # Hello World
```

## Supported Markdown Features

- **Headers**: H1-H6 (`#` to `######`)
- **Text Formatting**: Bold (`**text**`), Italic (`*text*`), Strikethrough (`~~text~~`)
- **Lists**: Ordered lists, unordered lists, nested lists
- **Task Lists**: `- [x]` completed and `- [ ]` pending tasks (GFM)
- **Code**: Inline code and fenced code blocks with syntax highlighting
- **Links**: Inline links and reference-style links
- **Images**: Standard image syntax
- **Blockquotes**: Including nested blockquotes
- **Tables**: Full table support with alignment (GFM)
- **Horizontal Rules**: `---`, `***`, `___`
- **And more**: Mixed content, special characters, HTML blocks

## Output Format

The converter generates Plate-compatible JSON with the following structure:

```json
[
  {
    "type": "h1",
    "children": [
      { "text": "Hello World" }
    ]
  },
  {
    "type": "p",
    "children": [
      { "text": "This is " },
      { "text": "bold", "bold": true },
      { "text": " text." }
    ]
  }
]
```

## Project Structure

```
plate-editor/
├── converter.ts      # Main conversion logic
├── test.md          # Sample markdown file for testing
├── output.json      # Generated Plate JSON output
├── package.json     # Project dependencies and scripts
└── README.md        # This file
```

## Dependencies

- `@platejs/markdown` - Official Plate markdown plugin
- `@udecode/plate-core` - Plate editor core (no React)
- `remark-gfm` - GitHub Flavored Markdown support
- `slate` - Slate editor framework
- `unified` - Markdown processing pipeline
- `remark-parse` - Markdown parser

## Scripts

- `bun run test` - Convert test.md to output.json (Markdown → JSON)
- `bun run test:reverse` - Convert output.json to output.md (JSON → Markdown)
- `bun run convert` - Run the converter with custom args
- `bun run dev` - Run converter in watch mode
- `bun run lint` - Check code with Biome linter
- `bun run lint:fix` - Fix linting issues automatically
- `bun run type-check` - Run TypeScript type checking

## Development

This project uses:

- **Bun** - Fast JavaScript runtime and package manager
- **TypeScript** - Type-safe JavaScript
- **Plate** - Rich text editor framework

## License

MIT

## Links

- [Plate Editor](https://platejs.org/)
- [Plate Markdown Plugin](https://platejs.org/docs/markdown)
- [GitHub Repository](https://github.com/udecode/plate)
- [Bun Runtime](https://bun.sh/)

## Contributing

Feel free to open issues or submit pull requests for improvements.
