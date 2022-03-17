const required = ["appid", "region", "uid", "uuid", "roomToken"] as const;

export type QueryParams = Record<`${typeof required[number]}`, string>;

export function read_query_params() {
  const query = new URLSearchParams(location.search);
  for (const key of required) {
    let value = query.get(key);
    if (value === null) {
      throw new Error(`Missing required query parameter: ${key}`);
    }
  }
  return Object.fromEntries(query.entries()) as QueryParams;
}
