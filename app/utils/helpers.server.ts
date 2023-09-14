const processSort = (sort: string) => {
  const sortParam = sort.split("-");
  if (sortParam[0] === "undefined") {
    return null;
  }

  return { [`${sortParam[0]}`]: sortParam[1] };
};

export const sortOrder = (defSort: object, sort: string | undefined) => {
  const sortParam = sort ? processSort(sort) : null;

  return sortParam ? { ...sortParam } : { ...defSort };
};
