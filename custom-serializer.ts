// ** import types
import type { Descendant, Element, Text } from "slate";

/**
 * Custom markdown serializer that handles all Plate elements including lists
 */
export function serializeToMarkdown(nodes: Descendant[]): string {
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
			const alt = serializeChildren(children);
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
	const indent = "  ".repeat(depth);
	const marker = ordered ? `${index}.` : "-";

	const children = node.children || [];

	// Handle task lists
	if ("checked" in node && typeof node.checked === "boolean") {
		const checkbox = node.checked ? "[x]" : "[ ]";
		return `${indent}${marker} ${checkbox} ${serializeChildren(children)}`;
	}

	// Handle nested lists
	let content = "";
	const nestedLists: string[] = [];

	for (const child of children) {
		if (
			"type" in child &&
			(child.type === "ul" ||
				child.type === "ol" ||
				child.type === "li" ||
				child.type === "lic")
		) {
			if (child.type === "ul" || child.type === "ol") {
				nestedLists.push(serializeNode(child, depth + 1));
			} else {
				content += serializeNode(child, depth);
			}
		} else {
			content += serializeNode(child, depth);
		}
	}

	let result = `${indent}${marker} ${content}`;
	if (nestedLists.length > 0) {
		result += "\n" + nestedLists.join("\n");
	}

	return result;
}

function serializeTable(element: Element): string {
	const rows = element.children as Element[];
	if (!rows || rows.length === 0) return "";

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
			const separator = cells.map(() => "---").join(" | ");
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
