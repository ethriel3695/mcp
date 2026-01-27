import { MAX_SUMMARY_LENGTH, type ManifestFormatter } from './types.ts';
import { extractDocsSummary } from './extract-docs-summary.ts';
import { dedent } from '../dedent.ts';
import { parseReactDocgen } from '../parse-react-docgen.ts';
import type { ComponentManifest } from '../../types.ts';

/**
 * Format a single prop/input entry as XML
 */
function formatPropXml(
	propName: string,
	propInfo: {
		description?: string;
		type?: string;
		defaultValue?: string;
		required?: boolean;
	},
	parts: string[],
): void {
	parts.push(dedent`<prop>
		<prop_name>${propName}</prop_name>`);

	if (propInfo.description !== undefined) {
		parts.push(dedent`<prop_description>
			${propInfo.description}
			</prop_description>`);
	}

	if (propInfo.type !== undefined) {
		parts.push(dedent`<prop_type>${propInfo.type}</prop_type>`);
	}

	if (propInfo.required !== undefined) {
		parts.push(dedent`<prop_required>${propInfo.required}</prop_required>`);
	}

	if (propInfo.defaultValue !== undefined) {
		parts.push(dedent`<prop_default>${propInfo.defaultValue}</prop_default>`);
	}

	parts.push('</prop>');
}

/**
 * Format props section for React or Angular components as XML
 */
function formatPropsXml(componentManifest: ComponentManifest, parts: string[]): void {
	// Try React docgen first
	if (componentManifest.reactDocgen) {
		const parsedDocgen = parseReactDocgen(componentManifest.reactDocgen);
		const propEntries = Object.entries(parsedDocgen.props);

		if (propEntries.length > 0) {
			parts.push('<props>');
			for (const [propName, propInfo] of propEntries) {
				formatPropXml(propName, propInfo, parts);
			}
			parts.push('</props>');
		}
		return;
	}

	// Try Angular Compodoc
	if (componentManifest.compodocData) {
		const compodocData = componentManifest.compodocData;
		const hasInputs = compodocData.inputs && compodocData.inputs.length > 0;
		const hasOutputs = compodocData.outputs && compodocData.outputs.length > 0;

		if (hasInputs) {
			parts.push('<inputs>');
			for (const input of compodocData.inputs) {
				formatPropXml(
					input.name,
					{
						description: input.rawdescription || input.description,
						type: input.type,
						defaultValue: input.defaultValue,
						required: !input.optional,
					},
					parts,
				);
			}
			parts.push('</inputs>');
		}

		if (hasOutputs) {
			parts.push('<outputs>');
			for (const output of compodocData.outputs) {
				parts.push(dedent`<output>
					<output_name>${output.name}</output_name>`);

				if (output.rawdescription || output.description) {
					parts.push(dedent`<output_description>
						${output.rawdescription || output.description}
						</output_description>`);
				}

				parts.push(dedent`<output_type>${output.type || 'EventEmitter<any>'}</output_type>`);
				parts.push('</output>');
			}
			parts.push('</outputs>');
		}
	}
}

/**
 * XML formatter for component manifests.
 * Formats component data into XML structure with tags like <component>, <props>, etc.
 * Supports both React (reactDocgen) and Angular (compodocData) components.
 */
export const xmlFormatter: ManifestFormatter = {
	formatComponentManifest(componentManifest) {
		const parts: string[] = [];

		// Component opening tag
		parts.push(dedent`<component>
			<id>${componentManifest.id}</id>
			<name>${componentManifest.name}</name>`);

		// Description section
		if (componentManifest.description) {
			parts.push(dedent`<description>
				${componentManifest.description}
				</description>`);
		}

		// Stories section - only if there are stories
		if (componentManifest.stories && componentManifest.stories.length > 0) {
			for (const story of componentManifest.stories) {
				if (!story.snippet) {
					continue;
				}
				const storyParts: string[] = [];
				// Convert PascalCase to Human Readable Case
				// "WithSizes" -> "With Sizes"
				storyParts.push(dedent`<story>
					<story_name>${story.name.replace(/([A-Z])/g, ' $1').trim()}</story_name>`);

				if (story.description) {
					storyParts.push(dedent`<story_description>
						${story.description}
						</story_description>`);
				}

				storyParts.push('<story_code>');
				if (componentManifest.import) {
					storyParts.push(`${componentManifest.import}\n`);
				}
				storyParts.push(dedent`${story.snippet}
					</story_code>
					</story>`);

				parts.push(storyParts.join('\n'));
			}
		}

		// Props section (handles both React and Angular)
		formatPropsXml(componentManifest, parts);

		parts.push('</component>');

		return parts.join('\n');
	},

	formatDocsManifest(doc) {
		return dedent`<doc>
			<title>${doc.title}</title>
			<content>
			${doc.content}
			</content>
			</doc>`;
	},

	formatManifestsToLists(manifests) {
		const parts: string[] = [];

		parts.push('<components>');

		for (const component of Object.values(
			manifests.componentManifest.components,
		)) {
			parts.push(dedent`<component>
				<id>${component.id}</id>
				<name>${component.name}</name>`);

			const summary =
				component.summary ??
				(component.description
					? component.description.length > MAX_SUMMARY_LENGTH
						? `${component.description.slice(0, MAX_SUMMARY_LENGTH)}...`
						: component.description
					: undefined);

			if (summary) {
				parts.push(dedent`<summary>
					${summary}
					</summary>`);
			}

			parts.push('</component>');
		}

		parts.push('</components>');

		if (!manifests.docsManifest) {
			return parts.join('\n');
		}

		parts.push('<docs>');

		for (const doc of Object.values(manifests.docsManifest.docs)) {
			const summary = doc.summary ?? extractDocsSummary(doc.content);
			parts.push(dedent`<doc>
				<id>${doc.id}</id>
				<title>${doc.title}</title>`);

			if (summary) {
				parts.push(dedent`<summary>
					${summary}
					</summary>`);
			}

			parts.push('</doc>');
		}

		parts.push('</docs>');

		return parts.join('\n');
	},
};
