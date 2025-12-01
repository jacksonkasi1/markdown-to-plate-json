// ** import types
import type { Descendant } from 'slate'

// ** import core packages
import { createSlateEditor } from '@udecode/plate-core'
import { MarkdownPlugin, deserializeMd } from '@platejs/markdown'
import remarkGfm from 'remark-gfm'

// ** import utils
import { readFile, writeFile } from 'fs/promises'

/**
 * Converts Markdown to Plate JSON format
 */
export async function convertMarkdownToPlateJSON(
  markdownContent: string
): Promise<Descendant[]> {
  // Create a Plate editor with MarkdownPlugin
  const editor = createSlateEditor({
    plugins: [MarkdownPlugin],
  })

  // Deserialize markdown to Plate JSON
  const plateJSON = deserializeMd(editor, markdownContent, {
    remarkPlugins: [remarkGfm],
  })

  return plateJSON
}

/**
 * Reads a markdown file and converts it to Plate JSON
 */
export async function convertMarkdownFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  try {
    console.log(`📖 Reading markdown file: ${inputPath}`)
    const markdownContent = await readFile(inputPath, 'utf-8')

    console.log(`⚙️  Converting markdown to Plate JSON...`)
    const plateJSON = await convertMarkdownToPlateJSON(markdownContent)

    console.log(`💾 Saving Plate JSON to: ${outputPath}`)
    await writeFile(
      outputPath,
      JSON.stringify(plateJSON, null, 2),
      'utf-8'
    )

    console.log(`✅ Conversion completed successfully!`)
    console.log(`📊 Generated ${plateJSON.length} nodes`)
  } catch (error) {
    console.error(`❌ Error during conversion:`, error)
    throw error
  }
}

/**
 * Main function for CLI usage
 */
async function main() {
  const inputFile = process.argv[2] || 'test.md'
  const outputFile = process.argv[3] || 'output.json'

  await convertMarkdownFile(inputFile, outputFile)
}

// Run if this file is executed directly
if (import.meta.main) {
  main()
}
