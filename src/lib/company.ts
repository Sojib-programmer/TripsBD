/**
 * Registered operator of Trips.bd. These values are the single source of truth for
 * every legal page, the support page and the Play Console listing. Never publish a
 * contact detail that is not in this file.
 */
export const COMPANY = {
  legalName: "Marketsync Global Ltd.",
  tradingName: "Trips.bd",
  registrationNo: "RAJC-2483/2025",
  tin: "317774303960",
  tradeLicence: "01/13-2665",
  incorporation: "Incorporated under the Companies Act, 1994 (Act XVIII of 1994)",
  addressLines: ["Kashidanga City Gate, Rajpara", "Rajshahi-6201, Bangladesh"],
  phone: "+8801540723530",
  phoneHref: "tel:+8801540723530",
  supportEmail: "support@trips.bd",
  privacyEmail: "privacy@trips.bd",
  website: "https://app.trips.bd",
  supportHours: "09:00–21:00 (BST, UTC+6), within one business day",
} as const;

export const COMPANY_ADDRESS = COMPANY.addressLines.join(", ");
