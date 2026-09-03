/**
 * BlockD Entity Resolution & Master Person Index (MPI) Engine
 * Merges fragmented suspect identities, resolves aliases, deduplicates suspects
 * sharing identical phone numbers, IMEIs, or vehicles, and produces unified Master Person Profiles.
 */

const { EntityType } = require("./entityTypes");
const { StringMatcher } = require("./stringMatcher");

class EntityResolver {
  constructor(options = {}) {
    this.nameSimilarityThreshold = options.nameSimilarityThreshold || 0.75;
    this.profiles = new Map(); // personId -> MasterProfile
    this.identifierIndex = new Map(); // identifierKey -> personId
    this.personCounter = 0;
  }

  /**
   * Generates a unique key for deterministic identifiers (Phones, IMEIs, Bank A/Cs, Vehicles).
   */
  static makeIdentifierKey(type, value) {
    return `${type}::${String(value).trim().toLowerCase()}`;
  }

  /**
   * Ingests an extracted entity and associates it with an existing or new Master Person Profile.
   * @param {Object} entity - { type, value, confidence }
   * @param {Object} [context] - { caseId, sourceDocument, associatedIdentifiers }
   * @returns {Object} Master Profile
   */
  resolveEntity(entity, context = {}) {
    const { type, value } = entity;
    const cleanValue = String(value).trim();

    // Check 1: Deterministic Match on shared unique identifiers (Phone, IMEI, Vehicle)
    if ([EntityType.PHONE, EntityType.IMEI, EntityType.VEHICLE, EntityType.BANK_ACCOUNT].includes(type)) {
      const idKey = EntityResolver.makeIdentifierKey(type, cleanValue);
      if (this.identifierIndex.has(idKey)) {
        const existingPersonId = this.identifierIndex.get(idKey);
        const profile = this.profiles.get(existingPersonId);
        this._attachIdentifier(profile, type, cleanValue);
        return profile;
      }
    }

    // Check 2: Match Suspect Name or Alias against existing Master Profiles
    if (type === EntityType.SUSPECT || type === EntityType.ALIAS) {
      for (const [personId, profile] of this.profiles.entries()) {
        const matchScore = this._calculateNameMatch(cleanValue, profile);
        if (matchScore >= this.nameSimilarityThreshold) {
          if (type === EntityType.ALIAS) {
            profile.aliases.add(cleanValue);
          } else {
            profile.nameVariations.add(cleanValue);
          }
          profile.resolutionConfidence = Math.max(profile.resolutionConfidence, matchScore);
          return profile;
        }
      }
    }

    // Check 3: Match via Associated Context Identifiers
    if (context.associatedIdentifiers && Array.isArray(context.associatedIdentifiers)) {
      for (const assoc of context.associatedIdentifiers) {
        // Check A: Identifier Key match (Phone, IMEI, Vehicle, etc.)
        const idKey = EntityResolver.makeIdentifierKey(assoc.type, assoc.value);
        if (this.identifierIndex.has(idKey)) {
          const personId = this.identifierIndex.get(idKey);
          const profile = this.profiles.get(personId);
          if (type === EntityType.SUSPECT) profile.nameVariations.add(cleanValue);
          if (type === EntityType.ALIAS) profile.aliases.add(cleanValue);
          return profile;
        }

        // Check B: Associated Suspect Name match
        if (assoc.type === EntityType.SUSPECT || assoc.type === EntityType.ALIAS) {
          for (const [personId, profile] of this.profiles.entries()) {
            if (this._calculateNameMatch(assoc.value, profile) >= this.nameSimilarityThreshold) {
              if (type === EntityType.SUSPECT) profile.nameVariations.add(cleanValue);
              if (type === EntityType.ALIAS) profile.aliases.add(cleanValue);
              return profile;
            }
          }
        }
      }
    }

    // No match found -> Create new Master Person Index Profile
    return this._createNewProfile(entity, context);
  }

  _calculateNameMatch(name, profile) {
    let bestScore = 0;
    const allNames = [profile.primaryName, ...profile.nameVariations, ...profile.aliases];

    for (const known of allNames) {
      // 1. Exact or Substring
      if (known.toLowerCase() === name.toLowerCase()) return 1.0;
      if (known.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(known.toLowerCase())) {
        bestScore = Math.max(bestScore, 0.85);
      }

      // 2. Phonetic Soundex Match
      if (StringMatcher.isPhoneticMatch(known, name)) {
        bestScore = Math.max(bestScore, 0.88);
      }

      // 3. String Levenshtein Similarity
      const sim = StringMatcher.stringSimilarity(known, name);
      bestScore = Math.max(bestScore, sim);
    }

    return bestScore;
  }

  _createNewProfile(entity, context) {
    this.personCounter++;
    const personId = `MPI_${String(this.personCounter).padStart(4, "0")}`;

    const profile = {
      personId,
      primaryName: entity.value,
      nameVariations: new Set([entity.value]),
      aliases: new Set(entity.type === EntityType.ALIAS ? [entity.value] : []),
      phones: new Set(entity.type === EntityType.PHONE ? [entity.value] : []),
      imeis: new Set(entity.type === EntityType.IMEI ? [entity.value] : []),
      vehicles: new Set(entity.type === EntityType.VEHICLE ? [entity.value] : []),
      bankAccounts: new Set(entity.type === EntityType.BANK_ACCOUNT ? [entity.value] : []),
      casesInvolved: new Set(context.caseId ? [context.caseId] : []),
      resolutionConfidence: entity.confidence || 0.90,
      createdAt: new Date().toISOString()
    };

    this.profiles.set(personId, profile);
    this._indexProfileIdentifiers(profile);

    return profile;
  }

  _attachIdentifier(profile, type, value) {
    const idKey = EntityResolver.makeIdentifierKey(type, value);
    this.identifierIndex.set(idKey, profile.personId);

    if (type === EntityType.PHONE) profile.phones.add(value);
    if (type === EntityType.IMEI) profile.imeis.add(value);
    if (type === EntityType.VEHICLE) profile.vehicles.add(value);
    if (type === EntityType.BANK_ACCOUNT) profile.bankAccounts.add(value);
  }

  _indexProfileIdentifiers(profile) {
    for (const p of profile.phones) this.identifierIndex.set(EntityResolver.makeIdentifierKey(EntityType.PHONE, p), profile.personId);
    for (const i of profile.imeis) this.identifierIndex.set(EntityResolver.makeIdentifierKey(EntityType.IMEI, i), profile.personId);
    for (const v of profile.vehicles) this.identifierIndex.set(EntityResolver.makeIdentifierKey(EntityType.VEHICLE, v), profile.personId);
    for (const b of profile.bankAccounts) this.identifierIndex.set(EntityResolver.makeIdentifierKey(EntityType.BANK_ACCOUNT, b), profile.personId);
  }

  /**
   * Exports all resolved Master Person Index profiles formatted as plain JSON.
   */
  getAllMasterProfiles() {
    return Array.from(this.profiles.values()).map(p => ({
      personId: p.personId,
      primaryName: p.primaryName,
      nameVariations: Array.from(p.nameVariations),
      aliases: Array.from(p.aliases),
      phones: Array.from(p.phones),
      imeis: Array.from(p.imeis),
      vehicles: Array.from(p.vehicles),
      bankAccounts: Array.from(p.bankAccounts),
      casesInvolved: Array.from(p.casesInvolved),
      resolutionConfidence: parseFloat(p.resolutionConfidence.toFixed(2))
    }));
  }
}

module.exports = { EntityResolver };
