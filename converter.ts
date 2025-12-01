// ** import types
import type { Descendant, Element, Text } from "slate";

// ** import core packages
import { createSlateEditor } from "@udecode/plate-core";
import { deserializeMd, MarkdownPlugin } from "@platejs/markdown";
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import remarkParse from "remark-parse";

// ** import utils
import { readFile, writeFile } from "node:fs/promises";
import { serializeToMarkdown } from "./custom-serializer";

/**
 * Converts Markdown to Plate JSON format
 */
export async function convertMarkdownToPlateJSON(
	markdownContent: string,
): Promise<Descendant[]> {
	// Create a Plate editor with only MarkdownPlugin
	const editor = createSlateEditor({
		plugins: [MarkdownPlugin],
	});

	// Deserialize markdown to Plate JSON
	// biome-ignore lint/suspicious/noExplicitAny: Type compatibility issue between plate-core and platejs/markdown
	const plateJSON = deserializeMd(editor as any, markdownContent, {
		remarkPlugins: [remarkGfm],
	});

	// Enrich JSON with metadata from Remark AST (checked state, table alignment, missing refs)
	try {
		const processor = unified().use(remarkParse).use(remarkGfm);
		const mdast = processor.parse(markdownContent);
        
        // Collect definitions
        const definitions = new Map<string, string>();
        // biome-ignore lint/suspicious/noExplicitAny: mdast types
        const visitDefinitions = (node: any) => {
            if (node.type === 'definition') {
                definitions.set(node.identifier, node.url);
            }
            if (node.children) {
                node.children.forEach(visitDefinitions);
            }
        };
        visitDefinitions(mdast);
        
		enrichPlateJSON(plateJSON, mdast.children, definitions);
	} catch (error) {
		console.warn("Warning: Failed to enrich Plate JSON with metadata:", error);
	}

	return plateJSON;
}

/**
 * Recursively enriches Plate JSON nodes with metadata from MDAST nodes
 * and restores missing nodes (like linkReference)
 */
// biome-ignore lint/suspicious/noExplicitAny: MDAST types are complex
function enrichPlateJSON(plateNodes: Descendant[], mdNodes: any[], definitions: Map<string, string>) {
	if (!plateNodes || !mdNodes) return;

	let pIndex = 0;
	let mIndex = 0;

	while (mIndex < mdNodes.length) {
        // If we ran out of plate nodes, but have MD nodes, checks if we can restore them
        if (pIndex >= plateNodes.length) {
             const mNode = mdNodes[mIndex];
             if (mNode.type === 'linkReference') {
                 // Restore at end
                 const restored = restoreLinkReference(mNode, definitions);
                 if (restored) {
                     // console.log('Restoring linkReference at end:', JSON.stringify(restored));
                     plateNodes.push(restored);
                     pIndex++; // We added one
                 }
             }
             mIndex++;
             continue;
        }

		const pNode = plateNodes[pIndex] as Element;
		const mNode = mdNodes[mIndex];
        
        // Unwrap inline styles in MDAST to match Plate's flat structure
        if (['strong', 'emphasis', 'delete'].includes(mNode.type)) {
            if (mNode.children) {
                // Replace the current node with its children
                mdNodes.splice(mIndex, 1, ...mNode.children);
                continue; // Re-process at same mIndex
            }
            mIndex++;
            continue;
        }

		// Skip MDAST nodes that are purely metadata or don't map
		if (mNode.type === "definition" || mNode.type === "yaml") {
			mIndex++;
			continue;
		}
        
        // Check for match
        const isMatch = checkMatch(pNode, mNode, definitions);
        
        if (isMatch) {
            // Map properties
            if (pNode.type === "li" && mNode.type === "listItem") {
                if (typeof mNode.checked === "boolean") {
                    (pNode as any).checked = mNode.checked;
                }
            } else if (pNode.type === "table" && mNode.type === "table") {
                if (mNode.align) {
                    (pNode as any).align = mNode.align;
                }
            } else if (pNode.type === 'img' && mNode.type === 'image') {
                // Ensure caption/alt is preserved if missing?
                // Plate handles it usually.
            }

            // Recurse
            if (pNode.children && mNode.children) {
                enrichPlateJSON(pNode.children, mNode.children, definitions);
            }
            
            pIndex++;
            mIndex++;
        } else {
            // Mismatch!
            // console.log(`Mismatch at p=${pIndex} m=${mIndex}: Plate ${pNode.type} vs MD ${mNode.type}`);
            
            // Check if mNode is something dropped by deserializer (like linkReference)
            if (mNode.type === 'linkReference') {
                const restored = restoreLinkReference(mNode, definitions);
                if (restored) {
                    // console.log('Restoring linkReference:', JSON.stringify(restored));
                    // Insert into Plate nodes
                    plateNodes.splice(pIndex, 0, restored);
                    pIndex++;
                    mIndex++;
                    continue;
                }
            }
            
            // If not restored, we might have drifting.
            mIndex++;
        }
	}
}

function checkMatch(pNode: Element, mNode: any, definitions: Map<string, string>): boolean {
    if (!pNode || !mNode) return false;
    
    // Map types
    if (pNode.type === 'li' && mNode.type === 'listItem') return true;
    if (pNode.type === 'ul' && mNode.type === 'list' && !mNode.ordered) return true;
    if (pNode.type === 'ol' && mNode.type === 'list' && mNode.ordered) return true;
    if (pNode.type === 'table' && mNode.type === 'table') return true;
    if (pNode.type === 'lic' && mNode.type === 'paragraph') return true; // inside LI
    if (pNode.type === 'p' && mNode.type === 'paragraph') return true;
    if (pNode.type === 'h1' && mNode.type === 'heading' && mNode.depth === 1) return true;
    if (pNode.type === 'h2' && mNode.type === 'heading' && mNode.depth === 2) return true;
    if (pNode.type === 'h3' && mNode.type === 'heading' && mNode.depth === 3) return true;
    if (pNode.type === 'h4' && mNode.type === 'heading' && mNode.depth === 4) return true;
    if (pNode.type === 'h5' && mNode.type === 'heading' && mNode.depth === 5) return true;
    if (pNode.type === 'h6' && mNode.type === 'heading' && mNode.depth === 6) return true;
    if (pNode.type === 'blockquote' && mNode.type === 'blockquote') return true;
    if (pNode.type === 'code_block' && mNode.type === 'code') return true;
    if (pNode.type === 'hr' && mNode.type === 'thematicBreak') return true;
    if (pNode.type === 'img' && (mNode.type === 'image' || mNode.type === 'imageReference')) return true;
    
    if (pNode.type === 'a' && (mNode.type === 'link' || mNode.type === 'linkReference')) {
        // Check URL match to be sure
        const pUrl = (pNode as any).url;
        let mUrl = mNode.url;
        if (mNode.type === 'linkReference') {
            mUrl = definitions.get(mNode.identifier);
        }
        
        // Allow match if URLs are equal (or both undefined/empty)
        if (pUrl !== mUrl) {
            return false;
        }
        return true;
    }
    
    // Text nodes
    if ('text' in pNode && mNode.type === 'text') {
        // Content match check?
        // (pNode as Text).text === mNode.value
        // But they might be partial.
        return true; 
    }
    
    return false;
}

function restoreLinkReference(mNode: any, definitions: Map<string, string>): Element | null {
    const url = definitions.get(mNode.identifier) || '';
    // We treat it as inline link
    // Children: mNode.children (usually text) -> convert to slate text
    // Simple conversion for text children
    const children = mNode.children ? mNode.children.map((c: any) => {
        if (c.type === 'text') return { text: c.value };
        return { text: '' }; // fallback
    }) : [{ text: '' }];
    
    return {
        type: 'a',
        url: url,
        children: children
    } as Element;
}

/**
 * Converts Plate JSON to Markdown format
 */
export function convertPlateJSONToMarkdown(plateJSON: Descendant[]): string {
	// Use custom serializer that properly handles lists and all markdown elements
	const markdown = serializeToMarkdown(plateJSON);
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
