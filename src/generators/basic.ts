import { z } from "zod";

export const basicTypeGenerators = {
	[z.ZodFirstPartyTypeKind.ZodString]: () => "z.string()",
	[z.ZodFirstPartyTypeKind.ZodNumber]: () => "z.number()",
	[z.ZodFirstPartyTypeKind.ZodBoolean]: () => "z.boolean()",
	[z.ZodFirstPartyTypeKind.ZodDate]: () => "z.date()",
	[z.ZodFirstPartyTypeKind.ZodBigInt]: () => "z.bigint()",
	[z.ZodFirstPartyTypeKind.ZodSymbol]: () => "z.symbol()",
	[z.ZodFirstPartyTypeKind.ZodUndefined]: () => "z.undefined()",
	[z.ZodFirstPartyTypeKind.ZodNull]: () => "z.null()",
	[z.ZodFirstPartyTypeKind.ZodVoid]: () => "z.void()",
	[z.ZodFirstPartyTypeKind.ZodNever]: () => "z.never()",
	[z.ZodFirstPartyTypeKind.ZodUnknown]: () => "z.unknown()",
	[z.ZodFirstPartyTypeKind.ZodAny]: () => "z.any()",
} as const;
