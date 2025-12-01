# Comprehensive Markdown Test Document

This is a **complex markdown document** to test the Plate editor conversion capabilities. It includes *various* markdown features and ~~some strikethrough text~~.

## Text Formatting

Here are different text formatting options:

- **Bold text**
- *Italic text*
- ***Bold and italic***
- ~~Strikethrough~~
- `inline code`
- [Link to Google](https://google.com)

## Headers

### Level 3 Header

#### Level 4 Header

##### Level 5 Header

###### Level 6 Header

## Lists

### Unordered List

- First item
- Second item
  - Nested item 1
  - Nested item 2
    - Deep nested item
- Third item

### Ordered List

1. First step
2. Second step
  1. Sub-step A
  2. Sub-step B
3. Third step

### Task List (GitHub Flavored Markdown)

- Completed task
- Pending task
- Another pending task
  - Nested completed task
  - Nested pending task

## Code Blocks

### JavaScript Code

```javascript
function helloWorld() {
  console.log("Hello, World!");
  return true;
}

const result = helloWorld();
```

### TypeScript Code

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};
```

### JSON Example

```json
{
  "name": "plate-editor",
  "version": "1.0.0",
  "description": "Markdown to Plate JSON converter"
}
```

## Blockquotes

> This is a blockquote.
> It can span multiple lines.
> 
> This is a nested blockquote.
> Pretty cool, right?

## Tables (GitHub Flavored Markdown)

| Feature | Supported | Notes |
| --- | --- | --- |
| Headers | ✓ | H1-H6 supported |
| Lists | ✓ | Ordered and unordered |
| Code | ✓ | Inline and blocks |
| Tables | ✓ | GFM extension |
| Images | ✓ | Alt text supported |

### Alignment Example

| Left Aligned | Center Aligned | Right Aligned |
| --- | --- | --- |
| Left | Center | Right |
| Text | More text | Numbers: 123 |

## Images

![](https://via.placeholder.com/150)

## Horizontal Rules

---

Above and below are horizontal rules.

---

---

## Links and References

Here's a  and an [inline link](https://example.com).

## Mixed Content

You can combine **bold text with **[**links**](https://example.com) and `inline code` in the same sentence.

### Inline HTML (if supported)

<div>
  <p>Some HTML content</p>
</div>

## Special Characters

Here are some special characters: & < > " '

## Escaped Characters

*Not italic* [Not a link]

## Long Paragraph

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Nested Complex Structures

1. First level ordered list
  - Unordered nested item
  - Another item with **bold** and *italic*```javascript
// Nested code block
const nested = true;
```
  - Back to list
2. Second level> Nested blockquote
> with multiple lines
3. Third level

## Conclusion

This document tests various markdown features to ensure proper conversion to Plate JSON format. It includes:

- Text formatting (bold, italic, strikethrough)
- Headers at all levels
- Multiple list types
- Code blocks with syntax highlighting
- Blockquotes (including nested)
- Tables with different alignments
- Images
- Links (inline and reference)
- Horizontal rules
- Mixed content
- Special characters

---

**End of Test Document**