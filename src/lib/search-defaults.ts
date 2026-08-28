import { addDays, today } from "@/lib/format";

/** Default search params per vertical, so links can navigate with a complete object. */
export const staysSearch = (over: Partial<ReturnType<typeof baseStays>> = {}) => ({
  ...baseStays(),
  ...over,
});

function baseStays() {
  return {
    q: "",
    kind: "all",
    checkIn: today(),
    checkOut: addDays(today(), 2),
    rooms: 1,
    adults: 2,
    children: 0,
    sort: "recommended",
  };
}

export const flightsSearch = () => ({
  from: "DAC",
  to: "CXB",
  depart: today(),
  ret: "",
  trip: "oneway",
  adults: 1,
  children: 0,
  cabin: "any",
  sort: "cheapest",
});

export const packagesSearch = () => ({ depart: today(), pax: 2 });
export const activitiesSearch = () => ({ category: "all" });
export const transfersSearch = () => ({
  airport: "DAC",
  direction: "arrival",
  date: today(),
  time: "10:00",
  pax: 2,
});
export const carsSearch = () => ({
  city: "Dhaka",
  pickup: today(),
  dropoff: addDays(today(), 2),
  driver: "any",
});
export const esimSearch = () => ({ country: "all" });
export const trainsSearch = () => ({ from: "Dhaka", to: "all", date: today(), pax: 1 });
