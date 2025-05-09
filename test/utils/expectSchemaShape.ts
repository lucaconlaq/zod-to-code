import { expect } from "vitest";
import type { z } from "zod";

type ZodTypeDef = {
	typeName: string;
	[key: string]: unknown;
};

interface ZodTypeWithDef {
	_def: ZodTypeDef;
}

interface ZodOptionalDef extends ZodTypeDef {
	innerType: ZodTypeWithDef;
}

interface ZodArrayDef extends ZodTypeDef {
	type: ZodTypeWithDef;
	minLength: { value: number } | null;
	maxLength: { value: number } | null;
}

interface ZodUnionDef extends ZodTypeDef {
	options: ZodTypeWithDef[];
}

interface ZodEnumDef extends ZodTypeDef {
	values: string[];
}

interface ZodLiteralDef extends ZodTypeDef {
	value: unknown;
}

interface ZodObjectDef extends ZodTypeDef {
	shape: () => Record<string, ZodTypeWithDef>;
}

interface ZodNullableDef extends ZodTypeDef {
	innerType: ZodTypeWithDef;
}

interface ZodRecordDef extends ZodTypeDef {
	valueType: ZodTypeWithDef;
}

interface ZodDefaultDef extends ZodTypeDef {
	defaultValue: () => unknown;
	innerType: ZodTypeWithDef;
}

const checkOptionalType = (
	actual: ZodTypeWithDef & { _def: ZodOptionalDef },
	expected: ZodTypeWithDef & { _def: ZodOptionalDef },
) => {
	expect(actual._def.innerType._def.typeName).toStrictEqual(expected._def.innerType._def.typeName);
};

const checkArrayType = (
	actual: ZodTypeWithDef & { _def: ZodArrayDef },
	expected: ZodTypeWithDef & { _def: ZodArrayDef },
) => {
	// Check element type
	const actualElement = actual._def.type;
	const expectedElement = expected._def.type;

	expect(actualElement._def.typeName).toStrictEqual(expectedElement._def.typeName);
	expect(actualElement._def.checks).toEqual(expectedElement._def.checks);

	// Check length constraints
	expect(actual._def.minLength?.value).toEqual(expected._def.minLength?.value);
	expect(actual._def.maxLength?.value).toEqual(expected._def.maxLength?.value);
};

const checkUnionType = (
	actual: ZodTypeWithDef & { _def: ZodUnionDef },
	expected: ZodTypeWithDef & { _def: ZodUnionDef },
) => {
	const actualOptions = actual._def.options;
	const expectedOptions = expected._def.options;

	expect(actualOptions.length).toBe(expectedOptions.length);

	for (let i = 0; i < actualOptions.length; i++) {
		expect(actualOptions[i]._def.typeName).toStrictEqual(expectedOptions[i]._def.typeName);
		// For literal types, also check their values
		if (actualOptions[i]._def.typeName === "ZodLiteral" && expectedOptions[i]._def.typeName === "ZodLiteral") {
			const actualLiteral = actualOptions[i] as ZodTypeWithDef & {
				_def: ZodLiteralDef;
			};
			const expectedLiteral = expectedOptions[i] as ZodTypeWithDef & {
				_def: ZodLiteralDef;
			};
			expect(actualLiteral._def.value).toStrictEqual(expectedLiteral._def.value);
		}
	}
};

const checkEnumType = (
	actual: ZodTypeWithDef & { _def: ZodEnumDef },
	expected: ZodTypeWithDef & { _def: ZodEnumDef },
) => {
	const actualValues = actual._def.values;
	const expectedValues = expected._def.values;

	expect(actualValues).toStrictEqual(expectedValues);
};

const checkNullableType = (
	actual: ZodTypeWithDef & { _def: ZodNullableDef },
	expected: ZodTypeWithDef & { _def: ZodNullableDef },
) => {
	const actualInner = actual._def.innerType;
	const expectedInner = expected._def.innerType;

	expect(actualInner._def.typeName).toStrictEqual(expectedInner._def.typeName);
	expect(actualInner._def.checks).toEqual(expectedInner._def.checks);
};

const checkRecordType = (
	actual: ZodTypeWithDef & { _def: ZodRecordDef },
	expected: ZodTypeWithDef & { _def: ZodRecordDef },
) => {
	const actualValueType = actual._def.valueType;
	const expectedValueType = expected._def.valueType;

	expect(actualValueType._def.typeName).toStrictEqual(expectedValueType._def.typeName);
	expect(actualValueType._def.checks).toEqual(expectedValueType._def.checks);
};

const checkDefaultType = (
	actual: ZodTypeWithDef & { _def: ZodDefaultDef },
	expected: ZodTypeWithDef & { _def: ZodDefaultDef },
) => {
	const actualDefault = actual._def.defaultValue();
	const expectedDefault = expected._def.defaultValue();

	expect(actualDefault).toStrictEqual(expectedDefault);

	const actualInner = actual._def.innerType;
	const expectedInner = expected._def.innerType;

	expect(actualInner._def.typeName).toStrictEqual(expectedInner._def.typeName);
	expect(actualInner._def.checks).toEqual(expectedInner._def.checks);
};

const checkObjectType = (
	actual: ZodTypeWithDef & { _def: ZodObjectDef },
	expected: ZodTypeWithDef & { _def: ZodObjectDef },
) => {
	// First cast to unknown to avoid direct type assertion error
	const actualObj = actual as unknown as z.ZodObject<z.ZodRawShape>;
	const expectedObj = expected as unknown as z.ZodObject<z.ZodRawShape>;
	expectSchemaShape(expectedObj).from(actualObj);
};

const typeCheckers: Record<string, (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void> = {
	ZodOptional: checkOptionalType as (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void,
	ZodArray: checkArrayType as (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void,
	ZodUnion: checkUnionType as (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void,
	ZodEnum: checkEnumType as (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void,
	ZodObject: checkObjectType as (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void,
	ZodNullable: checkNullableType as (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void,
	ZodRecord: checkRecordType as (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void,
	ZodDefault: checkDefaultType as (actual: ZodTypeWithDef, expected: ZodTypeWithDef) => void,
};

const isZodObject = (type: z.ZodTypeAny): type is z.ZodObject<z.ZodRawShape> => {
	return type._def.typeName === "ZodObject";
};

const expectSchemaShape = <T extends z.ZodTypeAny>(expected: T) => {
	return {
		from(actual: T) {
			// If it's not an object, compare the types directly
			if (!isZodObject(actual) || !isZodObject(expected)) {
				expect(actual._def.typeName).toStrictEqual(expected._def.typeName);
				expect(actual._def.checks).toEqual(expected._def.checks);

				// For specific types, use their type checkers
				const typeChecker = typeCheckers[actual._def.typeName];
				if (typeChecker) {
					try {
						typeChecker(actual, expected);
					} catch (error) {
						throw new Error(`Type check failed for type "${actual._def.typeName}": ${error.message}`);
					}
				}
				return;
			}

			// For objects, compare their shapes
			const actualShape = actual.shape;
			const expectedShape = expected.shape;

			const actualKeys = Object.keys(actualShape);
			const expectedKeys = Object.keys(expectedShape);

			expect(actualKeys, "Schema keys do not match").toStrictEqual(expectedKeys);

			for (const key of actualKeys) {
				const actualField = actualShape[key] as ZodTypeWithDef;
				const expectedField = expectedShape[key] as ZodTypeWithDef;

				const actualTypeName = actualField?._def?.typeName;
				const expectedTypeName = expectedField?._def?.typeName;

				expect(actualTypeName, `Type mismatch for field "${key}"`).toStrictEqual(expectedTypeName);

				expect(actualField?._def?.checks, `Validation checks mismatch for field "${key}"`).toEqual(
					expectedField?._def?.checks,
				);

				expect(actualField?._def?.coerce, `Coercion mismatch for field "${key}"`).toEqual(expectedField?._def?.coerce);

				const typeChecker = typeCheckers[actualTypeName];
				if (typeChecker) {
					try {
						typeChecker(actualField, expectedField);
					} catch (error) {
						throw new Error(`Type check failed for field "${key}" of type "${actualTypeName}": ${error.message}`);
					}
				}
			}
		},
	};
};

export { expectSchemaShape };
