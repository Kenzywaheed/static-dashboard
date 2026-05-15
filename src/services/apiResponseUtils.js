export const findFirstArrayInObject = (value, seen = new Set()) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== 'object' || seen.has(value)) {
    return null;
  }

  seen.add(value);

  for (const nestedValue of Object.values(value)) {
    const match = findFirstArrayInObject(nestedValue, seen);

    if (match) {
      return match;
    }
  }

  return null;
};

export const normalizeCollectionResponse = (data, preferredKeys = []) => (
  [
    ...preferredKeys.map((key) => data?.[key]),
    data?.content,
    data?.data,
    data?.items,
    data?.result,
    data?.data?.content,
    data?.data?.items,
    findFirstArrayInObject(data),
    Array.isArray(data) ? data : null,
  ].find(Array.isArray) || []
);

const coerceNumber = (value, fallbackValue) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallbackValue;
};

export const normalizePaginatedResponse = (data, { preferredKeys = [], fallbackPage = 0, fallbackSize = 10 } = {}) => {
  const items = normalizeCollectionResponse(data, preferredKeys);
  const page = coerceNumber(
    data?.page ?? data?.number ?? data?.data?.page ?? data?.data?.number,
    fallbackPage,
  );
  const size = coerceNumber(
    data?.size ?? data?.data?.size,
    fallbackSize,
  );
  const totalElements = coerceNumber(
    data?.totalElements ?? data?.total ?? data?.count ?? data?.data?.totalElements ?? data?.data?.total ?? data?.data?.count,
    items.length,
  );
  const totalPages = coerceNumber(
    data?.totalPages ?? data?.pages ?? data?.data?.totalPages ?? data?.data?.pages,
    totalElements > 0 ? Math.ceil(totalElements / Math.max(size, 1)) : 0,
  );
  const hasNext = typeof data?.hasNext === 'boolean'
    ? data.hasNext
    : typeof data?.data?.hasNext === 'boolean'
      ? data.data.hasNext
      : page + 1 < totalPages;
  const hasPrevious = typeof data?.hasPrevious === 'boolean'
    ? data.hasPrevious
    : typeof data?.data?.hasPrevious === 'boolean'
      ? data.data.hasPrevious
      : page > 0;

  return {
    items,
    page,
    size,
    totalElements,
    totalPages,
    hasNext,
    hasPrevious,
  };
};
