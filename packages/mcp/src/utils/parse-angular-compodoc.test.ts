import { describe, expect, it } from 'vitest';

import {
	formatMethodSignature,
	getComponentTypeSummary,
	parseAngularCompodoc,
} from './parse-angular-compodoc';
import type { CompodocData } from '../types';

describe('parseAngularCompodoc', () => {
	it('should parse inputs correctly', () => {
		const compodocData: CompodocData = {
			name: 'ButtonComponent',
			type: 'component',
			inputs: [
				{
					name: 'label',
					type: 'string',
					description: 'The button label',
					optional: false,
				},
				{
					name: 'disabled',
					type: 'boolean',
					description: 'Whether the button is disabled',
					defaultValue: 'false',
					optional: true,
				},
			],
			outputs: [],
			properties: [],
			methods: [],
		};

		const result = parseAngularCompodoc(compodocData);

		expect(result.props).toHaveProperty('label');
		expect(result.props.label).toEqual({
			description: 'The button label',
			type: 'string',
			defaultValue: undefined,
			required: true,
		});

		expect(result.props).toHaveProperty('disabled');
		expect(result.props.disabled).toEqual({
			description: 'Whether the button is disabled',
			type: 'boolean',
			defaultValue: 'false',
			required: false,
		});
	});

	it('should parse outputs correctly', () => {
		const compodocData: CompodocData = {
			name: 'ButtonComponent',
			type: 'component',
			inputs: [],
			outputs: [
				{
					name: 'onClick',
					type: 'EventEmitter<MouseEvent>',
					description: 'Emitted when button is clicked',
				},
			],
			properties: [],
			methods: [],
		};

		const result = parseAngularCompodoc(compodocData);

		expect(result.props).toHaveProperty('onClick');
		expect(result.props.onClick).toEqual({
			description: 'Emitted when button is clicked',
			type: 'EventEmitter<MouseEvent>',
			required: false,
		});
	});

	it('should prefer rawdescription over description', () => {
		const compodocData: CompodocData = {
			name: 'ButtonComponent',
			type: 'component',
			inputs: [
				{
					name: 'label',
					type: 'string',
					description: 'Short description',
					rawdescription: 'Full raw description with more details',
					optional: false,
				},
			],
			outputs: [],
			properties: [],
			methods: [],
		};

		const result = parseAngularCompodoc(compodocData);

		expect(result.props.label?.description).toBe(
			'Full raw description with more details',
		);
	});

	it('should handle empty compodoc data', () => {
		const compodocData: CompodocData = {
			name: 'EmptyComponent',
			type: 'component',
			inputs: [],
			outputs: [],
			properties: [],
			methods: [],
		};

		const result = parseAngularCompodoc(compodocData);

		expect(result.props).toEqual({});
	});

	it('should not duplicate inputs when they exist in properties', () => {
		const compodocData: CompodocData = {
			name: 'ButtonComponent',
			type: 'component',
			inputs: [
				{
					name: 'label',
					type: 'string',
					description: 'From inputs',
					optional: false,
				},
			],
			outputs: [],
			properties: [
				{
					name: 'label',
					type: 'string',
					description: 'From properties',
					optional: false,
				},
			],
			methods: [],
		};

		const result = parseAngularCompodoc(compodocData);

		// Should use the inputs version
		expect(result.props.label?.description).toBe('From inputs');
	});
});

describe('formatMethodSignature', () => {
	it('should format a method with no args', () => {
		const method = {
			name: 'reset',
			args: [],
			returnType: 'void',
		};

		expect(formatMethodSignature(method)).toBe('() => void');
	});

	it('should format a method with args', () => {
		const method = {
			name: 'setValue',
			args: [
				{ name: 'value', type: 'string' },
				{ name: 'options', type: 'SetOptions', optional: true },
			],
			returnType: 'void',
		};

		expect(formatMethodSignature(method)).toBe(
			'(value: string, options?: SetOptions) => void',
		);
	});
});

describe('getComponentTypeSummary', () => {
	it('should summarize a component with inputs and outputs', () => {
		const compodocData: CompodocData = {
			name: 'ButtonComponent',
			type: 'component',
			inputs: [{ name: 'a', type: 'string', optional: false }],
			outputs: [{ name: 'b', type: 'EventEmitter<void>' }],
			properties: [],
			methods: [],
		};

		expect(getComponentTypeSummary(compodocData)).toBe(
			'Angular component with 1 input, 1 output',
		);
	});

	it('should summarize a directive with methods', () => {
		const compodocData: CompodocData = {
			name: 'HighlightDirective',
			type: 'directive',
			inputs: [],
			outputs: [],
			properties: [],
			methods: [
				{ name: 'apply', args: [], returnType: 'void' },
				{ name: 'reset', args: [], returnType: 'void' },
			],
		};

		expect(getComponentTypeSummary(compodocData)).toBe(
			'Angular directive with 2 methods',
		);
	});

	it('should handle component with no props', () => {
		const compodocData: CompodocData = {
			name: 'EmptyComponent',
			type: 'component',
			inputs: [],
			outputs: [],
			properties: [],
			methods: [],
		};

		expect(getComponentTypeSummary(compodocData)).toBe('Angular component');
	});
});
