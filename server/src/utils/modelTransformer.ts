type Prettify<T> = { [K in keyof T]: T[K] } & {};

type Transformer<REQ, NEW, DELETE extends keyof REQ> = {
  <T extends REQ>(a: T): Prettify<Omit<T, DELETE | keyof NEW> & NEW>
  readonly __new?: NEW;
  readonly __delete?: DELETE;
};

export type TransformedType<T, Func extends Transformer<any, any, any>> = 
  Func extends { readonly __new?: infer N; readonly __delete?: infer D } 
    ? Prettify<Omit<T, Exclude<D, undefined> & PropertyKey | keyof Exclude<N, undefined>> & Exclude<N, undefined>> 
    : never;

export function generateTransformer<
  REQ extends Record<PropertyKey, unknown>,
  NEW extends Record<PropertyKey, unknown>,
  DELETE extends keyof REQ,
>(opts: {
  delete?: DELETE[],
  map: (a: REQ) => NEW,
}): Transformer<REQ, NEW, DELETE> {
  return (a) => {
    const c = { ...a };
    const newValues = opts.map(c);
    for (const f of opts.delete ?? []) {
      delete c[f];
    }

    return {
      ...c,
      ...newValues
    };
  };
}
