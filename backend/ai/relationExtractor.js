/**
 * BlockD Relation Extraction (RE) Engine
 * Discovers semantic and behavioral relationships between extracted entities:
 * - Direct co-occurrences & aliases (HAS_ALIAS)
 * - Communications (CALL_CONTACT)
 * - Cellular Hardware (DEVICE_USED)
 * - Financial transactions (TRANSFERRED_FUNDS)
 * - Weapon possession & Vehicle operation
 */

const { EntityType, RelationType } = require("./entityTypes");

class RelationExtractor {
  /**
   * Extracts relational edges between identified entities based on text context and canonical records.
   * @param {Array<Object>} entities - Extracted entities
   * @param {Object} canonicalDoc - Canonical document with records
   * @returns {Array<Object>} List of relational edges { source, target, relation, confidence, evidence }
   */
  static extractRelations(entities, canonicalDoc) {
    const relations = [];
    const relKeySet = new Set();

    function addRelation(source, target, relation, confidence, evidence = "") {
      if (!source || !target || source.value === target.value) return;
      const key = `${source.type}:${source.value}-->${relation}-->${target.type}:${target.value}`;
      if (!relKeySet.has(key)) {
        relKeySet.add(key);
        relations.push({
          sourceId: source.id,
          sourceType: source.type,
          sourceValue: source.value,
          targetId: target.id,
          targetType: target.type,
          targetValue: target.value,
          relation,
          confidence: parseFloat(confidence.toFixed(2)),
          evidence
        });
      }
    }

    const entityMapByType = {};
    for (const ent of entities) {
      if (!entityMapByType[ent.type]) entityMapByType[ent.type] = [];
      entityMapByType[ent.type].push(ent);
    }

    const text = canonicalDoc.rawText || "";

    // 1. Text-based Relation: Suspect -> HAS_ALIAS
    const suspects = entityMapByType[EntityType.SUSPECT] || [];
    const aliases = entityMapByType[EntityType.ALIAS] || [];

    for (const s of suspects) {
      for (const a of aliases) {
        // Look for proximity or pattern e.g. "Vikram alias 'Tony'"
        const pattern = new RegExp(`${s.value}\\s+(?:alias|known as|a\\.k\\.a\\.?)\\s+['"]?${a.value}['"]?`, "i");
        if (pattern.test(text)) {
          addRelation(s, a, RelationType.HAS_ALIAS, 0.95, `Direct alias mention in narrative`);
        }
      }
    }

    // 2. Text-based Relation: Suspect -> DRIVES_VEHICLE
    const vehicles = entityMapByType[EntityType.VEHICLE] || [];
    for (const s of suspects) {
      for (const v of vehicles) {
        if (new RegExp(`${s.value}[\\s\\S]{1,60}(?:driving|vehicle|car|bike)[\\s\\S]{1,60}${v.value}`, "i").test(text)) {
          addRelation(s, v, RelationType.DRIVES_VEHICLE, 0.90, `Observed operating vehicle`);
        }
      }
    }

    // 3. Text-based Relation: Suspect -> POSSESSES_WEAPON
    const weapons = entityMapByType[EntityType.WEAPON] || [];
    for (const s of suspects) {
      for (const w of weapons) {
        if (new RegExp(`${s.value}[\\s\\S]{1,80}(?:recovered|seized|carrying|armed with|possessed)[\\s\\S]{1,80}${w.value}`, "i").test(text)) {
          addRelation(s, w, RelationType.POSSESSES_WEAPON, 0.92, `Weapons seized or observed in possession`);
        }
      }
    }

    // 4. Record-based Relations: CDR Calls (CALL_CONTACT & DEVICE_USED)
    if (canonicalDoc.sourceType === "CDR" && Array.isArray(canonicalDoc.records)) {
      const phones = entityMapByType[EntityType.PHONE] || [];
      const imeis = entityMapByType[EntityType.IMEI] || [];

      for (const rec of canonicalDoc.records) {
        const callerEnt = phones.find(p => p.value === rec.caller) || { id: "CALLER", type: EntityType.PHONE, value: rec.caller };
        const recipientEnt = phones.find(p => p.value === rec.recipient) || { id: "RECIPIENT", type: EntityType.PHONE, value: rec.recipient };

        addRelation(
          callerEnt,
          recipientEnt,
          RelationType.CALL_CONTACT,
          0.99,
          `Direct telecom call on ${rec.timestamp} (Duration: ${rec.durationSeconds}s)`
        );

        if (rec.imei) {
          const imeiEnt = imeis.find(i => i.value === rec.imei) || { id: "IMEI", type: EntityType.IMEI, value: rec.imei };
          addRelation(
            callerEnt,
            imeiEnt,
            RelationType.DEVICE_USED,
            0.98,
            `Cell tower session using handset IMEI`
          );
        }
      }
    }

    // 5. Record-based Relations: Financial Transfers (TRANSFERRED_FUNDS)
    if (canonicalDoc.sourceType === "FINANCIAL" && Array.isArray(canonicalDoc.records)) {
      for (const rec of canonicalDoc.records) {
        const senderEnt = { id: `ACC_${rec.senderAccount}`, type: EntityType.BANK_ACCOUNT, value: `${rec.senderName || "Unknown"} (${rec.senderAccount})` };
        const receiverEnt = { id: `ACC_${rec.receiverAccount}`, type: EntityType.BANK_ACCOUNT, value: `${rec.receiverName || "Unknown"} (${rec.receiverAccount})` };

        addRelation(
          senderEnt,
          receiverEnt,
          RelationType.TRANSFERRED_FUNDS,
          0.99,
          `Transfer of ${rec.currency} ${rec.amount} on ${rec.timestamp} [${rec.transactionType}]`
        );
      }
    }

    return relations;
  }
}

module.exports = { RelationExtractor };
