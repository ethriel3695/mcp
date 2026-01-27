import type { CompodocData } from '../types.ts';

export type ParsedDocgen = {
	props: Record<
		string,
		{
			description?: string;
			type?: string;
			defaultValue?: string;
			required?: boolean;
		}
	>;
};

/**
 * Parse Compodoc data and convert it to a unified props format.
 * This normalizes Angular's input/output/property structure into a
 * format compatible with the React docgen parser output.
 *
 * @param compodocData - The Compodoc data from the component manifest
 * @returns Parsed docgen with normalized props
 */
export const parseAngularCompodoc = (compodocData: CompodocData): ParsedDocgen => {
	const props: ParsedDocgen['props'] = {};

	// Process inputs (Angular @Input() decorators)
	for (const input of compodocData.inputs ?? []) {
		props[input.name] = {
			description: input.rawdescription || input.description,
			type: input.type,
			defaultValue: input.defaultValue,
			required: !input.optional,
		};
	}

	// Process outputs (Angular @Output() decorators) - mark as event emitters
	for (const output of compodocData.outputs ?? []) {
		props[output.name] = {
			description: output.rawdescription || output.description,
			type: output.type || 'EventEmitter<any>',
			required: false,
		};
	}

	// Process additional properties that aren't inputs/outputs
	for (const property of compodocData.properties ?? []) {
		// Skip if already added as input or output
		if (props[property.name]) {
			continue;
		}

		props[property.name] = {
			description: property.rawdescription || property.description,
			type: property.type,
			defaultValue: property.defaultValue,
			required: !property.optional,
		};
	}

	return { props };
};

/**
 * Format method signature for display
 */
export const formatMethodSignature = (method: {
	name: string;
	args: Array<{ name: string; type: string; optional?: boolean }>;
	returnType: string;
}): string => {
	const args = method.args
		.map((arg) => `${arg.name}${arg.optional ? '?' : ''}: ${arg.type}`)
		.join(', ');
	return `(${args}) => ${method.returnType}`;
};

/**
 * Get a human-readable summary of the component type
 */
export const getComponentTypeSummary = (
	compodocData: CompodocData,
): string => {
	const inputCount = compodocData.inputs?.length ?? 0;
	const outputCount = compodocData.outputs?.length ?? 0;
	const methodCount = compodocData.methods?.length ?? 0;

	const parts: string[] = [];
	if (inputCount > 0) parts.push(`${inputCount} input${inputCount !== 1 ? 's' : ''}`);
	if (outputCount > 0) parts.push(`${outputCount} output${outputCount !== 1 ? 's' : ''}`);
	if (methodCount > 0) parts.push(`${methodCount} method${methodCount !== 1 ? 's' : ''}`);

	if (parts.length === 0) {
		return `Angular ${compodocData.type}`;
	}

	return `Angular ${compodocData.type} with ${parts.join(', ')}`;
};
