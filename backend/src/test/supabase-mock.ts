import { vi } from "vitest";

export type QueryResult<T = unknown> = {
  data: T;
  error: { message: string } | null;
};

export function createQuery(result: QueryResult) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then(onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.upsert.mockReturnValue(query);

  return query;
}

export function createSupabaseFrom(...results: QueryResult[]) {
  const queries = results.map((result) => createQuery(result));
  const from = vi.fn();
  queries.forEach((query) => {
    from.mockReturnValueOnce(query);
  });
  if (queries.length > 0) {
    from.mockReturnValue(queries[queries.length - 1]);
  }
  return { from, queries };
}
