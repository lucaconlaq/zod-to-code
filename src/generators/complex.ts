import { z } from "zod";
import { zodToCode } from "../index.js";
import { zodFieldToString } from "../utils.js";

export const complexTypeGenerators = {
	[z.ZodFirstPartyTypeKind.ZodArray]: (field: z.ZodTypeAny, indent: number) => {
		let baseType = `z.array(${zodFieldToString(field._def.type, indent)})`;
		if (field._def.minLength?.value !== undefined) {
			baseType += `.min(${field._def.minLength.value})`;
		}
		if (field._def.maxLength?.value !== undefined) {
			baseType += `.max(${field._def.maxLength.value})`;
		}
		return baseType;
	},
	[z.ZodFirstPartyTypeKind.ZodObject]: (field: z.ZodTypeAny, indent: number) =>
		zodToCode(field as z.ZodObject<z.ZodRawShape>, indent),
	[z.ZodFirstPartyTypeKind.ZodEnum]: (field: z.ZodTypeAny) =>
		`z.enum([${field._def.values.map((v: string) => `"${v}"`).join(", ")}])`,
	[z.ZodFirstPartyTypeKind.ZodLiteral]: (field: z.ZodTypeAny) => `z.literal(${JSON.stringify(field._def.value)})`,
	[z.ZodFirstPartyTypeKind.ZodUnion]: (field: z.ZodTypeAny, indent: number) => {
		const options = field._def.options.map((opt: z.ZodTypeAny) => zodFieldToString(opt, indent));
		return `${options[0]}.or(${options.slice(1).join(", ")})`;
	},
	[z.ZodFirstPartyTypeKind.ZodIntersection]: (field: z.ZodTypeAny, indent: number) => {
		const leftType = zodFieldToString(field._def.left, indent);
		const rightType = zodFieldToString(field._def.right, indent);
		return `${leftType}.and(${rightType})`;
	},
	[z.ZodFirstPartyTypeKind.ZodTuple]: (field: z.ZodTypeAny, indent: number) =>
		`z.tuple([${field._def.items.map((item: z.ZodTypeAny) => zodFieldToString(item, indent)).join(", ")}])`,
	[z.ZodFirstPartyTypeKind.ZodRecord]: (field: z.ZodTypeAny, indent: number) =>
		`z.record(${zodFieldToString(field._def.keyType, indent)}, ${zodFieldToString(field._def.valueType, indent)})`,
	[z.ZodFirstPartyTypeKind.ZodMap]: (field: z.ZodTypeAny, indent: number) =>
		`z.map(${zodFieldToString(field._def.keyType, indent)}, ${zodFieldToString(field._def.valueType, indent)})`,
	[z.ZodFirstPartyTypeKind.ZodSet]: (field: z.ZodTypeAny, indent: number) =>
		`z.set(${zodFieldToString(field._def.valueType, indent)})`,
	[z.ZodFirstPartyTypeKind.ZodFunction]: () => "z.function()",
	[z.ZodFirstPartyTypeKind.ZodLazy]: () => "z.lazy(() => z.string())",
	[z.ZodFirstPartyTypeKind.ZodPromise]: (field: z.ZodTypeAny, indent: number) =>
		`z.promise(${zodFieldToString(field._def.type, indent)})`,
	[z.ZodFirstPartyTypeKind.ZodNativeEnum]: (field: z.ZodTypeAny) => `z.nativeEnum(${field._def.values.name})`,
} as const;
