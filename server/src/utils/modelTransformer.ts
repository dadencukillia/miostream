type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Represents a transformation function that removes specific keys and adds/overwrites new fields.
 */
type Transformer<REQ, NEW, DELETE extends keyof REQ> = {
  <T extends REQ>(a: T): Prettify<Omit<T, DELETE | keyof NEW> & NEW>
  readonly __new?: NEW;
  readonly __delete?: DELETE;
};

/**
 * Extracts the resulting shape of type `T` after applying a {@link Transformer} function.
 * 
 * @example
 * ```typescript
 * type TransNameInput = { firstName: string, secondName: string };
 * type TransNameOutput = { fullName: string };
 *
 * const myTransformer = generateTransformer(...);
 *
 * type Human = {
 *   firstName: string,
 *   secondName: string,
 *   age: number,
 *   country: string
 * };
 *
 * type TransformedHuman = TransformedType<Human, typeof myTransformer>;
 * // the same as
 * type TransformedHuman = ReturnType<typeof myTransformer<Human>>;
 * // the same as
 * type TransformedHuman = {
 *   fullName: string,
 *   age: number,
 *   country: string
 * };
 *
 * // TransformedType<TransNameInput, typeof myTransformer> will result `TransNameOutput`
 * ```
 */
export type TransformedType<T, Func extends Transformer<any, any, any>> = 
  Func extends { readonly __new?: infer N; readonly __delete?: infer D } 
    ? Prettify<Omit<T, Exclude<D, undefined> & PropertyKey | keyof Exclude<N, undefined>> & Exclude<N, undefined>> 
    : never;

/**
 * Creates a reusable {@link Transformer} that converts an object by computing
 * new fields from it, optionally removing some of the original fields.
 *
 * Processing order:
 * 1. The input is shallow-copied, so the original object is never mutated.
 * 2. `map` is called with the copy to produce the new fields. At this point
 *    all original fields are still present, including those listed in `delete`.
 * 3. Fields listed in `delete` are removed from the copy.
 * 4. The new fields are merged in. If a key exists in both the input and the
 *    `map` result, the value from `map` wins. If a key is in both `delete`
 *    and the `map` result, it ends up in the output with the new value.
 *
 * @param opts.delete - Optional list of keys to remove from the output
 *   (typically the fields consumed by `map`).
 * @param opts.map - Pure function that receives a copy of the input and
 *   returns the new or overwritten fields.
 *
 * @returns A function that applies the transformation to an object.
 *   {@link TransformedType} can derive the output type for any input.
 *
 * @remarks
 * The copy is shallow: nested objects are shared between the input and the
 * output, so mutating them inside `map` will affect the original.
 *
 * @example
 * ```typescript
 * const fullNameTransformer = generateTransformer({
 *   delete: ['firstName', 'secondName'],
 *   map: (a: { firstName: string; secondName: string }) => ({
 *     fullName: `${a.firstName} ${a.secondName}`,
 *   }),
 * });
 *
 * const result = fullNameTransformer({
 *   firstName: 'Ada',
 *   secondName: 'Lovelace',
 *   age: 36,
 * });
 * // { age: 36, fullName: 'Ada Lovelace' }
 * ```
 */
export function generateTransformer<
  REQ extends Record<PropertyKey, unknown>,
  NEW extends Record<PropertyKey, unknown>,
  DELETE extends keyof REQ,
>(opts: {
  delete?: DELETE[],
  map: (a: REQ) => NEW,
}): Transformer<REQ, NEW, DELETE> {
  return (a) => {
    const inputCopy = { ...a };
    const newValues = opts.map(inputCopy);
    for (const fieldToRemove of opts.delete ?? []) {
      delete inputCopy[fieldToRemove];
    }
    return Object.assign(inputCopy, newValues);
  };
}
