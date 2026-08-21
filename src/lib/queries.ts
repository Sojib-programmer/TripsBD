import { queryOptions } from "@tanstack/react-query";

import { getDeals, getHomeFeed } from "./catalog.functions";

export const homeFeedQuery = queryOptions({
  queryKey: ["home-feed"],
  queryFn: () => getHomeFeed(),
  staleTime: 60_000,
});

export const dealsQuery = queryOptions({
  queryKey: ["deals"],
  queryFn: () => getDeals(),
  staleTime: 60_000,
});
