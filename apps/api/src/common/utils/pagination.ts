/** Parses list query params, so a request can never ask for an unbounded page. */
export function parsePagination(
  limit: string | undefined,
  page: string | undefined,
  defaults: { limit: number; maxLimit?: number }
) {
  const maxLimit = defaults.maxLimit ?? 200;
  const parsedLimit = Number.parseInt(limit ?? "", 10);
  const parsedPage = Number.parseInt(page ?? "", 10);

  return {
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, maxLimit) : defaults.limit,
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };
}
