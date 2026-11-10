type Prettify<T> = { [K in keyof T]: T[K] } & {};

type Transformer<REQ, NEW, DELETE extends keyof REQ> = <T extends REQ>(a: T) => Prettify<Omit<T, DELETE> & NEW>
export type TransformedType<T, Func> = Func extends Transformer<any, infer NEW, infer DELETE> ? Prettify<Omit<T, DELETE> & NEW> : never;

export function generateTransformer<
  REQ extends {},
  NEW extends {},
  DELETE extends keyof REQ,
>(opts: {
  delete?: DELETE[],
  map: (a: REQ) => NEW,
}): Transformer<REQ, NEW, DELETE> {
  return ((a) => {
    const { ...c } = a;
    const newValues = opts.map(c);
    for (const f of opts.delete ?? []) {
      if (Object.hasOwn(c, f)) delete c[f];
    }

    return {
      ...c,
      ...newValues
    };
  }) as Transformer<REQ, NEW, DELETE>;
}
