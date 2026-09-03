/**
 * BlockD Criminal Entity Types & Taxonomy
 * Defines standard entity and relation tags for criminal intelligence and graph extraction.
 */

const EntityType = {
  SUSPECT: "SUSPECT",               // Person names (Vikram Sharma, Ramesh Bhai)
  ALIAS: "ALIAS",                   // Nicknames, street names ("Tony", "Bhai", "Vicky")
  PHONE: "PHONE",                   // Standardized phone numbers (+91-9811099881)
  IMEI: "IMEI",                     // 15-digit Device Identifiers (864201041234567)
  VEHICLE: "VEHICLE",               // License plates / registration (DL-01-AB-1234)
  BANK_ACCOUNT: "BANK_ACCOUNT",     // Bank / UPI accounts (HDFC-991283)
  IFSC: "IFSC",                     // Bank branch identifiers (HDFC0001234)
  WEAPON: "WEAPON",                 // Firearms, pistols, ammunition (9mm pistol, country-made firearm)
  LOCATION: "LOCATION",             // Crime scenes, towers, meeting places (Connaught Place, Lodhi Colony)
  ORGANIZATION: "ORGANIZATION"       // Gangs, front companies (Royal Trade Impex Ltd, Syndicate)
};

const RelationType = {
  HAS_ALIAS: "HAS_ALIAS",                   // [Vikram Sharma] -> HAS_ALIAS -> [Tony]
  USES_PHONE: "USES_PHONE",                 // [Vikram] -> USES_PHONE -> [+919811099881]
  DEVICE_USED: "DEVICE_USED",               // [+919811099881] -> DEVICE_USED -> [IMEI_8642...]
  CALL_CONTACT: "CALL_CONTACT",             // [+919811099881] -> CALL_CONTACT -> [+919876543210]
  TRANSFERRED_FUNDS: "TRANSFERRED_FUNDS",   // [Vikram] -> TRANSFERRED_FUNDS -> [Royal Trade Impex Ltd]
  ASSOCIATED_WITH: "ASSOCIATED_WITH",       // [Vikram] -> ASSOCIATED_WITH -> [Ramesh Bhai]
  OPERATES_IN: "OPERATES_IN",               // [Syndicate] -> OPERATES_IN -> [Connaught Place]
  POSSESSES_WEAPON: "POSSESSES_WEAPON",     // [Vikram] -> POSSESSES_WEAPON -> [9mm Pistol]
  DRIVES_VEHICLE: "DRIVES_VEHICLE"          // [Vikram] -> DRIVES_VEHICLE -> [DL-01-AB-1234]
};

module.exports = {
  EntityType,
  RelationType
};
