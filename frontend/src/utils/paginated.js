import api from "../api/axios";

const DEFAULT_PAGE_SIZE = 100;

const normalizeUrl = (url) => {
  if (!url) {
    return null;
  }

  const baseURL = api.defaults.baseURL?.replace(/\/$/, "");
  if (baseURL && url.startsWith(baseURL)) {
    return url.slice(baseURL.length) || "/";
  }

  return url;
};

const withPageSize = (url, pageSize = DEFAULT_PAGE_SIZE) => {
  const parsed = new URL(url, api.defaults.baseURL || window.location.origin);
  if (!parsed.searchParams.has("page_size")) {
    parsed.searchParams.set("page_size", String(pageSize));
  }
  return normalizeUrl(parsed.toString());
};

export const getPageResults = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

export async function fetchAllPages(url, config) {
  const items = [];
  let nextUrl = withPageSize(url);

  while (nextUrl) {
    const response = await api.get(nextUrl, config);
    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    items.push(...getPageResults(data));
    nextUrl = normalizeUrl(data?.next);
  }

  return items;
}
