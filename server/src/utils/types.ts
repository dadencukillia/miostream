import { Type, type TSchema, type TSchemaOptions } from "typebox";

// Enums

export const StringEnum = <T extends readonly string[]>(
    values: T,
    options: TSchemaOptions = {}
) =>
    Type.Unsafe<T[number]>({
        type: 'string',
        enum: [...values],
        ...options,
    });


export const StringEnumResponseType = <T extends readonly string[]>(values: T, description?: string) =>
    Type.Unsafe<string>(StringEnum(values, { description }));

// Nullables

export const Nullable = <T extends TSchema>(schema: T) =>
    Type.Union([schema, Type.Null()]);

export const NullableDateType = Nullable(
    Type.Unsafe<Date | string>(Type.String({
        format: 'date',
        description: 'Date in YYYY-MM-DD format',
        examples: ['2026-05-15']
    }))
);

// other types

export const DateTimeType = Type.Unsafe<Date | string>(Type.String({
    format: 'date-time',
    description: 'ISO 8601 date-time timestamp',
    examples: ['2026-05-15T14:30:00.000Z']
}));

export const BigIntIdResponseType = Type.Unsafe<string | number>(Type.Integer({
    minimum: 1,
    description: 'Unique numeric entity identifier',
    examples: [1024]
}));