// ** import types
import type { Descendant } from "slate";

// ** import core packages
import { createSlateEditor } from "@udecode/plate-core";
import { deserializeMd, MarkdownPlugin, serializeMd } from "@platejs/markdown";
import remarkGfm from "remark-gfm";

// ** import utils
import { readFile, writeFile } from "node:fs/promises";

/**
 * Converts Markdown to Plate JSON format
 */
export async function convertMarkdownToPlateJSON(
	markdownContent: string,
): Promise<Descendant[]> {
	// Create a Plate editor with MarkdownPlugin
	const editor = createSlateEditor({
		plugins: [MarkdownPlugin],
	});

	// Deserialize markdown to Plate JSON
	// biome-ignore lint/suspicious/noExplicitAny: Type compatibility issue between plate-core and platejs/markdown
	const plateJSON = deserializeMd(editor as any, markdownContent, {
		remarkPlugins: [remarkGfm],
	});

	return plateJSON;
}

/**
 * Converts Plate JSON to Markdown format
 */
export function convertPlateJSONToMarkdown(plateJSON: Descendant[]): string {
	// Create a Plate editor with MarkdownPlugin
	const editor = createSlateEditor({
		plugins: [MarkdownPlugin],
	});

	// Set the editor value
	// biome-ignore lint/suspicious/noExplicitAny: Type compatibility issue with Descendant[] assignment
	editor.children = plateJSON as any;

	// Serialize Plate JSON to Markdown
	// biome-ignore lint/suspicious/noExplicitAny: Type compatibility issue between plate-core and platejs/markdown
	const markdown = serializeMd(editor as any, {
		remarkPlugins: [remarkGfm],
	});

	return markdown;
}

/**
 * Reads a markdown file and converts it to Plate JSON
 */
export async function convertMarkdownFile(
	inputPath: string,
	outputPath: string,
): Promise<void> {
	try {
		console.log(`📖 Reading markdown file: ${inputPath}`);
		const markdownContent = await readFile(inputPath, "utf-8");

		console.log(`⚙️  Converting markdown to Plate JSON...`);
		const plateJSON = await convertMarkdownToPlateJSON(markdownContent);

		console.log(`💾 Saving Plate JSON to: ${outputPath}`);
		await writeFile(outputPath, JSON.stringify(plateJSON, null, 2), "utf-8");

		console.log(`✅ Conversion completed successfully!`);
		console.log(`📊 Generated ${plateJSON.length} nodes`);
	} catch (error) {
		console.error(`❌ Error during conversion:`, error);
		throw error;
	}
}

/**
 * Reads a JSON file and converts it to Markdown
 */
export async function convertJSONFile(
	inputPath: string,
	outputPath: string,
): Promise<void> {
	try {
		console.log(`📖 Reading JSON file: ${inputPath}`);
		const jsonContent = await readFile(inputPath, "utf-8");
		const plateJSON = JSON.parse(jsonContent) as Descendant[];

		console.log(`⚙️  Converting Plate JSON to Markdown...`);
		const markdown = convertPlateJSONToMarkdown(plateJSON);

		console.log(`💾 Saving Markdown to: ${outputPath}`);
		await writeFile(outputPath, markdown, "utf-8");

		console.log(`✅ Conversion completed successfully!`);
		console.log(`📄 Markdown generated (${markdown.length} characters)`);
	} catch (error) {
		console.error(`❌ Error during conversion:`, error);
		throw error;
	}
}

/**
 * Main function for CLI usage
 */
async function main() {
	const inputFile = process.argv[2] || "test.md";
	const outputFile = process.argv[3] || "output.json";

	// Auto-detect conversion direction based on file extension
	if (inputFile.endsWith(".json")) {
		const mdOutput = outputFile.endsWith(".md")
			? outputFile
			: outputFile.replace(/\.\w+$/, ".md");
		await convertJSONFile(inputFile, mdOutput);
	} else {
		const jsonOutput = outputFile.endsWith(".json")
			? outputFile
			: outputFile.replace(/\.\w+$/, ".json");
		await convertMarkdownFile(inputFile, jsonOutput);
	}
}

// Run if this file is executed directly
if (import.meta.main) {
	main();
}
