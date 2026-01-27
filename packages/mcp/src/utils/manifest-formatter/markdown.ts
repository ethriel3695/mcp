import type { ComponentManifest } from '../../types.ts';
import { MAX_SUMMARY_LENGTH, type ManifestFormatter } from './types.ts';
import { parseReactDocgen } from '../parse-react-docgen.ts';
import { parseAngularCompodoc } from '../parse-angular-compodoc.ts';
import { dedent } from '../dedent.ts';
import { extractDocsSummary } from './extract-docs-summary.ts';

/**
 * Format props section for either React or Angular components
 */
function formatPropsSection(
	componentManifest: ComponentManifest,
	parts: string[],
): void {
	// Try React docgen first
	if (componentManifest.reactDocgen) {
		const parsedDocgen = parseReactDocgen(componentManifest.reactDocgen);
		const propEntries = Object.entries(parsedDocgen.props);

		if (propEntries.length > 0) {
			parts.push('## Props');
			parts.push('');
			parts.push('```');
			parts.push('export type Props = {');

			for (const [propName, propInfo] of propEntries) {
				formatPropEntry(propName, propInfo, parts);
			}

			parts.push('}');
			parts.push('```');
			parts.push('');
		}
		return;
	}

	// Try Angular Compodoc
	if (componentManifest.compodocData) {
		const compodocData = componentManifest.compodocData;
		const hasInputs = compodocData.inputs && compodocData.inputs.length > 0;
		const hasOutputs = compodocData.outputs && compodocData.outputs.length > 0;

		if (hasInputs || hasOutputs) {
			// Format inputs
			if (hasInputs) {
				parts.push('## Inputs');
				parts.push('');
				parts.push('```typescript');
				parts.push('interface Inputs {');

				for (const input of compodocData.inputs) {
					const propInfo = {
						description: input.rawdescription || input.description,
						type: input.type,
						defaultValue: input.defaultValue,
						required: !input.optional,
					};
					formatPropEntry(input.name, propInfo, parts);
				}

				parts.push('}');
				parts.push('```');
				parts.push('');
			}

			// Format outputs
			if (hasOutputs) {
				parts.push('## Outputs');
				parts.push('');
				parts.push('```typescript');
				parts.push('interface Outputs {');

				for (const output of compodocData.outputs) {
					const hasDescription = output.rawdescription || output.description;
					if (hasDescription) {
						parts.push('  /**');
						parts.push(`    ${output.rawdescription || output.description}`);
						parts.push('  */');
					}
					parts.push(`  ${output.name}: ${output.type || 'EventEmitter<any>'};`);
				}

				parts.push('}');
				parts.push('```');
				parts.push('');
			}
		}
	}
}

/**
 * Format a single prop entry
 */
function formatPropEntry(
	propName: string,
	propInfo: {
		description?: string;
		type?: string;
		defaultValue?: string;
		required?: boolean;
	},
	parts: string[],
): void {
	const type = propInfo.type ?? 'any';
	const isRequired = propInfo.required ?? true;
	const hasDefault = propInfo.defaultValue !== undefined;
	const hasDescription = propInfo.description !== undefined;

	// Add description as JSDoc comment if present
	if (hasDescription) {
		parts.push('  /**');
		parts.push(`    ${propInfo.description}`);
		parts.push('  */');
	}

	// Build the prop line
	let propLine = `  ${propName}`;

	// Add ? for optional props
	if (!isRequired) {
		propLine += '?';
	}

	propLine += `: ${type}`;

	// Add default value if present
	if (hasDefault) {
		propLine += ` = ${propInfo.defaultValue}`;
	}

	propLine += ';';
	parts.push(propLine);
}

/**
 * Markdown formatter for component manifests.
 * Formats component data into token-efficient markdown with headers, lists, and tables.
 * Uses adaptive formatting based on prop complexity to optimize token usage.
 * Supports both React (reactDocgen) and Angular (compodocData) components.
 */
export const markdownFormatter: ManifestFormatter = {
	formatComponentManifest(componentManifest: ComponentManifest): string {
		const parts: string[] = [];

		// Component header
		parts.push(`# ${componentManifest.name}`);
		parts.push('');
		parts.push(`ID: ${componentManifest.id}`);
		parts.push('');

		// Description section
		if (componentManifest.description) {
			parts.push(componentManifest.description);
			parts.push('');
		}

		// Stories section
		if (componentManifest.stories && componentManifest.stories.length > 0) {
			parts.push('## Stories');
			parts.push('');

			for (const story of componentManifest.stories) {
				if (!story.snippet) {
					continue;
				}

				// Convert PascalCase to Human Readable Case
				const storyName = story.name.replace(/([A-Z])/g, ' $1').trim();
				parts.push(`### ${storyName}`);

				if (story.description) {
					parts.push('');
					parts.push(story.description);
				}

				parts.push('');
				parts.push('```');
				if (componentManifest.import) {
					parts.push(componentManifest.import);
					parts.push('');
				}
				parts.push(story.snippet);
				parts.push('```');
				parts.push('');
			}
		}

		// Props section (handles both React and Angular)
		formatPropsSection(componentManifest, parts);

		return parts.join('\n').trim();
	},

	formatDocsManifest(doc) {
		return dedent`# ${doc.title}

			${doc.content}`;
	},

	formatManifestsToLists(manifests) {
		const parts: string[] = [];

		parts.push('# Components');
		parts.push('');

		for (const component of Object.values(
			manifests.componentManifest.components,
		)) {
			const summary =
				component.summary ??
				(component.description
					? component.description.length > MAX_SUMMARY_LENGTH
						? `${component.description.slice(0, MAX_SUMMARY_LENGTH)}...`
						: component.description
					: undefined);

			if (summary) {
				parts.push(`- ${component.name} (${component.id}): ${summary}`);
			} else {
				parts.push(`- ${component.name} (${component.id})`);
			}
		}

		parts.push('');

		if (!manifests.docsManifest) {
			return parts.join('\n').trim();
		}

		parts.push('# Docs');
		parts.push('');

		for (const doc of Object.values(manifests.docsManifest.docs)) {
			const summary = doc.summary ?? extractDocsSummary(doc.content);
			parts.push(`- ${doc.title} (${doc.id})${summary ? `: ${summary}` : ''}`);
		}

		return parts.join('\n').trim();
	},
};
