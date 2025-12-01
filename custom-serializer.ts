// ** import types
import type { Descendant, Element, Text } from "slate";

/**
 * Custom markdown serializer that handles all Plate elements including lists
 */
export function serializeToMarkdown(nodes: Descendant[]): string {
	// Use double newline to separate root blocks, restoring standard markdown spacing
	return nodes.map((node) => serializeNode(node)).join("\n\n");
}

function serializeNode(node: Descendant, listDepth = 0): string {
	if ("text" in node) {
		return serializeText(node);
	}

	const element = node as Element & {
		type: string;
		url?: string;
		lang?: string;
		ordered?: boolean;
		checked?: boolean;
		align?: string[];
		caption?: { text: string }[];
	};

	const children = element.children || [];

	switch (element.type) {
		case "h1":
			return `# ${serializeChildren(children)}`;
		case "h2":
			return `## ${serializeChildren(children)}`;
		case "h3":
			return `### ${serializeChildren(children)}`;
		case "h4":
			return `#### ${serializeChildren(children)}`;
		case "h5":
			return `##### ${serializeChildren(children)}`;
		case "h6":
			return `###### ${serializeChildren(children)}`;

		case "p":
			return serializeChildren(children);

		case "blockquote": {
			const content = serializeChildren(children);
			return content
				.split("\n")
				.map((line) => `> ${line}`)
				.join("\n");
		}

		case "ul":
			return children
				.map((child) => serializeListItem(child as Element, false, listDepth))
				.join("\n");

		case "ol":
			return children
				.map((child, index) =>
					serializeListItem(child as Element, true, listDepth, index + 1),
				)
				.join("\n");

		case "li":
		case "lic":
			return serializeChildren(children);

		case "code_block": {
			const lang = element.lang || "";
			// Each child is a code_line, join them with newlines
			const lines = children.map((child) => serializeNode(child));
			const code = lines.join("\n");
			return `\`\`\`${lang}\n${code}\n\`\`\``;
		}

		case "code_line":
			// Just return the text content without extra processing
			return serializeChildren(children);

		case "hr":
			return "---";

		case "a": {
			const text = serializeChildren(children);
			const url = element.url || "";
			return `[${text}](${url})`;
		}

		case "img": {
			// Try to get alt text from caption, or children
			const captionText = element.caption?.[0]?.text;
			const alt = captionText || serializeChildren(children);
			const url = element.url || "";
			return `![${alt}](${url})`;
		}

		case "table":
			return serializeTable(element);

		default:
			return serializeChildren(children);
	}
}

function serializeListItem(
	node: Element,
	ordered: boolean,
	depth: number,
	index?: number,
): string {
	// Using 2 spaces for list indentation
	const _indent = "  ".repeat(depth);
	const marker = ordered ? `${index}.` : "-";
	const baseIndent = "  ".repeat(depth);

	const children = node.children || [];

	// Handle task lists
	let prefix = "";
	if ("checked" in node && typeof node.checked === "boolean") {
		prefix = node.checked ? "[x] " : "[ ] ";
	}

	// Handle nested lists and mixed content
	let content = "";
	const nestedLists: string[] = [];

	for (let i = 0; i < children.length; i++) {
		const child = children[i] as Element;

		if ("type" in child && (child.type === "ul" || child.type === "ol")) {
			nestedLists.push(serializeNode(child, depth + 1));
		} else {
			// Handle block elements inside list item (like code blocks)
			const isBlock =
				"type" in child &&
				(child.type === "code_block" || child.type === "blockquote");
			let childContent = serializeNode(child, depth);

			if (isBlock) {
				// Indent block content
				const offset = ordered ? 3 : 2; // Approximate
				const blockIndent = " ".repeat(offset);

				const lines = childContent.split("\n");
				childContent = `\n${lines.map((line) => blockIndent + line).join("\n")}`;
			}

			content += childContent;
		}
	}

	// Ensure space after marker if content is text
	// If content starts with newline (block), it's fine.
	let result = `${baseIndent}${marker} ${prefix}${content}`;

	if (nestedLists.length > 0) {
		result += `\n${nestedLists.join("\n")}`;
	}

	return result;
}

function serializeTable(element: Element): string {
	const rows = element.children as Element[];
	if (!rows || rows.length === 0) return "";

	// biome-ignore lint/suspicious/noExplicitAny: Accessing align property dynamically from enrichment
	const alignments = ((element as any).align as string[]) || [];

	const lines: string[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i] as Element;
		const cells = (row.children || []) as Element[];
		const cellContents = cells.map((cell) =>
			serializeChildren(cell.children || []),
		);
		lines.push(`| ${cellContents.join(" | ")} |`);

		// Add separator after header row
		if (i === 0) {
			const separator = cells
				.map((_, index) => {
					const align = alignments[index];
					if (align === "center") return ":---:";
					if (align === "right") return "---:";
					return "---"; // Default or left
				})
				.join(" | ");
			lines.push(`| ${separator} |`);
		}
	}

	return lines.join("\n");
}

function serializeChildren(children: Descendant[]): string {
	return children.map((child) => serializeNode(child)).join("");
}

function serializeText(node: Text): string {
	let text = node.text;

	// Escape special characters if not part of a mark
	if (!node.bold && !node.italic && !node.code) {
		// Escape * and _ and [ and ]
		// Careful not to break existing things, but here we are conservative
		text = text.replace(/([*_[\]])/g, "\\$1");
	}

	// Handle marks
	if ("bold" in node && node.bold) {
		text = `**${text}**`;
	}
	if ("italic" in node && node.italic) {
		text = `*${text}*`;
	}
	if ("code" in node && node.code) {
		text = `\`${text}\``;
	}
	if ("strikethrough" in node && node.strikethrough) {
		text = `~~${text}~~`;
	}
	if ("underline" in node && node.underline) {
		text = `_${text}_`;
	}

	return text;
}
