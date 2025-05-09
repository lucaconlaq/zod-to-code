import { z } from "zod";
import { zodFieldToString } from "../utils.js";

export const modifierGenerators = {
	[z.ZodFirstPartyTypeKind.ZodOptional]: (field: z.ZodTypeAny, indent: number) =>
		`${zodFieldToString(field._def.innerType, indent)}.optional()`,
	[z.ZodFirstPartyTypeKind.ZodNullable]: (field: z.ZodTypeAny, indent: number) => {
		const innerType = zodFieldToString(field._def.innerType, indent);
		return field._def.nullish ? `${innerType}.nullish()` : `${innerType}.nullable()`;
	},
	[z.ZodFirstPartyTypeKind.ZodReadonly]: (field: z.ZodTypeAny, indent: number) =>
		`${zodFieldToString(field._def.innerType, indent)}.readonly()`,
	[z.ZodFirstPartyTypeKind.ZodDefault]: (field: z.ZodTypeAny, indent: number) =>
		`${zodFieldToString(field._def.innerType, indent)}.default(${JSON.stringify(field._def.defaultValue())})`,
	[z.ZodFirstPartyTypeKind.ZodCatch]: (field: z.ZodTypeAny, indent: number) =>
		`${zodFieldToString(field._def.innerType, indent)}.catch(${JSON.stringify(field._def.catchValue)})`,
	[z.ZodFirstPartyTypeKind.ZodBranded]: (field: z.ZodTypeAny, indent: number) =>
		`${zodFieldToString(field._def.type, indent)}.brand()`,
} as const;
