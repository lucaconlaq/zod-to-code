import { expect, it } from "vitest";
import { z } from "zod";
import {
	UnsupportedZodEffectError,
	UnsupportedZodFunctionError,
	UnsupportedZodTypeError,
	zodToCode,
} from "../src/index.js";
import { evalSchema } from "./utils/evalZodSchema.js";
import { expectSchemaShape } from "./utils/expectSchemaShape.js";

it("should generate code that produces an equivalent schema", () => {
	const originalSchema = z.object({
		name: z.string(),
		age: z.number(),
		isActive: z.boolean(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle nested objects and optional fields", () => {
	const originalSchema = z.object({
		user: z.object({
			name: z.string(),
			age: z.number().optional(),
			preferences: z.object({
				theme: z.enum(["light", "dark"]),
				notifications: z.boolean().optional(),
			}),
		}),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle arrays and union types", () => {
	const originalSchema = z.object({
		tags: z.array(z.string()),
		metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
		status: z.enum(["active", "inactive", "pending"]).optional(),
		timestamps: z.array(
			z.object({
				date: z.date(),
				type: z.enum(["created", "updated", "deleted"]),
			}),
		),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle optional fields", () => {
	const originalSchema = z.object({
		name: z.string(),
		age: z.number().optional(),
		email: z.string().email().optional(),
		isActive: z.boolean().optional(),
		metadata: z.record(z.string(), z.string()).optional(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle min/max constraints", () => {
	const originalSchema = z.object({
		name: z.string().min(2).max(50),
		age: z.number().min(0).max(120),
		score: z.number().min(0).max(100),
		tags: z.array(z.string()).min(1).max(5),
		description: z.string().min(10).max(1000).optional(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle nullable fields", () => {
	const originalSchema = z.object({
		name: z.string().nullable(),
		age: z.number().nullable(),
		email: z.string().email().nullable(),
		metadata: z.record(z.string(), z.string()).nullable(),
		preferences: z
			.object({
				theme: z.enum(["light", "dark"]).nullable(),
				notifications: z.boolean().nullable(),
			})
			.nullable(),
		tags: z.array(z.string()).nullable(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle default values", () => {
	const originalSchema = z.object({
		name: z.string().default("John Doe"),
		age: z.number().default(18),
		isActive: z.boolean().default(true),
		theme: z.enum(["light", "dark"]).default("light"),
		tags: z.array(z.string()).default(["untagged"]),
		metadata: z.record(z.string(), z.string()).default({}),
		preferences: z
			.object({
				notifications: z.boolean().default(true),
				language: z.string().default("en"),
			})
			.default({}),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle nullish fields", () => {
	const originalSchema = z.object({
		name: z.string().nullish(),
		age: z.number().nullish(),
		email: z.string().email().nullish(),
		metadata: z.record(z.string(), z.string()).nullish(),
		preferences: z
			.object({
				theme: z.enum(["light", "dark"]).nullish(),
				notifications: z.boolean().nullish(),
			})
			.nullish(),
		tags: z.array(z.string()).nullish(),
		// Test with refinements
		description: z.string().min(10).max(1000).nullish(),
		// Test with defaults
		status: z.enum(["active", "inactive"]).nullish().default("active"),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle literal types", () => {
	const originalSchema = z.object({
		status: z.literal("active"),
		number: z.literal(42),
		boolean: z.literal(true),
		null: z.literal(null),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle tuple types", () => {
	const originalSchema = z.object({
		coordinates: z.tuple([z.number(), z.number()]),
		userInfo: z.tuple([z.string(), z.number(), z.boolean()]),
		nestedTuple: z.tuple([z.string(), z.tuple([z.number(), z.number()]), z.boolean()]),
		optionalTuple: z.tuple([z.string(), z.number()]).optional(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle intersection types", () => {
	const originalSchema = z.object({
		// Intersection of two object types
		user: z.intersection(z.object({ name: z.string() }), z.object({ age: z.number() })),
		// Intersection with refinements
		validated: z.intersection(z.string().min(2), z.string().max(50)),
		// Nested intersection
		nested: z.intersection(
			z.object({
				base: z.string(),
				extra: z.intersection(z.object({ a: z.number() }), z.object({ b: z.boolean() })),
			}),
			z.object({ id: z.number() }),
		),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle native enum types", () => {
	enum UserRole {
		ADMIN = "ADMIN",
		USER = "USER",
		GUEST = "GUEST",
	}

	enum Status {
		ACTIVE = 1,
		INACTIVE = 0,
	}

	const originalSchema = z.object({
		role: z.nativeEnum(UserRole, {
			errorMap: () => ({ message: "Invalid role" }),
		}),
		status: z.nativeEnum(Status, {
			errorMap: () => ({ message: "Invalid status" }),
		}),
		optionalRole: z
			.nativeEnum(UserRole, {
				errorMap: () => ({ message: "Invalid role" }),
			})
			.optional(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle native enum types with TypeScript enums", () => {
	enum UserRole {
		ADMIN = "ADMIN",
		USER = "USER",
		GUEST = "GUEST",
	}

	enum Status {
		ACTIVE = 1,
		INACTIVE = 0,
	}

	const originalSchema = z.object({
		role: z.nativeEnum(UserRole),
		status: z.nativeEnum(Status),
		nested: z.object({
			role: z.nativeEnum(UserRole),
			status: z.nativeEnum(Status),
		}),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle promise types", () => {
	const originalSchema = z.object({
		userData: z.promise(
			z.object({
				name: z.string(),
				age: z.number(),
			}),
		),
		simplePromise: z.promise(z.string()),
		nestedPromise: z.promise(z.promise(z.number())),
		optionalPromise: z.promise(z.boolean()).optional(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle readonly types", () => {
	const originalSchema = z.object({
		readonlyArray: z.array(z.string()).readonly(),
		readonlyTuple: z.tuple([z.string(), z.number()]).readonly(),
		nestedReadonly: z.object({
			items: z.array(z.number()).readonly(),
		}),
		optionalReadonly: z.array(z.boolean()).readonly().optional(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle described types", () => {
	const originalSchema = z.object({
		username: z.string().describe("The user's display name"),
		age: z.number().describe("Age in years"),
		email: z.string().email().describe("Valid email address"),
		preferences: z
			.object({
				theme: z.enum(["light", "dark"]).describe("UI theme preference"),
			})
			.describe("User preferences"),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle catch modifier", () => {
	const originalSchema = z.object({
		name: z.string().catch("Unknown"),
		age: z.number().catch(0),
		isActive: z.boolean().catch(false),
		theme: z.enum(["light", "dark"]).catch("light"),
		tags: z.array(z.string()).catch([]),
		metadata: z.record(z.string(), z.string()).catch({}),
		preferences: z
			.object({
				notifications: z.boolean().catch(true),
				language: z.string().catch("en"),
			})
			.catch({ notifications: true, language: "en" }),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle logical composition (and/or)", () => {
	const originalSchema = z.object({
		// AND composition
		validatedString: z.string().min(2).and(z.string().max(50)),
		validatedNumber: z.number().min(0).and(z.number().max(100)),
		validatedObject: z.object({ name: z.string() }).and(z.object({ age: z.number() })),
		// OR composition
		stringOrNumber: z.string().or(z.number()),
		numberOrBoolean: z.number().or(z.boolean()),
		objectOrArray: z.object({ id: z.number() }).or(z.array(z.number())),
		// Nested composition
		complex: z.object({
			value: z.string().min(2).and(z.string().max(50)).or(z.number()),
		}),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle string transformations", () => {
	const originalSchema = z.object({
		trimmed: z.string().trim(),
		lowercase: z.string().toLowerCase(),
		uppercase: z.string().toUpperCase(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle string validations", () => {
	const originalSchema = z.object({
		regex: z.string().regex(/^[A-Za-z]+$/),
		url: z.string().url(),
		uuid: z.string().uuid(),
		email: z.string().email(),
		emoji: z.string().emoji(),
		ip: z.string().ip(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle date validations", () => {
	const originalSchema = z.object({
		datetime: z.string().datetime(),
		date: z.date(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle branded types", () => {
	const originalSchema = z.object({
		branded: z.string().brand<"BrandedString">(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should throw error for unsupported Zod functions", () => {
	const originalSchema = z.object({
		// Using a custom refinement that we don't support
		password: z.string().refine((val) => val.length >= 8, "Password too short"),
	});

	expect(() => zodToCode(originalSchema)).toThrow(UnsupportedZodFunctionError);
});

it("should throw error for unsupported Zod refinements", () => {
	const originalSchema = z.object({
		// Using a custom refinement that we don't support
		password: z.string().refine((val) => val.length >= 8, "Password too short"),
	});

	expect(() => zodToCode(originalSchema)).toThrow(UnsupportedZodFunctionError);
});

it("should throw error for transformations", () => {
	const originalSchema = z.object({
		transformed: z.string().transform((val) => val.toUpperCase()),
	});

	expect(() => zodToCode(originalSchema)).toThrow(UnsupportedZodEffectError);
});

it("should throw error for custom validations", () => {
	const originalSchema = z.object({
		refined: z.string().refine((val) => val.length > 0, "String must not be empty"),
		superRefined: z.string().superRefine((val, ctx) => {
			if (val.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "String must not be empty",
				});
			}
		}),
	});

	expect(() => zodToCode(originalSchema)).toThrow(UnsupportedZodFunctionError);
});

it("should handle basic types", () => {
	const originalSchema = z.object({
		bigint: z.bigint(),
		symbol: z.symbol(),
		void: z.void(),
		never: z.never(),
		unknown: z.unknown(),
		any: z.any(),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle complex types", () => {
	const originalSchema = z.object({
		map: z.map(z.string(), z.number()),
		set: z.set(z.string()),
		function: z.function(),
		lazy: z.lazy(() => z.string()),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should throw error for unsupported Zod types", () => {
	// Create a mock Zod type with an unsupported type name
	const mockZodType = {
		_def: {
			typeName: "UnsupportedType",
		},
	} as z.ZodTypeAny;

	const originalSchema = z.object({
		unsupported: mockZodType,
	});

	expect(() => zodToCode(originalSchema)).toThrow(UnsupportedZodTypeError);
});

it("should throw error for unsupported effect types", () => {
	// Create a mock Zod type with an unsupported effect type
	const mockZodType = {
		_def: {
			typeName: z.ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "unsupported",
			},
		},
	} as z.ZodTypeAny;

	const originalSchema = z.object({
		unsupported: mockZodType,
	});

	expect(() => zodToCode(originalSchema)).toThrow(UnsupportedZodEffectError);
});

it("should handle function types", () => {
	const originalSchema = z.object({
		simple: z.function(),
		withArgs: z.function().args(z.string(), z.number()),
		withReturn: z.function().returns(z.boolean()),
		complete: z.function().args(z.string(), z.number()).returns(z.boolean()),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle integer validations", () => {
	const originalSchema = z.object({
		simple: z.number().int(),
		withMin: z.number().int().min(0),
		withMax: z.number().int().max(100),
		withRange: z.number().int().min(-10).max(10),
		optional: z.number().int().optional(),
		nullable: z.number().int().nullable(),
		withDefault: z.number().int().default(42),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle lazy types", () => {
	const originalSchema = z.object({
		simple: z.lazy(() => z.string()),
		nested: z.lazy(() =>
			z.object({
				name: z.string(),
				age: z.number(),
			}),
		),
		recursive: z.lazy(() =>
			z.object({
				name: z.string(),
				children: z.array(
					z.lazy(() =>
						z.object({
							name: z.string(),
						}),
					),
				),
			}),
		),
	});

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle zod-schema with array at the root", () => {
	const originalSchema = z.array(z.string());

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle zod-schema with number at the root", () => {
	const originalSchema = z.number();

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});

it("should handle zod-schema with boolean at the root", () => {
	const originalSchema = z.boolean();

	const zodCode = zodToCode(originalSchema);
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});
