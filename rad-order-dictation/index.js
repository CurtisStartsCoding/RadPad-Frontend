var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// utils/db-medical-codes-service.ts
var db_medical_codes_service_exports = {};
__export(db_medical_codes_service_exports, {
  getAllMappingsForIcd10: () => getAllMappingsForIcd10,
  getCptCode: () => getCptCode,
  getCptCodesByModality: () => getCptCodesByModality,
  getIcd10Code: () => getIcd10Code,
  getIcd10CodesByCategory: () => getIcd10CodesByCategory,
  getMapping: () => getMapping,
  getMappingsByAppropriateness: () => getMappingsByAppropriateness,
  getMarkdownDoc: () => getMarkdownDoc,
  searchCptCodes: () => searchCptCodes,
  searchIcd10Codes: () => searchIcd10Codes,
  setEnableCache: () => setEnableCache
});
import pg from "pg";
import dotenv from "dotenv";
async function getCptCode(cptCode) {
  const normalizedCode = cptCode.trim();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM medical_cpt_codes WHERE cpt_code = $1",
      [normalizedCode]
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (err) {
    console.error("Error fetching CPT code:", err);
    return null;
  }
}
async function getCptCodesByModality(modality) {
  const normalizedModality = modality.trim().toUpperCase();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM medical_cpt_codes WHERE modality = $1 ORDER BY cpt_code",
      [normalizedModality]
    );
    return rows;
  } catch (err) {
    console.error("Error fetching CPT codes by modality:", err);
    return [];
  }
}
async function getIcd10Code(icd10Code) {
  const normalizedCode = icd10Code.trim();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM medical_icd10_codes WHERE icd10_code = $1",
      [normalizedCode]
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (err) {
    console.error("Error fetching ICD10 code:", err);
    return null;
  }
}
async function getIcd10CodesByCategory(category) {
  const normalizedCategory = category.trim();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM medical_icd10_codes WHERE category = $1 ORDER BY icd10_code",
      [normalizedCategory]
    );
    return rows;
  } catch (err) {
    console.error("Error fetching ICD10 codes by category:", err);
    return [];
  }
}
async function getMapping(icd10Code, cptCode) {
  const normalizedIcd10 = icd10Code.trim();
  const normalizedCpt = cptCode.trim();
  try {
    const { rows } = await pool.query(
      `SELECT * FROM medical_cpt_icd10_mappings 
       WHERE icd10_code = $1 AND cpt_code = $2`,
      [normalizedIcd10, normalizedCpt]
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (err) {
    console.error("Error fetching mapping:", err);
    return null;
  }
}
async function getAllMappingsForIcd10(icd10Code) {
  const normalizedCode = icd10Code.trim();
  try {
    const { rows } = await pool.query(
      `SELECT m.*, c.description as cpt_description, c.modality 
       FROM medical_cpt_icd10_mappings m
       JOIN medical_cpt_codes c ON m.cpt_code = c.cpt_code
       WHERE m.icd10_code = $1
       ORDER BY m.appropriateness DESC`,
      [normalizedCode]
    );
    return rows;
  } catch (err) {
    console.error("Error fetching all mappings for ICD10:", err);
    return [];
  }
}
async function getMappingsByAppropriateness(appropriatenessLevel) {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, i.description as icd10_description, c.description as cpt_description 
       FROM medical_cpt_icd10_mappings m
       JOIN medical_icd10_codes i ON m.icd10_code = i.icd10_code
       JOIN medical_cpt_codes c ON m.cpt_code = c.cpt_code
       WHERE m.appropriateness = $1
       LIMIT 100`,
      [appropriatenessLevel]
    );
    return rows;
  } catch (err) {
    console.error("Error fetching mappings by appropriateness:", err);
    return [];
  }
}
async function getMarkdownDoc(icd10Code) {
  const normalizedCode = icd10Code.trim();
  try {
    const { rows } = await pool.query(
      "SELECT content FROM medical_icd10_markdown_docs WHERE icd10_code = $1",
      [normalizedCode]
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0].content;
  } catch (err) {
    console.error("Error fetching markdown doc:", err);
    return null;
  }
}
async function searchCptCodes(keyword) {
  const normalizedKeyword = keyword.trim();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM medical_cpt_codes WHERE description ILIKE $1 LIMIT 100",
      [`%${normalizedKeyword}%`]
    );
    return rows;
  } catch (err) {
    console.error("Error searching CPT codes:", err);
    return [];
  }
}
async function searchIcd10Codes(keyword) {
  const normalizedKeyword = keyword.trim();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM medical_icd10_codes WHERE description ILIKE $1 LIMIT 100",
      [`%${normalizedKeyword}%`]
    );
    return rows;
  } catch (err) {
    console.error("Error searching ICD10 codes:", err);
    return [];
  }
}
function setEnableCache(enable) {
  console.log(`Cache control is not applicable in direct DB mode. Request to ${enable ? "enable" : "disable"} cache ignored.`);
}
var Pool, pool;
var init_db_medical_codes_service = __esm({
  "utils/db-medical-codes-service.ts"() {
    "use strict";
    ({ Pool } = pg);
    dotenv.config();
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }
});

// utils/redis-cache.ts
async function cacheMedicalCode(type, code, data, ttl = DEFAULT_TTL) {
  try {
    const key = formatKey(type, code);
    memoryCache[key] = {
      data: JSON.parse(JSON.stringify(data)),
      expiry: Date.now() + ttl * 1e3
    };
    console.log(`[Mock Cache] Cached ${type} code: ${code}`);
  } catch (err) {
    console.error(`[Mock Cache] Error caching ${type} code:`, err);
  }
}
async function getMedicalCode(type, code) {
  try {
    const key = formatKey(type, code);
    const item = memoryCache[key];
    if (item && item.expiry > Date.now()) {
      console.log(`[Mock Cache] Cache HIT for ${type} code: ${code}`);
      return item.data;
    }
    console.log(`[Mock Cache] Cache MISS for ${type} code: ${code}`);
    return null;
  } catch (err) {
    console.error(`[Mock Cache] Error retrieving ${type} code:`, err);
    return null;
  }
}
async function cacheMapping(icd10Code, cptCode, mappingData, ttl = DEFAULT_TTL) {
  try {
    const key = formatKey("mapping", `${icd10Code}:${cptCode}`);
    memoryCache[key] = {
      data: JSON.parse(JSON.stringify(mappingData)),
      expiry: Date.now() + ttl * 1e3
    };
  } catch (err) {
    console.error("[Mock Cache] Error caching mapping:", err);
  }
}
async function getMapping2(icd10Code, cptCode) {
  try {
    const key = formatKey("mapping", `${icd10Code}:${cptCode}`);
    const item = memoryCache[key];
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    return null;
  } catch (err) {
    console.error("[Mock Cache] Error retrieving mapping:", err);
    return null;
  }
}
async function cacheAllMappingsForIcd10(icd10Code, mappings, ttl = DEFAULT_TTL) {
  try {
    const key = formatKey("mappings", icd10Code);
    memoryCache[key] = {
      data: JSON.parse(JSON.stringify(mappings)),
      expiry: Date.now() + ttl * 1e3
    };
  } catch (err) {
    console.error("[Mock Cache] Error caching all mappings for ICD10:", err);
  }
}
async function getAllMappingsForIcd102(icd10Code) {
  try {
    const key = formatKey("mappings", icd10Code);
    const item = memoryCache[key];
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    return null;
  } catch (err) {
    console.error("[Mock Cache] Error retrieving all mappings for ICD10:", err);
    return null;
  }
}
async function cacheMarkdownDoc(icd10Code, markdown, ttl = DEFAULT_TTL) {
  try {
    const key = formatKey("markdown", icd10Code);
    memoryCache[key] = {
      data: markdown,
      expiry: Date.now() + ttl * 1e3
    };
  } catch (err) {
    console.error("[Mock Cache] Error caching markdown doc:", err);
  }
}
async function getMarkdownDoc2(icd10Code) {
  try {
    const key = formatKey("markdown", icd10Code);
    const item = memoryCache[key];
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    return null;
  } catch (err) {
    console.error("[Mock Cache] Error retrieving markdown doc:", err);
    return null;
  }
}
var memoryCache, DEFAULT_TTL, formatKey;
var init_redis_cache = __esm({
  "utils/redis-cache.ts"() {
    "use strict";
    memoryCache = {};
    DEFAULT_TTL = 60 * 60 * 24;
    formatKey = (type, id) => {
      const normalizedType = type.trim().toLowerCase();
      const normalizedId = id.trim();
      return `${normalizedType}:${normalizedId}`;
    };
  }
});

// utils/medical-codes-service.ts
var medical_codes_service_exports = {};
__export(medical_codes_service_exports, {
  getAllMappingsForIcd10: () => getAllMappingsForIcd103,
  getCptCode: () => getCptCode2,
  getCptCodesByModality: () => getCptCodesByModality2,
  getIcd10Code: () => getIcd10Code2,
  getIcd10CodesByCategory: () => getIcd10CodesByCategory2,
  getMapping: () => getMapping3,
  getMappingsByAppropriateness: () => getMappingsByAppropriateness2,
  getMarkdownDoc: () => getMarkdownDoc3,
  pool: () => pool2,
  searchCptCodes: () => searchCptCodes2,
  searchIcd10Codes: () => searchIcd10Codes2,
  setEnableCache: () => setEnableCache2
});
import pg2 from "pg";
import dotenv2 from "dotenv";
async function getCptCode2(cptCode) {
  const normalizedCode = cptCode.trim();
  if (ENABLE_CACHE) {
    const cachedData = await getMedicalCode("cpt", normalizedCode);
    if (cachedData) {
      return cachedData;
    }
  }
  try {
    const { rows } = await pool2.query(
      "SELECT * FROM medical_cpt_codes WHERE cpt_code = $1",
      [normalizedCode]
    );
    if (rows.length === 0) {
      return null;
    }
    const cptData = rows[0];
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ) {
      await cacheMedicalCode(
        "cpt",
        normalizedCode,
        cptData,
        CACHE_TTLS.CPT_CODES
      );
    }
    return cptData;
  } catch (err) {
    console.error("Error fetching CPT code:", err);
    return null;
  }
}
async function getCptCodesByModality2(modality) {
  const normalizedModality = modality.trim().toUpperCase();
  const cacheKey = `modality:${normalizedModality}`;
  if (ENABLE_CACHE) {
    const cachedData = await getMedicalCode("cpt", cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  try {
    const { rows } = await pool2.query(
      "SELECT * FROM medical_cpt_codes WHERE modality = $1 ORDER BY cpt_code",
      [normalizedModality]
    );
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ && rows.length > 0) {
      await cacheMedicalCode(
        "cpt",
        cacheKey,
        rows,
        CACHE_TTLS.CPT_CODES
      );
    }
    return rows;
  } catch (err) {
    console.error("Error fetching CPT codes by modality:", err);
    return [];
  }
}
async function getIcd10Code2(icd10Code) {
  const normalizedCode = icd10Code.trim();
  if (ENABLE_CACHE) {
    const cachedData = await getMedicalCode("icd10", normalizedCode);
    if (cachedData) {
      return cachedData;
    }
  }
  try {
    const { rows } = await pool2.query(
      "SELECT * FROM medical_icd10_codes WHERE icd10_code = $1",
      [normalizedCode]
    );
    if (rows.length === 0) {
      return null;
    }
    const icd10Data = rows[0];
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ) {
      await cacheMedicalCode(
        "icd10",
        normalizedCode,
        icd10Data,
        CACHE_TTLS.ICD10_CODES
      );
    }
    return icd10Data;
  } catch (err) {
    console.error("Error fetching ICD10 code:", err);
    return null;
  }
}
async function getIcd10CodesByCategory2(category) {
  const normalizedCategory = category.trim();
  const cacheKey = `category:${normalizedCategory}`;
  if (ENABLE_CACHE) {
    const cachedData = await getMedicalCode("icd10", cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  try {
    const { rows } = await pool2.query(
      "SELECT * FROM medical_icd10_codes WHERE category = $1 ORDER BY icd10_code",
      [normalizedCategory]
    );
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ && rows.length > 0) {
      await cacheMedicalCode(
        "icd10",
        cacheKey,
        rows,
        CACHE_TTLS.ICD10_CODES
      );
    }
    return rows;
  } catch (err) {
    console.error("Error fetching ICD10 codes by category:", err);
    return [];
  }
}
async function getMapping3(icd10Code, cptCode) {
  const normalizedIcd10 = icd10Code.trim();
  const normalizedCpt = cptCode.trim();
  if (ENABLE_CACHE) {
    const cachedData = await getMapping2(normalizedIcd10, normalizedCpt);
    if (cachedData) {
      return cachedData;
    }
  }
  try {
    const { rows } = await pool2.query(
      `SELECT * FROM medical_cpt_icd10_mappings 
       WHERE icd10_code = $1 AND cpt_code = $2`,
      [normalizedIcd10, normalizedCpt]
    );
    if (rows.length === 0) {
      return null;
    }
    const mappingData = rows[0];
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ) {
      await cacheMapping(
        normalizedIcd10,
        normalizedCpt,
        mappingData,
        CACHE_TTLS.MAPPINGS
      );
    }
    return mappingData;
  } catch (err) {
    console.error("Error fetching mapping:", err);
    return null;
  }
}
async function getAllMappingsForIcd103(icd10Code) {
  const normalizedCode = icd10Code.trim();
  if (ENABLE_CACHE) {
    const cachedData = await getAllMappingsForIcd102(normalizedCode);
    if (cachedData) {
      return cachedData;
    }
  }
  try {
    const { rows } = await pool2.query(
      `SELECT m.*, c.description as cpt_description, c.modality 
       FROM medical_cpt_icd10_mappings m
       JOIN medical_cpt_codes c ON m.cpt_code = c.cpt_code
       WHERE m.icd10_code = $1
       ORDER BY m.appropriateness DESC`,
      [normalizedCode]
    );
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ && rows.length > 0) {
      await cacheAllMappingsForIcd10(
        normalizedCode,
        rows,
        CACHE_TTLS.MAPPINGS
      );
    }
    return rows;
  } catch (err) {
    console.error("Error fetching all mappings for ICD10:", err);
    return [];
  }
}
async function getMappingsByAppropriateness2(appropriatenessLevel) {
  const cacheKey = `appropriateness:${appropriatenessLevel}`;
  if (ENABLE_CACHE) {
    const cachedData = await getMedicalCode("mapping", cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  try {
    const { rows } = await pool2.query(
      `SELECT m.*, i.description as icd10_description, c.description as cpt_description 
       FROM medical_cpt_icd10_mappings m
       JOIN medical_icd10_codes i ON m.icd10_code = i.icd10_code
       JOIN medical_cpt_codes c ON m.cpt_code = c.cpt_code
       WHERE m.appropriateness = $1
       LIMIT 100`,
      [appropriatenessLevel]
    );
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ && rows.length > 0) {
      await cacheMedicalCode(
        "mapping",
        cacheKey,
        rows,
        CACHE_TTLS.MAPPINGS
      );
    }
    return rows;
  } catch (err) {
    console.error("Error fetching mappings by appropriateness:", err);
    return [];
  }
}
async function getMarkdownDoc3(icd10Code) {
  const normalizedCode = icd10Code.trim();
  if (ENABLE_CACHE) {
    const cachedData = await getMarkdownDoc2(normalizedCode);
    if (cachedData) {
      return cachedData;
    }
  }
  try {
    const { rows } = await pool2.query(
      "SELECT content FROM medical_icd10_markdown_docs WHERE icd10_code = $1",
      [normalizedCode]
    );
    if (rows.length === 0) {
      return null;
    }
    const content = rows[0].content;
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ) {
      await cacheMarkdownDoc(
        normalizedCode,
        content,
        CACHE_TTLS.MARKDOWN
      );
    }
    return content;
  } catch (err) {
    console.error("Error fetching markdown doc:", err);
    return null;
  }
}
async function searchCptCodes2(keyword) {
  const normalizedKeyword = keyword.trim();
  const cacheKey = `search:${normalizedKeyword}`;
  if (ENABLE_CACHE) {
    const cachedData = await getMedicalCode("cpt", cacheKey);
    if (cachedData) {
      console.log(`\u2705 Found ${cachedData.length} CPT results for "${normalizedKeyword}"`);
      return cachedData;
    }
  }
  try {
    console.log(`\u{1F50D} PostgreSQL lookup for CPT with keyword: "${normalizedKeyword}"`);
    const { rows } = await pool2.query(
      "SELECT * FROM medical_cpt_codes WHERE description ILIKE $1 LIMIT 100",
      [`%${normalizedKeyword}%`]
    );
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ && rows.length > 0) {
      await cacheMedicalCode(
        "cpt",
        cacheKey,
        rows,
        60 * 60 * 24 * 7
        // 7 days for search results
      );
      console.log(`[Mock Cache] Cached ${rows.length} CPT results for "${normalizedKeyword}"`);
    }
    return rows;
  } catch (err) {
    console.error("Error searching CPT codes:", err);
    return [];
  }
}
async function searchIcd10Codes2(keyword) {
  const normalizedKeyword = keyword.trim();
  const cacheKey = `search:${normalizedKeyword}`;
  if (ENABLE_CACHE) {
    const cachedData = await getMedicalCode("icd10", cacheKey);
    if (cachedData) {
      console.log(`\u2705 Found ${cachedData.length} results for "${normalizedKeyword}"`);
      return cachedData;
    }
  }
  try {
    console.log(`\u{1F50D} PostgreSQL lookup for ICD10 with keyword: "${normalizedKeyword}"`);
    const { rows } = await pool2.query(
      "SELECT * FROM medical_icd10_codes WHERE description ILIKE $1 LIMIT 100",
      [`%${normalizedKeyword}%`]
    );
    if (ENABLE_CACHE && ENABLE_CACHE_ON_READ && rows.length > 0) {
      await cacheMedicalCode(
        "icd10",
        cacheKey,
        rows,
        60 * 60 * 24 * 7
        // 7 days for search results
      );
      console.log(`[Mock Cache] Cached ${rows.length} results for "${normalizedKeyword}"`);
    }
    return rows;
  } catch (err) {
    console.error("Error searching ICD10 codes:", err);
    return [];
  }
}
function setEnableCache2(enable) {
  console.log(`Redis caching ${enable ? "enabled" : "disabled"}`);
  global.ENABLE_CACHE = enable;
}
var Pool2, pool2, CACHE_TTLS, ENABLE_CACHE, ENABLE_CACHE_ON_READ;
var init_medical_codes_service = __esm({
  "utils/medical-codes-service.ts"() {
    "use strict";
    init_redis_cache();
    ({ Pool: Pool2 } = pg2);
    dotenv2.config();
    pool2 = new Pool2({
      connectionString: process.env.DATABASE_URL
    });
    CACHE_TTLS = {
      CPT_CODES: 7 * 24 * 60 * 60,
      // 7 days (rarely change)
      ICD10_CODES: 7 * 24 * 60 * 60,
      // 7 days (rarely change)
      MAPPINGS: 24 * 60 * 60,
      // 1 day (may change occasionally)
      MARKDOWN: 3 * 24 * 60 * 60
      // 3 days (semi-static),
    };
    ENABLE_CACHE = true;
    ENABLE_CACHE_ON_READ = true;
    process.on("exit", async () => {
      await pool2.end();
    });
  }
});

// server/index.ts
import express4 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { eq as eq2, and as and2, or as or2, inArray, sql as sql4, desc as desc2, asc as asc2 } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// server/patches/storage-pagination.ts
import { sql as sql3, desc, asc, and, or, eq } from "drizzle-orm";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  diagnosisCodes: () => diagnosisCodes,
  diagnosisCodesRelations: () => diagnosisCodesRelations,
  documentUploads: () => documentUploads,
  documentUploadsRelations: () => documentUploadsRelations,
  emailVerificationTokens: () => emailVerificationTokens,
  emailVerificationTokensRelations: () => emailVerificationTokensRelations,
  insertDiagnosisCodeSchema: () => insertDiagnosisCodeSchema,
  insertDocumentUploadSchema: () => insertDocumentUploadSchema,
  insertEmailVerificationTokenSchema: () => insertEmailVerificationTokenSchema,
  insertOrderDiagnosisSchema: () => insertOrderDiagnosisSchema,
  insertOrderNoteSchema: () => insertOrderNoteSchema,
  insertOrderProcedureSchema: () => insertOrderProcedureSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertOrganizationRelationshipSchema: () => insertOrganizationRelationshipSchema,
  insertOrganizationSchema: () => insertOrganizationSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertPatientInsuranceSchema: () => insertPatientInsuranceSchema,
  insertPatientSchema: () => insertPatientSchema,
  insertProcedureCodeSchema: () => insertProcedureCodeSchema,
  insertRefreshTokenSchema: () => insertRefreshTokenSchema,
  insertUserInvitationSchema: () => insertUserInvitationSchema,
  insertUserSchema: () => insertUserSchema,
  medicalAssistantImportSchema: () => medicalAssistantImportSchema,
  orderDiagnoses: () => orderDiagnoses,
  orderDiagnosesRelations: () => orderDiagnosesRelations,
  orderHistory: () => orderHistory,
  orderHistoryRelations: () => orderHistoryRelations,
  orderNotes: () => orderNotes,
  orderNotesRelations: () => orderNotesRelations,
  orderProcedures: () => orderProcedures,
  orderProceduresRelations: () => orderProceduresRelations,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  organizationRelationships: () => organizationRelationships,
  organizationRelationshipsRelations: () => organizationRelationshipsRelations,
  organizations: () => organizations,
  organizationsRelations: () => organizationsRelations,
  passwordResetTokens: () => passwordResetTokens,
  passwordResetTokensRelations: () => passwordResetTokensRelations,
  patientInsurance: () => patientInsurance,
  patientInsuranceRelations: () => patientInsuranceRelations,
  patients: () => patients,
  patientsRelations: () => patientsRelations,
  physicianImportSchema: () => physicianImportSchema,
  procedureCodes: () => procedureCodes,
  procedureCodesRelations: () => procedureCodesRelations,
  refreshTokens: () => refreshTokens,
  refreshTokensRelations: () => refreshTokensRelations,
  schedulerImportSchema: () => schedulerImportSchema,
  sessions: () => sessions,
  sessionsRelations: () => sessionsRelations,
  userInvitations: () => userInvitations,
  userInvitationsRelations: () => userInvitationsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  unique,
  jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["referring_practice", "radiology_group"] }).notNull(),
  npi: text("npi"),
  taxId: text("tax_id"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phoneNumber: text("phone_number"),
  faxNumber: text("fax_number"),
  contactEmail: text("contact_email"),
  website: text("website"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  relationships: many(organizationRelationships, { relationName: "organization" }),
  relatedOrganizations: many(organizationRelationships, { relationName: "related_organization" }),
  sentOrders: many(orders, { relationName: "referring_organization" }),
  receivedOrders: many(orders, { relationName: "radiology_organization" })
}));
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["admin", "physician", "medical_assistant", "scheduler", "radiologist"] }).notNull(),
  npi: text("npi"),
  specialty: text("specialty"),
  phoneNumber: text("phone_number"),
  signatureUrl: text("signature_url"),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false).notNull(),
  lastLogin: timestamp("last_login"),
  invitationToken: text("invitation_token"),
  invitationSentAt: timestamp("invitation_sent_at"),
  invitationAcceptedAt: timestamp("invitation_accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id]
  }),
  createdOrders: many(orders, { relationName: "created_by" }),
  updatedOrders: many(orders, { relationName: "updated_by" }),
  signedOrders: many(orders, { relationName: "signed_by" }),
  sentInvitations: many(userInvitations, { relationName: "invited_by" })
}));
var userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  invitedByUserId: integer("invited_by_user_id").references(() => users.id),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "physician", "medical_assistant", "scheduler", "radiologist"] }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status", { enum: ["pending", "accepted", "expired"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [userInvitations.organizationId],
    references: [organizations.id]
  }),
  invitedBy: one(users, {
    fields: [userInvitations.invitedByUserId],
    references: [users.id],
    relationName: "invited_by"
  })
}));
var organizationRelationships = pgTable("organization_relationships", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  relatedOrganizationId: integer("related_organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  status: text("status", { enum: ["pending", "active", "rejected", "terminated"] }).notNull().default("pending"),
  initiatedById: integer("initiated_by_id").references(() => users.id),
  approvedById: integer("approved_by_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    unq: unique().on(table.organizationId, table.relatedOrganizationId)
  };
});
var organizationRelationshipsRelations = relations(organizationRelationships, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationRelationships.organizationId],
    references: [organizations.id],
    relationName: "organization"
  }),
  relatedOrganization: one(organizations, {
    fields: [organizationRelationships.relatedOrganizationId],
    references: [organizations.id],
    relationName: "related_organization"
  }),
  initiatedBy: one(users, {
    fields: [organizationRelationships.initiatedById],
    references: [users.id]
  }),
  approvedBy: one(users, {
    fields: [organizationRelationships.approvedById],
    references: [users.id]
  })
}));
var patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  pidn: text("pidn").notNull().unique(),
  // Our internal Patient Identification Number
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  mrn: text("mrn"),
  // External MRN (from EMR system)
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender", { enum: ["male", "female", "other", "unknown"] }).notNull(),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var patientsRelations = relations(patients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [patients.organizationId],
    references: [organizations.id]
  }),
  insuranceRecords: many(patientInsurance),
  orders: many(orders)
}));
var patientInsurance = pgTable("patient_insurance", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").default(false),
  insurerName: text("insurer_name").notNull(),
  policyNumber: text("policy_number").notNull(),
  groupNumber: text("group_number"),
  planType: text("plan_type"),
  // Added plan type (e.g., PPO, HMO, Medicare, etc.)
  policyHolderName: text("policy_holder_name"),
  policyHolderRelationship: text(
    "policy_holder_relationship",
    { enum: ["self", "spouse", "child", "other"] }
  ),
  policyHolderDateOfBirth: text("policy_holder_date_of_birth"),
  verificationStatus: text(
    "verification_status",
    { enum: ["verified", "pending", "failed", "not_verified"] }
  ).default("not_verified"),
  verificationDate: timestamp("verification_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var patientInsuranceRelations = relations(patientInsurance, ({ one }) => ({
  patient: one(patients, {
    fields: [patientInsurance.patientId],
    references: [patients.id]
  })
}));
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  patientPidn: text("patient_pidn"),
  // Patient Identification Number
  referringOrganizationId: integer("referring_organization_id").references(() => organizations.id).notNull(),
  radiologyOrganizationId: integer("radiology_organization_id").references(() => organizations.id).notNull(),
  createdByUserId: integer("created_by_user_id").references(() => users.id).notNull(),
  updatedByUserId: integer("updated_by_user_id").references(() => users.id),
  signedByUserId: integer("signed_by_user_id").references(() => users.id),
  status: text("status", {
    enum: [
      "draft",
      "pending_patient_info",
      "pending_ma_review",
      "pending_signature",
      "complete",
      "delivered",
      "scheduled",
      "performed",
      "rejected",
      "canceled"
    ]
  }).notNull().default("draft"),
  priority: text("priority", { enum: ["routine", "urgent", "stat"] }).notNull().default("routine"),
  originalDictation: text("original_dictation"),
  clinicalIndication: text("clinical_indication"),
  modality: text("modality"),
  bodyPart: text("body_part"),
  laterality: text("laterality", { enum: ["left", "right", "bilateral", "not_applicable"] }),
  cptCode: text("cpt_code"),
  cptCodeDescription: text("cpt_code_description"),
  icd10Codes: text("icd10_codes"),
  icd10CodeDescriptions: text("icd10_code_descriptions"),
  isContrastIndicated: boolean("is_contrast_indicated"),
  patientPregnant: text("patient_pregnant", { enum: ["yes", "no", "unknown"] }),
  patientPregnancyNotes: text("patient_pregnancy_notes"),
  authorizationNumber: text("authorization_number"),
  authorizationStatus: text(
    "authorization_status",
    { enum: ["not_required", "pending", "approved", "denied"] }
  ),
  authorizationDate: timestamp("authorization_date"),
  signatureDate: timestamp("signature_date"),
  approvalNotes: text("approval_notes"),
  rejectionReason: text("rejection_reason"),
  aiProcessingData: text("ai_processing_data"),
  scheduledDate: timestamp("scheduled_date"),
  pdfUrl: text("pdf_url"),
  // Additional fields for enhanced order format
  patientName: text("patient_name"),
  patientDob: text("patient_dob"),
  patientGender: text("patient_gender", { enum: ["male", "female", "other", "unknown"] }),
  patientMrn: text("patient_mrn"),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  insuranceAuthNumber: text("insurance_auth_number"),
  contrast: text("contrast", { enum: ["without", "with", "both", "not_applicable"] }),
  specialInstructions: text("special_instructions"),
  validationStatus: text("validation_status", { enum: ["valid", "invalid", "pending", "override"] }),
  complianceScore: integer("compliance_score"),
  validationNotes: text("validation_notes"),
  validatedAt: timestamp("validated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var ordersRelations = relations(orders, ({ one, many }) => ({
  patient: one(patients, {
    fields: [orders.patientId],
    references: [patients.id]
  }),
  referringOrganization: one(organizations, {
    fields: [orders.referringOrganizationId],
    references: [organizations.id],
    relationName: "referring_organization"
  }),
  radiologyOrganization: one(organizations, {
    fields: [orders.radiologyOrganizationId],
    references: [organizations.id],
    relationName: "radiology_organization"
  }),
  createdBy: one(users, {
    fields: [orders.createdByUserId],
    references: [users.id],
    relationName: "created_by"
  }),
  updatedBy: one(users, {
    fields: [orders.updatedByUserId],
    references: [users.id],
    relationName: "updated_by"
  }),
  signedBy: one(users, {
    fields: [orders.signedByUserId],
    references: [users.id],
    relationName: "signed_by"
  }),
  notes: many(orderNotes),
  history: many(orderHistory),
  diagnoses: many(orderDiagnoses),
  procedures: many(orderProcedures)
}));
var orderNotes = pgTable("order_notes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  // This matches the actual database structure which has a single 'note' column
  // rather than the separate note_type, note_text, and is_internal columns
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var orderNotesRelations = relations(orderNotes, ({ one }) => ({
  order: one(orders, {
    fields: [orderNotes.orderId],
    references: [orders.id]
  }),
  user: one(users, {
    fields: [orderNotes.userId],
    references: [users.id]
  })
}));
var orderHistory = pgTable("order_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: varchar("action"),
  // Add action column to match database
  eventType: text("event_type", {
    enum: [
      "created",
      "updated",
      "status_changed",
      "signed",
      "delivered",
      "scheduled",
      "performed",
      "rejected",
      "canceled"
    ]
  }).notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  details: jsonb("details"),
  // Changed to jsonb to match DB
  createdAt: timestamp("created_at").defaultNow()
});
var orderHistoryRelations = relations(orderHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderHistory.orderId],
    references: [orders.id]
  }),
  user: one(users, {
    fields: [orderHistory.userId],
    references: [users.id]
  })
}));
var sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
var refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  tokenId: text("token_id").notNull().unique(),
  // JTI (JWT ID)
  expiresAt: timestamp("expires_at").notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow()
});
var refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id]
  })
}));
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id]
  })
}));
var emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id]
  })
}));
var documentUploads = pgTable("document_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  patientId: integer("patient_id").references(() => patients.id),
  documentType: text("document_type", {
    enum: [
      "patient_info",
      "insurance_card",
      "order_pdf",
      "clinical_note",
      "other"
    ]
  }).notNull(),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  processingStatus: text("processing_status", {
    enum: [
      "pending",
      "processing",
      "completed",
      "failed"
    ]
  }).notNull().default("pending"),
  processingDetails: text("processing_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var documentUploadsRelations = relations(documentUploads, ({ one }) => ({
  user: one(users, {
    fields: [documentUploads.userId],
    references: [users.id]
  }),
  order: one(orders, {
    fields: [documentUploads.orderId],
    references: [orders.id]
  }),
  patient: one(patients, {
    fields: [documentUploads.patientId],
    references: [patients.id]
  })
}));
var insertOrganizationSchema = createInsertSchema(organizations, {
  name: z.string().min(1).max(100),
  type: z.enum(["referring_practice", "radiology_group"]),
  npi: z.string().length(10).optional(),
  taxId: z.string().optional(),
  phoneNumber: z.string().optional(),
  faxNumber: z.string().optional(),
  contactEmail: z.string().email().optional()
}).omit({ id: true, createdAt: true, updatedAt: true });
var insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["admin", "physician", "medical_assistant", "scheduler"]),
  npi: z.string().length(10).optional(),
  specialty: z.string().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  invitationToken: true,
  invitationSentAt: true,
  invitationAcceptedAt: true
});
var physicianImportSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  npi: z.string().length(10, "NPI must be 10 digits"),
  specialty: z.string().min(1, "Specialty is required"),
  role: z.literal("physician")
});
var medicalAssistantImportSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.literal("medical_assistant")
});
var schedulerImportSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.literal("scheduler")
});
var insertUserInvitationSchema = createInsertSchema(userInvitations, {
  email: z.string().email(),
  role: z.enum(["admin", "physician", "medical_assistant", "scheduler"])
}).omit({ id: true, createdAt: true, updatedAt: true, expiresAt: true, token: true, status: true });
var insertOrganizationRelationshipSchema = createInsertSchema(organizationRelationships).omit({ id: true, createdAt: true, updatedAt: true, status: true, approvedById: true });
var insertPatientSchema = createInsertSchema(patients, {
  pidn: z.string().min(1).max(50),
  // Internal Patient ID Number
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other", "unknown"]),
  mrn: z.string().optional(),
  // External Medical Record Number
  phoneNumber: z.string().optional(),
  email: z.string().email().optional()
}).omit({ id: true, createdAt: true, updatedAt: true });
var insertPatientInsuranceSchema = createInsertSchema(patientInsurance, {
  insurerName: z.string().min(1).max(100),
  policyNumber: z.string().min(1),
  planType: z.string().optional()
  // Added plan type field (PPO, HMO, Medicare, etc.)
}).omit({ id: true, createdAt: true, updatedAt: true, verificationDate: true });
var insertOrderSchema = createInsertSchema(orders, {
  orderNumber: z.string().min(1),
  priority: z.enum(["routine", "urgent", "stat"]),
  originalDictation: z.string().optional(),
  modality: z.string().optional(),
  bodyPart: z.string().optional(),
  laterality: z.enum(["left", "right", "bilateral", "not_applicable"]).optional(),
  patientPidn: z.string().optional(),
  // Patient Identification Number
  createdByUserId: z.number()
  // Add required createdByUserId field
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  // These date fields are added by the server when needed
  signatureDate: true,
  scheduledDate: true,
  authorizationDate: true
});
var insertOrderNoteSchema = createInsertSchema(orderNotes, {
  note: z.string().min(1)
}).omit({ id: true, createdAt: true, updatedAt: true });
var insertDocumentUploadSchema = createInsertSchema(documentUploads, {
  documentType: z.enum(["patient_info", "insurance_card", "order_pdf", "clinical_note", "other"]),
  filename: z.string().min(1),
  fileSize: z.number().positive()
}).omit({ id: true, createdAt: true, updatedAt: true, processingStatus: true, processingDetails: true });
var insertRefreshTokenSchema = createInsertSchema(refreshTokens, {
  token: z.string().min(1),
  tokenId: z.string().min(1),
  expiresAt: z.date(),
  isRevoked: z.boolean().default(false),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
}).omit({ id: true, createdAt: true });
var insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens, {
  token: z.string().min(1),
  expiresAt: z.date(),
  used: z.boolean().default(false)
}).omit({ id: true, createdAt: true });
var insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens, {
  token: z.string().min(1),
  expiresAt: z.date(),
  used: z.boolean().default(false)
}).omit({ id: true, createdAt: true });
var diagnosisCodes = pgTable("diagnosis_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  commonName: text("common_name"),
  category: text("category"),
  anatomicalRegion: text("anatomical_region"),
  laterality: text("laterality", { enum: ["left", "right", "bilateral", "not_applicable"] }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var diagnosisCodesRelations = relations(diagnosisCodes, ({ many }) => ({
  orderDiagnoses: many(orderDiagnoses)
}));
var procedureCodes = pgTable("procedure_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  modality: text("modality"),
  // MRI, CT, X-Ray, etc.
  bodyPart: text("body_part"),
  contrastType: text("contrast_type", { enum: ["without", "with", "both", "not_applicable"] }),
  laterality: text("laterality", { enum: ["left", "right", "bilateral", "not_applicable"] }),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var procedureCodesRelations = relations(procedureCodes, ({ many }) => ({
  orderProcedures: many(orderProcedures)
}));
var orderDiagnoses = pgTable("order_diagnoses", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  diagnosisId: integer("diagnosis_id").references(() => diagnosisCodes.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").default(false),
  confidence: integer("confidence"),
  // AI confidence score 0-100
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    unq: unique().on(table.orderId, table.diagnosisId)
  };
});
var orderDiagnosesRelations = relations(orderDiagnoses, ({ one }) => ({
  order: one(orders, {
    fields: [orderDiagnoses.orderId],
    references: [orders.id]
  }),
  diagnosis: one(diagnosisCodes, {
    fields: [orderDiagnoses.diagnosisId],
    references: [diagnosisCodes.id]
  })
}));
var orderProcedures = pgTable("order_procedures", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  procedureId: integer("procedure_id").references(() => procedureCodes.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").default(false),
  confidence: integer("confidence"),
  // AI confidence score 0-100
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    unq: unique().on(table.orderId, table.procedureId)
  };
});
var orderProceduresRelations = relations(orderProcedures, ({ one }) => ({
  order: one(orders, {
    fields: [orderProcedures.orderId],
    references: [orders.id]
  }),
  procedure: one(procedureCodes, {
    fields: [orderProcedures.procedureId],
    references: [procedureCodes.id]
  })
}));
var insertDiagnosisCodeSchema = createInsertSchema(diagnosisCodes, {
  code: z.string().min(1),
  description: z.string().min(1)
}).omit({ id: true, createdAt: true, updatedAt: true });
var insertProcedureCodeSchema = createInsertSchema(procedureCodes, {
  code: z.string().min(1),
  description: z.string().min(1)
}).omit({ id: true, createdAt: true, updatedAt: true });
var insertOrderDiagnosisSchema = createInsertSchema(orderDiagnoses).omit({ id: true, createdAt: true });
var insertOrderProcedureSchema = createInsertSchema(orderProcedures).omit({ id: true, createdAt: true });

// server/patches/storage-pagination.ts
async function getUsersByOrganizationPaginated(organizationId, limit = 10, offset = 0, sortField = "lastName", sortOrder = "asc", filters = {}) {
  let whereConditions = [eq(users.organizationId, organizationId)];
  if (filters.role && filters.role !== "all") {
    whereConditions.push(eq(users.role, filters.role));
  }
  if (filters.status && filters.status !== "all") {
    if (filters.status === "active") {
      whereConditions.push(eq(users.isActive, true));
    } else if (filters.status === "inactive") {
      whereConditions.push(eq(users.isActive, false));
    } else if (filters.status === "unverified") {
      whereConditions.push(eq(users.emailVerified, false));
    }
  }
  if (filters.search && filters.search.trim() !== "") {
    const search = filters.search.toLowerCase();
    whereConditions.push(
      or(
        sql3`lower(${users.firstName}) like ${`%${search}%`}`,
        sql3`lower(${users.lastName}) like ${`%${search}%`}`,
        sql3`lower(${users.email}) like ${`%${search}%`}`
      )
    );
  }
  let orderByExpr;
  if (sortField === "firstName") {
    orderByExpr = sortOrder === "asc" ? asc(users.firstName) : desc(users.firstName);
  } else if (sortField === "lastName") {
    orderByExpr = sortOrder === "asc" ? asc(users.lastName) : desc(users.lastName);
  } else if (sortField === "email") {
    orderByExpr = sortOrder === "asc" ? asc(users.email) : desc(users.email);
  } else if (sortField === "role") {
    orderByExpr = sortOrder === "asc" ? asc(users.role) : desc(users.role);
  } else if (sortField === "lastLogin") {
    orderByExpr = sortOrder === "asc" ? asc(users.lastLogin) : desc(users.lastLogin);
  } else {
    orderByExpr = [
      sortOrder === "asc" ? asc(users.lastName) : desc(users.lastName),
      sortOrder === "asc" ? asc(users.firstName) : desc(users.firstName)
    ];
  }
  const paginatedUsers = await this.db.select().from(users).where(and(...whereConditions)).orderBy(orderByExpr).limit(limit).offset(offset);
  const [{ count }] = await this.db.select({ count: sql3`count(*)` }).from(users).where(and(...whereConditions));
  return {
    users: paginatedUsers,
    total: count
  };
}

// server/db/pg-migration/schema/medical-codes.ts
import {
  pgTable as pgTable2,
  serial as serial2,
  text as text2,
  timestamp as timestamp2,
  varchar as varchar2,
  boolean as boolean2,
  integer as integer2,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema2 } from "drizzle-zod";
import { relations as relations2 } from "drizzle-orm";
var medicalIcd10Codes = pgTable2("medical_icd10_codes", {
  id: serial2("id").primaryKey(),
  icd10_code: varchar2("icd10_code", { length: 50 }).notNull().unique(),
  description: text2("description").notNull(),
  category: varchar2("category", { length: 100 }),
  priority: varchar2("priority", { length: 50 }),
  chapter: text2("chapter"),
  block: varchar2("block", { length: 50 }),
  block_description: text2("block_description"),
  parent_code: varchar2("parent_code", { length: 50 }),
  is_billable: boolean2("is_billable"),
  imaging_modalities: text2("imaging_modalities"),
  keywords: text2("keywords"),
  primary_imaging: text2("primary_imaging"),
  secondary_imaging: text2("secondary_imaging"),
  contraindications: text2("contraindications"),
  clinical_notes: text2("clinical_notes"),
  associated_symptom_clusters: text2("associated_symptom_clusters"),
  typical_misdiagnosis_codes: text2("typical_misdiagnosis_codes"),
  follow_up_recommendations: text2("follow_up_recommendations"),
  inappropriate_imaging_risk: integer2("inappropriate_imaging_risk"),
  imported_at: timestamp2("imported_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp2("updated_at", { withTimezone: true }).defaultNow(),
  specialty: varchar2("specialty", { length: 100 })
});
var medicalCptCodes = pgTable2("medical_cpt_codes", {
  id: serial2("id").primaryKey(),
  cpt_code: varchar2("cpt_code", { length: 50 }).notNull().unique(),
  description: text2("description").notNull(),
  modality: varchar2("modality", { length: 100 }),
  body_part: varchar2("body_part", { length: 100 }),
  contrast_use: varchar2("contrast_use", { length: 255 }),
  radiotracer: varchar2("radiotracer", { length: 100 }),
  category: varchar2("category", { length: 100 }),
  // Laterality handling removed in schema update
  relative_radiation_level: varchar2("relative_radiation_level", { length: 50 }),
  typical_dose: varchar2("typical_dose", { length: 50 }),
  patient_preparation: text2("patient_preparation"),
  procedure_duration: varchar2("procedure_duration", { length: 50 }),
  regulatory_notes: text2("regulatory_notes"),
  allergy_considerations: text2("allergy_considerations"),
  contraindications: text2("contraindications"),
  post_procedure_care: text2("post_procedure_care"),
  imaging_protocol: text2("imaging_protocol"),
  typical_findings: text2("typical_findings"),
  equipment_needed: text2("equipment_needed"),
  notes: text2("notes"),
  pediatrics: text2("pediatrics"),
  special_populations: text2("special_populations"),
  sedation: text2("sedation"),
  mobility_considerations: text2("mobility_considerations"),
  complexity: varchar2("complexity", { length: 50 }),
  alternatives: text2("alternatives"),
  imported_at: timestamp2("imported_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp2("updated_at", { withTimezone: true }).defaultNow()
});
var medicalCptIcd10Mappings = pgTable2("medical_cpt_icd10_mappings", {
  id: serial2("id").primaryKey(),
  icd10_code: varchar2("icd10_code", { length: 50 }).notNull().references(() => medicalIcd10Codes.icd10_code),
  cpt_code: varchar2("cpt_code", { length: 50 }).notNull().references(() => medicalCptCodes.cpt_code),
  appropriateness: integer2("appropriateness"),
  evidence_level: varchar2("evidence_level", { length: 50 }),
  enhanced_notes: text2("enhanced_notes"),
  citation: text2("citation"),
  justification_key: varchar2("justification_key", { length: 255 }),
  last_updated: timestamp2("last_updated", { withTimezone: true }).defaultNow()
}, (table) => {
  return {
    uniqueMapping: uniqueIndex("unique_medical_mapping").on(table.icd10_code, table.cpt_code)
  };
});
var medicalCptIcd10MappingsRelations = relations2(medicalCptIcd10Mappings, ({ one }) => ({
  icd10Code: one(medicalIcd10Codes, {
    fields: [medicalCptIcd10Mappings.icd10_code],
    references: [medicalIcd10Codes.icd10_code]
  }),
  cptCode: one(medicalCptCodes, {
    fields: [medicalCptIcd10Mappings.cpt_code],
    references: [medicalCptCodes.cpt_code]
  })
}));
var medicalIcd10MarkdownDocs = pgTable2("medical_icd10_markdown_docs", {
  id: serial2("id").primaryKey(),
  icd10_code: varchar2("icd10_code", { length: 50 }).notNull().references(() => medicalIcd10Codes.icd10_code),
  file_path: text2("file_path"),
  content: text2("content").notNull(),
  import_date: timestamp2("import_date", { withTimezone: true }).defaultNow()
});
var medicalIcd10MarkdownDocsRelations = relations2(medicalIcd10MarkdownDocs, ({ one }) => ({
  icd10Code: one(medicalIcd10Codes, {
    fields: [medicalIcd10MarkdownDocs.icd10_code],
    references: [medicalIcd10Codes.icd10_code]
  })
}));
var insertMedicalIcd10CodeSchema = createInsertSchema2(medicalIcd10Codes).omit({
  id: true,
  imported_at: true,
  updated_at: true
});
var insertMedicalCptCodeSchema = createInsertSchema2(medicalCptCodes).omit({
  id: true,
  imported_at: true,
  updated_at: true
});
var insertMedicalCptIcd10MappingSchema = createInsertSchema2(medicalCptIcd10Mappings).omit({
  id: true,
  last_updated: true
});
var insertMedicalIcd10MarkdownDocSchema = createInsertSchema2(medicalIcd10MarkdownDocs).omit({
  id: true,
  import_date: true
});

// server/storage.ts
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import postgres from "postgres";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
var client = postgres(process.env.DATABASE_URL || "");
var db = drizzlePg(client);
var PostgresStorage = class {
  constructor(db3) {
    this.db = db3;
    // Import the getUsersByOrganizationPaginated method from the patch
    this.getUsersByOrganizationPaginated = getUsersByOrganizationPaginated;
  }
  // Password Reset
  async createPasswordResetToken(userId) {
    const token = randomUUID();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    await this.db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false
    });
    return token;
  }
  async getActivePasswordResetTokens(token) {
    const result = await this.db.select({
      userId: passwordResetTokens.userId,
      email: users.email
    }).from(passwordResetTokens).innerJoin(users, eq2(passwordResetTokens.userId, users.id)).where(
      and2(
        eq2(passwordResetTokens.token, token),
        eq2(passwordResetTokens.used, false),
        sql4`${passwordResetTokens.expiresAt} > NOW()`
      )
    ).limit(1);
    if (!result.length) {
      return void 0;
    }
    return {
      userId: result[0].userId,
      email: result[0].email
    };
  }
  async markPasswordResetTokenUsed(token) {
    const result = await this.db.update(passwordResetTokens).set({ used: true }).where(eq2(passwordResetTokens.token, token)).returning();
    return result.length > 0;
  }
  async updateUserPassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await this.db.update(users).set({
      passwordHash,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(users.id, userId)).returning();
    return result.length > 0;
  }
  // Email Verification
  async createEmailVerificationToken(userId) {
    const token = randomUUID();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);
    await this.db.insert(emailVerificationTokens).values({
      userId,
      token,
      expiresAt,
      used: false
    });
    return token;
  }
  async getActiveEmailVerificationTokens(token) {
    const result = await this.db.select({
      userId: emailVerificationTokens.userId,
      email: users.email
    }).from(emailVerificationTokens).innerJoin(users, eq2(emailVerificationTokens.userId, users.id)).where(
      and2(
        eq2(emailVerificationTokens.token, token),
        eq2(emailVerificationTokens.used, false),
        sql4`${emailVerificationTokens.expiresAt} > NOW()`
      )
    ).limit(1);
    if (!result.length) {
      return void 0;
    }
    return {
      userId: result[0].userId,
      email: result[0].email
    };
  }
  async markEmailVerificationTokenUsed(token) {
    const result = await this.db.update(emailVerificationTokens).set({ used: true }).where(eq2(emailVerificationTokens.token, token)).returning();
    return result.length > 0;
  }
  async markUserEmailVerified(userId) {
    const result = await this.db.update(users).set({
      emailVerified: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(users.id, userId)).returning();
    return result.length > 0;
  }
  // Additional utility methods for the application
  /**
   * Create an audit log entry
   */
  async createAuditLog(data) {
    console.log("AUDIT LOG:", data);
    return { id: Date.now(), ...data, createdAt: /* @__PURE__ */ new Date() };
  }
  /**
   * List patients
   */
  async listPatients() {
    return this.db.select().from(patients).orderBy(desc2(patients.updatedAt));
  }
  /**
   * Get patient by ID
   */
  async getPatient(id) {
    const [patient] = await this.db.select().from(patients).where(eq2(patients.id, id)).limit(1);
    return patient;
  }
  /**
   * Get clinical history by patient
   */
  async getClinicalHistoryByPatient(patientId, type) {
    return [];
  }
  /**
   * List orders
   */
  async listOrders(limit) {
    let query = this.db.select().from(orders).orderBy(desc2(orders.updatedAt));
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  }
  /**
   * Get order by ID
   */
  async getOrder(id) {
    const [order] = await this.db.select().from(orders).where(eq2(orders.id, id)).limit(1);
    if (!order) {
      return void 0;
    }
    try {
      const [referringOrganization] = order.referringOrganizationId ? await this.db.select().from(organizations).where(eq2(organizations.id, order.referringOrganizationId)).limit(1) : [null];
      const [radiologyOrganization] = order.radiologyOrganizationId ? await this.db.select().from(organizations).where(eq2(organizations.id, order.radiologyOrganizationId)).limit(1) : [null];
      const [patient] = order.patientId ? await this.db.select().from(patients).where(eq2(patients.id, order.patientId)).limit(1) : [null];
      const [referringPhysician] = order.signedByUserId ? await this.db.select().from(users).where(eq2(users.id, order.signedByUserId)).limit(1) : [null];
      const icd10Descriptions = {};
      if (order.icd10Codes) {
        const icd10CodesList = order.icd10Codes.split(",").map((code) => code.trim());
        const icd10Results = await this.db.select().from(medicalIcd10Codes).where(inArray(medicalIcd10Codes.icd10_code, icd10CodesList));
        icd10Results.forEach((result) => {
          icd10Descriptions[result.icd10_code] = result.description || "";
        });
      }
      let cptDescription = "";
      if (order.cptCode) {
        const [cptResult] = await this.db.select().from(medicalCptCodes).where(eq2(medicalCptCodes.cpt_code, order.cptCode)).limit(1);
        cptDescription = cptResult?.description || "";
      }
      const enhancedOrder = {
        ...order,
        patientPidn: patient?.pidn || order.patientPidn,
        // Explicitly include PIDN
        referringOrganization: referringOrganization ? {
          id: referringOrganization.id,
          name: referringOrganization.name,
          type: referringOrganization.type
        } : null,
        radiologyOrganization: radiologyOrganization ? {
          id: radiologyOrganization.id,
          name: radiologyOrganization.name,
          type: radiologyOrganization.type
        } : null,
        patient: patient ? {
          id: patient.id,
          fullName: patient.fullName,
          mrn: patient.mrn,
          pidn: patient.pidn
        } : null,
        referringPhysician: referringPhysician ? {
          id: referringPhysician.id,
          firstName: referringPhysician.firstName,
          lastName: referringPhysician.lastName,
          email: referringPhysician.email
        } : null,
        icd10Descriptions,
        cptDescription
      };
      return enhancedOrder;
    } catch (error) {
      console.error("Error getting enhanced order details:", error);
      return order;
    }
  }
  /**
   * Get specialty by ID
   */
  async getSpecialty(id) {
    return {
      id,
      name: "General Radiology"
    };
  }
  // Organization Management
  async createOrganization(data) {
    const [organization] = await this.db.insert(organizations).values(data).returning();
    return organization;
  }
  async getOrganizationById(id) {
    const [organization] = await this.db.select().from(organizations).where(eq2(organizations.id, id)).limit(1);
    return organization;
  }
  async getOrganizationByName(name) {
    const [organization] = await this.db.select().from(organizations).where(eq2(organizations.name, name)).limit(1);
    return organization;
  }
  async updateOrganization(id, data) {
    const [organization] = await this.db.update(organizations).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(organizations.id, id)).returning();
    return organization;
  }
  async getAllOrganizations(type) {
    let query = this.db.select().from(organizations);
    if (type) {
      query = query.where(eq2(organizations.type, type));
    }
    return query.orderBy(organizations.name);
  }
  // User Management
  async createUser(data) {
    const { password, ...userData } = data;
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await this.db.insert(users).values({ ...userData, passwordHash }).returning();
    return user;
  }
  async getUserById(id) {
    const [user] = await this.db.select().from(users).where(eq2(users.id, id)).limit(1);
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await this.db.select().from(users).where(eq2(users.email, email)).limit(1);
    return user;
  }
  async updateUser(id, data) {
    const [user] = await this.db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(users.id, id)).returning();
    return user;
  }
  async getUsersByOrganization(organizationId) {
    return this.db.select().from(users).where(eq2(users.organizationId, organizationId)).orderBy(users.lastName, users.firstName);
  }
  // User Authentication
  async validateUserCredentials(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return void 0;
    }
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return void 0;
    }
    await this.db.update(users).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq2(users.id, user.id));
    return user;
  }
  async createSession(userId) {
    const sessionId = randomUUID();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt
    });
    return { sessionId, expiresAt };
  }
  async getSessionById(sessionId) {
    const [session] = await this.db.select().from(sessions).where(eq2(sessions.id, sessionId)).limit(1);
    if (!session || session.expiresAt < /* @__PURE__ */ new Date()) {
      return void 0;
    }
    return { userId: session.userId, expiresAt: session.expiresAt };
  }
  async deleteSession(sessionId) {
    await this.db.delete(sessions).where(eq2(sessions.id, sessionId));
  }
  // Refresh Token Management
  async createRefreshToken(userId, token, tokenId, expiresAt, ipAddress, userAgent) {
    const [refreshToken2] = await this.db.insert(refreshTokens).values({
      userId,
      token,
      tokenId,
      expiresAt,
      ipAddress,
      userAgent,
      issuedAt: /* @__PURE__ */ new Date(),
      isRevoked: false
    }).returning();
    return refreshToken2;
  }
  async getRefreshTokenByToken(token) {
    const [refreshToken2] = await this.db.select().from(refreshTokens).where(eq2(refreshTokens.token, token)).limit(1);
    return refreshToken2;
  }
  async getRefreshTokenByTokenId(tokenId) {
    const [refreshToken2] = await this.db.select().from(refreshTokens).where(eq2(refreshTokens.tokenId, tokenId)).limit(1);
    return refreshToken2;
  }
  async revokeRefreshToken(token) {
    const [refreshToken2] = await this.db.update(refreshTokens).set({ isRevoked: true }).where(eq2(refreshTokens.token, token)).returning();
    return !!refreshToken2;
  }
  async revokeAllUserRefreshTokens(userId) {
    const result = await this.db.update(refreshTokens).set({ isRevoked: true }).where(eq2(refreshTokens.userId, userId)).returning();
    return result.length;
  }
  // User Invitations
  async createUserInvitation(data, invitedBy) {
    const [invitation] = await this.db.insert(userInvitations).values({
      ...data,
      invitedById: invitedBy,
      status: "pending",
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return invitation;
  }
  async getUserInvitationByToken(token) {
    const [invitation] = await this.db.select().from(userInvitations).where(eq2(userInvitations.token, token)).limit(1);
    return invitation;
  }
  async updateUserInvitationStatus(id, status) {
    const [invitation] = await this.db.update(userInvitations).set({ status }).where(eq2(userInvitations.id, id)).returning();
    return invitation;
  }
  async getUserInvitationsByOrganization(organizationId) {
    return this.db.select().from(userInvitations).where(eq2(userInvitations.organizationId, organizationId)).orderBy(userInvitations.createdAt);
  }
  // Organization Relationships
  async createOrganizationRelationship(data) {
    const [relationship] = await this.db.insert(organizationRelationships).values(data).returning();
    return relationship;
  }
  async getOrganizationRelationshipById(id) {
    const [relationship] = await this.db.select().from(organizationRelationships).where(eq2(organizationRelationships.id, id)).limit(1);
    return relationship;
  }
  async updateOrganizationRelationship(id, data) {
    const [relationship] = await this.db.update(organizationRelationships).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(organizationRelationships.id, id)).returning();
    return relationship;
  }
  async getOrganizationRelationshipsByOrganization(organizationId, status) {
    console.log(`[RELATIONSHIPS] Fetching relationships for org ${organizationId}, status: ${status || "all"}`);
    const initiatorOrgTable = alias(organizations, "initiator_org");
    const targetOrgTable = alias(organizations, "target_org");
    let query = this.db.select({
      // Relationship fields
      id: organizationRelationships.id,
      organizationId: organizationRelationships.organizationId,
      relatedOrganizationId: organizationRelationships.relatedOrganizationId,
      status: organizationRelationships.status,
      initiatedById: organizationRelationships.initiatedById,
      approvedById: organizationRelationships.approvedById,
      notes: organizationRelationships.notes,
      createdAt: organizationRelationships.createdAt,
      updatedAt: organizationRelationships.updatedAt,
      // Initiator Org fields (explicitly selected with aliases)
      initiator_id: initiatorOrgTable.id,
      initiator_name: initiatorOrgTable.name,
      initiator_type: initiatorOrgTable.type,
      initiator_npi: initiatorOrgTable.npi,
      initiator_taxId: initiatorOrgTable.taxId,
      initiator_addressLine1: initiatorOrgTable.addressLine1,
      initiator_addressLine2: initiatorOrgTable.addressLine2,
      initiator_city: initiatorOrgTable.city,
      initiator_state: initiatorOrgTable.state,
      initiator_zipCode: initiatorOrgTable.zipCode,
      initiator_phoneNumber: initiatorOrgTable.phoneNumber,
      initiator_faxNumber: initiatorOrgTable.faxNumber,
      initiator_contactEmail: initiatorOrgTable.contactEmail,
      initiator_website: initiatorOrgTable.website,
      initiator_logoUrl: initiatorOrgTable.logoUrl,
      initiator_createdAt: initiatorOrgTable.createdAt,
      initiator_updatedAt: initiatorOrgTable.updatedAt,
      // Target Org fields (explicitly selected with aliases)
      target_id: targetOrgTable.id,
      target_name: targetOrgTable.name,
      target_type: targetOrgTable.type,
      target_npi: targetOrgTable.npi,
      target_taxId: targetOrgTable.taxId,
      target_addressLine1: targetOrgTable.addressLine1,
      target_addressLine2: targetOrgTable.addressLine2,
      target_city: targetOrgTable.city,
      target_state: targetOrgTable.state,
      target_zipCode: targetOrgTable.zipCode,
      target_phoneNumber: targetOrgTable.phoneNumber,
      target_faxNumber: targetOrgTable.faxNumber,
      target_contactEmail: targetOrgTable.contactEmail,
      target_website: targetOrgTable.website,
      target_logoUrl: targetOrgTable.logoUrl,
      target_createdAt: targetOrgTable.createdAt,
      target_updatedAt: targetOrgTable.updatedAt,
      // Initiating User fields
      user_id: users.id,
      user_firstName: users.firstName,
      user_lastName: users.lastName,
      user_email: users.email,
      user_role: users.role,
      user_organizationId: users.organizationId
    }).from(organizationRelationships).leftJoin(initiatorOrgTable, eq2(organizationRelationships.organizationId, initiatorOrgTable.id)).leftJoin(targetOrgTable, eq2(organizationRelationships.relatedOrganizationId, targetOrgTable.id)).leftJoin(users, eq2(organizationRelationships.initiatedById, users.id)).where(
      or2(
        eq2(organizationRelationships.organizationId, organizationId),
        eq2(organizationRelationships.relatedOrganizationId, organizationId)
      )
    );
    if (status) {
      query = query.where(eq2(organizationRelationships.status, status));
    }
    const rawResults = await query.orderBy(desc2(organizationRelationships.updatedAt));
    console.log(`[RELATIONSHIPS] Found ${rawResults.length} raw DB rows for Org ID ${organizationId}`);
    const processedRelationships = rawResults.map((row) => {
      const relationshipData = {
        id: row.id,
        organizationId: row.organizationId,
        relatedOrganizationId: row.relatedOrganizationId,
        status: row.status,
        initiatedById: row.initiatedById,
        approvedById: row.approvedById,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
      const initiatorOrg = row.initiator_id ? {
        id: row.initiator_id,
        name: row.initiator_name,
        type: row.initiator_type,
        npi: row.initiator_npi,
        taxId: row.initiator_taxId,
        addressLine1: row.initiator_addressLine1,
        addressLine2: row.initiator_addressLine2,
        city: row.initiator_city,
        state: row.initiator_state,
        zipCode: row.initiator_zipCode,
        phoneNumber: row.initiator_phoneNumber,
        faxNumber: row.initiator_faxNumber,
        contactEmail: row.initiator_contactEmail,
        website: row.initiator_website,
        logoUrl: row.initiator_logoUrl,
        createdAt: row.initiator_createdAt || /* @__PURE__ */ new Date(),
        updatedAt: row.initiator_updatedAt || /* @__PURE__ */ new Date()
      } : null;
      const targetOrg = row.target_id ? {
        id: row.target_id,
        name: row.target_name,
        type: row.target_type,
        npi: row.target_npi,
        taxId: row.target_taxId,
        addressLine1: row.target_addressLine1,
        addressLine2: row.target_addressLine2,
        city: row.target_city,
        state: row.target_state,
        zipCode: row.target_zipCode,
        phoneNumber: row.target_phoneNumber,
        faxNumber: row.target_faxNumber,
        contactEmail: row.target_contactEmail,
        website: row.target_website,
        logoUrl: row.target_logoUrl,
        createdAt: row.target_createdAt || /* @__PURE__ */ new Date(),
        updatedAt: row.target_updatedAt || /* @__PURE__ */ new Date()
      } : null;
      const initiatingUser = row.user_id ? {
        id: row.user_id,
        firstName: row.user_firstName,
        lastName: row.user_lastName,
        email: row.user_email,
        role: row.user_role,
        organizationId: row.user_organizationId,
        passwordHash: "",
        // Required by type but not used
        isActive: true,
        // Default value
        emailVerified: true,
        // Default value
        createdAt: /* @__PURE__ */ new Date(),
        // Default value
        updatedAt: /* @__PURE__ */ new Date()
        // Default value
      } : null;
      if (!initiatorOrg || !targetOrg) {
        console.warn(`[RELATIONSHIPS] Row for Rel ID ${row.id} is missing org data! Initiator: ${!!initiatorOrg}, Target: ${!!targetOrg}`);
      }
      let result;
      if (row.organizationId === organizationId) {
        result = {
          ...relationshipData,
          organization: initiatorOrg,
          // This is the current organization (us)
          relatedOrganization: targetOrg,
          // This is the partner organization (them)
          initiatedByUser: initiatingUser
        };
      } else {
        result = {
          ...relationshipData,
          organization: targetOrg,
          // In this case, we're presenting things from "our" perspective
          relatedOrganization: initiatorOrg,
          // So "they" initiated, but from UI perspective, we're the org
          initiatedByUser: initiatingUser
        };
      }
      if (!result.organization || !result.relatedOrganization) {
        console.warn(
          `[RELATIONSHIPS] Relationship ID ${row.id} has missing organization data after processing!`,
          JSON.stringify({
            hasOrg: !!result.organization,
            hasRelatedOrg: !!result.relatedOrganization,
            ourId: organizationId,
            relOrgId: row.organizationId,
            relRelatedOrgId: row.relatedOrganizationId
          })
        );
      }
      return result;
    });
    console.log(`[RELATIONSHIPS] Returning ${processedRelationships.length} fully constructed relationships for Org ID ${organizationId}`);
    return processedRelationships;
  }
  // Patient Management
  async createPatient(data) {
    const [patient] = await this.db.insert(patients).values(data).returning();
    return patient;
  }
  async getPatientById(id) {
    const [patient] = await this.db.select().from(patients).where(eq2(patients.id, id)).limit(1);
    return patient;
  }
  async updatePatient(id, data) {
    const [patient] = await this.db.update(patients).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(patients.id, id)).returning();
    return patient;
  }
  async getPatientsByOrganization(organizationId, search, limit, offset) {
    let query = this.db.select().from(patients2).where(eq2(patients2.organizationId, organizationId));
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.where(
        or2(
          sql4`lower(${patients2.firstName}) like ${`%${searchLower}%`}`,
          sql4`lower(${patients2.lastName}) like ${`%${searchLower}%`}`,
          sql4`lower(${patients2.mrn}) like ${`%${searchLower}%`}`
        )
      );
    }
    const totalResult = await this.db.select({ count: sql4`count(*)` }).from(patients2).where(eq2(patients2.organizationId, organizationId));
    const total = totalResult[0]?.count || 0;
    if (limit) {
      query = query.limit(limit);
      if (offset) {
        query = query.offset(offset);
      }
    }
    const patients2 = await query.orderBy(desc2(patients2.updatedAt));
    return { patients: patients2, total };
  }
  // Patient Insurance
  async createPatientInsurance(data) {
    const [insurance] = await this.db.insert(patientInsurances).values(data).returning();
    return insurance;
  }
  async getPatientInsuranceById(id) {
    const [insurance] = await this.db.select().from(patientInsurances).where(eq2(patientInsurances.id, id)).limit(1);
    return insurance;
  }
  async updatePatientInsurance(id, data) {
    const [insurance] = await this.db.update(patientInsurances).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(patientInsurances.id, id)).returning();
    return insurance;
  }
  async getPatientInsuranceByPatient(patientId) {
    return this.db.select().from(patientInsurances).where(eq2(patientInsurances.patientId, patientId)).orderBy(desc2(patientInsurances.isPrimary));
  }
  // Order Management
  async createOrder(data) {
    const [order] = await this.db.insert(orders).values(data).returning();
    await this.db.insert(orderHistory).values({
      orderId: order.id,
      userId: data.createdByUserId,
      eventType: "created",
      newStatus: data.status
    });
    return order;
  }
  async getOrderById(id) {
    const [order] = await this.db.select().from(orders).where(eq2(orders.id, id)).limit(1);
    return order;
  }
  async getOrderByNumber(orderNumber) {
    const [order] = await this.db.select().from(orders).where(eq2(orders.orderNumber, orderNumber)).limit(1);
    return order;
  }
  async updateOrder(id, data) {
    const currentOrder = await this.getOrderById(id);
    if (!currentOrder) {
      return void 0;
    }
    const [order] = await this.db.update(orders).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(orders.id, id)).returning();
    await this.db.insert(orderHistory).values({
      orderId: id,
      userId: data.updatedByUserId,
      eventType: "updated"
    });
    return order;
  }
  async updateOrderStatus(id, status, userId, notes) {
    const currentOrder = await this.getOrderById(id);
    if (!currentOrder) {
      return void 0;
    }
    const [order] = await this.db.update(orders).set({
      status,
      updatedAt: /* @__PURE__ */ new Date(),
      updatedByUserId: userId
    }).where(eq2(orders.id, id)).returning();
    await this.db.insert(orderHistory).values({
      orderId: id,
      userId,
      eventType: "status_changed",
      previousStatus: currentOrder.status,
      newStatus: status,
      details: notes
    });
    return order;
  }
  async getOrdersByFilters(filters, sort, pagination) {
    let query = this.db.select().from(orders);
    if (filters.referringOrganizationId !== void 0) {
      query = query.where(eq2(orders.referringOrganizationId, filters.referringOrganizationId));
    }
    if (filters.radiologyOrganizationId !== void 0) {
      query = query.where(eq2(orders.radiologyOrganizationId, filters.radiologyOrganizationId));
    }
    if (filters.patientId !== void 0) {
      query = query.where(eq2(orders.patientId, filters.patientId));
    }
    if (filters.createdByUserId !== void 0) {
      query = query.where(eq2(orders.createdByUserId, filters.createdByUserId));
    }
    if (filters.signedByUserId !== void 0) {
      query = query.where(eq2(orders.signedByUserId, filters.signedByUserId));
    }
    if (filters.status !== void 0) {
      if (Array.isArray(filters.status)) {
        query = query.where(inArray(orders.status, filters.status));
      } else {
        query = query.where(eq2(orders.status, filters.status));
      }
    }
    if (filters.fromDate !== void 0) {
      query = query.where(gte(orders.createdAt, filters.fromDate));
    }
    if (filters.toDate !== void 0) {
      query = query.where(lte(orders.createdAt, filters.toDate));
    }
    let countQuery = this.db.select({ count: sql4`count(${orders.id})` }).from(orders);
    if (filters.referringOrganizationId !== void 0) {
      countQuery = countQuery.where(eq2(orders.referringOrganizationId, filters.referringOrganizationId));
    }
    if (filters.radiologyOrganizationId !== void 0) {
      countQuery = countQuery.where(eq2(orders.radiologyOrganizationId, filters.radiologyOrganizationId));
    }
    if (filters.patientId !== void 0) {
      countQuery = countQuery.where(eq2(orders.patientId, filters.patientId));
    }
    if (filters.createdByUserId !== void 0) {
      countQuery = countQuery.where(eq2(orders.createdByUserId, filters.createdByUserId));
    }
    if (filters.signedByUserId !== void 0) {
      countQuery = countQuery.where(eq2(orders.signedByUserId, filters.signedByUserId));
    }
    if (filters.status !== void 0) {
      if (Array.isArray(filters.status)) {
        countQuery = countQuery.where(inArray(orders.status, filters.status));
      } else {
        countQuery = countQuery.where(eq2(orders.status, filters.status));
      }
    }
    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;
    if (sort) {
      const column = orders[sort.field];
      if (column) {
        query = query.orderBy(sort.direction === "asc" ? asc2(column) : desc2(column));
      } else {
        query = query.orderBy(desc2(orders.createdAt));
      }
    } else {
      query = query.orderBy(desc2(orders.createdAt));
    }
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset || 0);
    }
    const results = await query;
    return { orders: results, total };
  }
  // Order Notes
  async createOrderNote(data) {
    const [note] = await this.db.insert(orderNotes).values(data).returning();
    return note;
  }
  async getOrderNoteById(id) {
    const [note] = await this.db.select().from(orderNotes).where(eq2(orderNotes.id, id)).limit(1);
    return note;
  }
  async getOrderNotesByOrder(orderId) {
    const notes = await this.db.select({
      id: orderNotes.id,
      orderId: orderNotes.orderId,
      userId: orderNotes.userId,
      noteType: orderNotes.noteType,
      noteText: orderNotes.noteText,
      isInternal: orderNotes.isInternal,
      createdAt: orderNotes.createdAt,
      updatedAt: orderNotes.updatedAt
    }).from(orderNotes).where(eq2(orderNotes.orderId, orderId)).orderBy(desc2(orderNotes.createdAt));
    const results = [];
    for (const note of notes) {
      const [user] = await this.db.select().from(users).where(eq2(users.id, note.userId)).limit(1);
      if (user) {
        results.push({
          ...note,
          user
        });
      }
    }
    return results;
  }
  // Order History
  async getOrderHistoryByOrder(orderId) {
    const history = await this.db.select({
      id: orderHistory.id,
      orderId: orderHistory.orderId,
      userId: orderHistory.userId,
      eventType: orderHistory.eventType,
      previousStatus: orderHistory.previousStatus,
      newStatus: orderHistory.newStatus,
      details: orderHistory.details,
      createdAt: orderHistory.createdAt
    }).from(orderHistory).where(eq2(orderHistory.orderId, orderId)).orderBy(desc2(orderHistory.createdAt));
    const results = [];
    for (const entry of history) {
      let user = null;
      if (entry.userId) {
        const [userResult] = await this.db.select().from(users).where(eq2(users.id, entry.userId)).limit(1);
        user = userResult;
      }
      results.push({
        ...entry,
        user
      });
    }
    return results;
  }
  // Document Uploads
  async createDocumentUpload(data) {
    const [document] = await this.db.insert(documentUploads).values(data).returning();
    return document;
  }
  async getDocumentUploadById(id) {
    const [document] = await this.db.select().from(documentUploads).where(eq2(documentUploads.id, id)).limit(1);
    return document;
  }
  async updateDocumentUploadProcessingStatus(id, status, details) {
    const [document] = await this.db.update(documentUploads).set({
      processingStatus: status,
      processingDetails: details,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(documentUploads.id, id)).returning();
    return document;
  }
  async getDocumentUploadsByFilters(filters) {
    let query = this.db.select().from(documentUploads);
    if (filters.userId !== void 0) {
      query = query.where(eq2(documentUploads.uploadedByUserId, filters.userId));
    }
    if (filters.orderId !== void 0) {
      query = query.where(eq2(documentUploads.orderId, filters.orderId));
    }
    if (filters.patientId !== void 0) {
      query = query.where(eq2(documentUploads.patientId, filters.patientId));
    }
    if (filters.documentType !== void 0) {
      query = query.where(eq2(documentUploads.documentType, filters.documentType));
    }
    return query.orderBy(desc2(documentUploads.createdAt));
  }
  // Compliance and Statistics methods - stubs for now
  async getComplianceBySpecialty(specialtyId) {
    return {
      specialtyId: specialtyId || 0,
      totalOrders: 0,
      compliantOrders: 0,
      complianceRate: 100,
      mostCommonNonCompliantReason: null
    };
  }
  async getOrderStatistics(filters) {
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      rejectedOrders: 0,
      averageCompletionTime: 0,
      ordersBySpecialty: []
    };
  }
  // Alert Management
  async listActiveAlerts() {
    return [];
  }
  async updateAlertStatus(alertId, status, userId) {
    return { id: alertId, status };
  }
  async getRelationshipBetweenOrganizations(organizationId, relatedOrganizationId) {
    const [relationship] = await this.db.select().from(organizationRelationships).where(
      or2(
        and2(
          eq2(organizationRelationships.organizationId, organizationId),
          eq2(organizationRelationships.relatedOrganizationId, relatedOrganizationId)
        ),
        and2(
          eq2(organizationRelationships.organizationId, relatedOrganizationId),
          eq2(organizationRelationships.relatedOrganizationId, organizationId)
        )
      )
    ).limit(1);
    return relationship;
  }
  async getActiveRelationships(organizationId) {
    return this.getOrganizationRelationshipsByOrganization(organizationId, "active");
  }
  async searchOrganizationsByName(search) {
    return this.db.select().from(organizations).where(
      sql4`LOWER(${organizations.name}) LIKE LOWER(${"%" + search + "%"})`
    ).orderBy(organizations.name);
  }
};
var storage = new PostgresStorage(db);

// server/routes.ts
import { z as z8 } from "zod";

// server/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

// shared/data/specialties.json
var specialties_default = {
  specialtyWordCounts: {
    "Family Medicine": 29,
    Dermatology: 30,
    Orthopedics: 30,
    "General Radiology": 30,
    Ultrasound: 30,
    "Computed Tomography (CT)": 30,
    "Magnetic Resonance Imaging (MRI)": 30,
    Fluoroscopy: 30,
    Oncology: 31,
    Hematology: 31,
    Endocrinology: 31,
    Vascular: 31,
    Urogenital: 31,
    "Allergy & Immunology": 31,
    "Internal Medicine": 31,
    Neurology: 32,
    "Women's Health": 32,
    Gastroenterology: 32,
    Pulmonary: 32,
    Rheumatology: 32,
    "Body Imaging": 32,
    "Oncologic Imaging": 32,
    "Genitourinary Radiology": 32,
    Cardiology: 33,
    Trauma: 33,
    "Infectious Disease": 33,
    Geriatrics: 33,
    "Musculoskeletal Radiology": 33,
    "Breast Imaging": 33,
    "Abdominal Imaging": 33,
    "Chest Imaging": 33,
    "Gastrointestinal Radiology": 33,
    "Head and Neck Imaging": 33,
    "Cardiac Imaging": 33,
    "Obstetric/Gynecologic Imaging": 33,
    "Molecular Imaging": 33,
    "PET/CT Imaging": 33,
    Pediatrics: 34,
    "Emergency Medicine": 34,
    "Cardiothoracic Imaging": 34,
    "Nuclear Medicine": 34,
    "Cardiovascular Imaging": 34,
    "Interventional Radiology": 35,
    Neuroradiology: 35,
    "Pediatric Radiology": 35,
    "Emergency Radiology": 35,
    "Trauma Imaging": 35,
    "Functional Imaging": 35,
    "Musculoskeletal Interventional": 36,
    "Neurologic Interventional": 37,
    "Thoracic Interventional": 37,
    "Abdominal Interventional": 37,
    "Pediatric Interventional Radiology": 38
  },
  defaultWordCount: 33,
  specialtyValidationPrompts: {
    "Family Medicine": "Verify first-line imaging before advanced studies. Check step-wise approach compliance. Confirm anatomical specificity. Document red flags for emergency studies. Validate clinical monitoring alternatives. Assess ACR guideline appropriateness.",
    Orthopedics: "Verify joint-specific protocols. Check weight-bearing views. Confirm metal artifact reduction needs. Validate appropriate views for pathology. Assess motion study requirements. Confirm post-surgical protocol modifications. Verify soft tissue evaluation.",
    Cardiology: "Verify cardiac function assessment parameters. Check stress test integration when applicable. Confirm rhythm considerations for gated studies. Validate coronary assessment protocol selection. Verify appropriate chamber/valve visualization protocols. Confirm cardiac device compatibility assessment. Validate myocardial viability assessment needs.",
    Neuroradiology: "Validate sequence-specific requirements for suspected pathology. Verify contrast protocols align with barrier disruption expectations. Confirm MS protocol completeness. Validate stroke protocol appropriateness and urgency indicators. Verify seizure protocol specifications. Confirm neurodegeneration sequences. Validate CSF flow requirements when indicated. Check functional requirements.",
    "Interventional Radiology": "Verify pre-procedure labs including coagulation status. Validate vascular access planning. Confirm appropriate anesthesia/sedation. Check device-disease matching. Assess pre/post procedure requirements. Verify contrast safety considerations. Document post-procedure monitoring protocol. Evaluate alternative approaches. Consider radiation dose optimization.",
    "Pediatric Radiology": "Verify age/weight-based protocols and parameters. Validate ALARA radiation principles for modality selection. Confirm developmental appropriateness of procedure preparation. Verify sedation requirements and safety protocols. Validate growth plate considerations for MSK studies. Confirm parent/guardian presence requirements. Verify congenital anomaly-specific protocols when indicated."
  }
};

// shared/specialties.ts
var specialtyWordCounts = specialties_default.specialtyWordCounts;
var specialtyValidationPrompts = specialties_default.specialtyValidationPrompts;
var defaultWordCount = specialties_default.defaultWordCount;
var specialtyOptions = Object.keys(specialtyWordCounts).sort().map((specialty) => ({
  value: specialty,
  label: specialty
}));
function getOptimalWordCount(specialty) {
  return specialtyWordCounts[specialty] || defaultWordCount;
}
var allSpecialties = Object.keys(specialtyWordCounts).sort();

// server/specialtyValidation.ts
var specialtyWordCountMap = specialtyWordCounts;
var DEFAULT_WORD_COUNT = defaultWordCount;
var specialtyValidationPrompts2 = specialtyValidationPrompts;
function getOptimalWordCount2(specialty) {
  return specialtyWordCountMap[specialty] || DEFAULT_WORD_COUNT;
}
function getSpecialtyValidation(specialty) {
  if (specialtyValidationPrompts2[specialty]) {
    return specialtyValidationPrompts2[specialty];
  }
  const wordCount = getOptimalWordCount2(specialty);
  if (wordCount <= 30) {
    return "Verify appropriateness of imaging selection per ACR guidelines. Check required clinical elements for interpretation. Confirm protocol selection matches indication. Validate timing of imaging relative to symptoms. Assess need for specialty-specific considerations.";
  } else if (wordCount <= 32) {
    return "Verify appropriateness of imaging selection per ACR guidelines. Check required clinical elements for interpretation. Confirm protocol selection matches indication. Validate timing of imaging relative to symptoms. Assess need for specialty-specific considerations. Document relevant disease-specific requirements. Confirm follow-up recommendations.";
  } else if (wordCount <= 34) {
    return "Verify appropriateness of imaging selection per ACR guidelines. Check required clinical elements for interpretation. Confirm protocol selection matches indication. Validate timing of imaging relative to symptoms. Assess need for specialty-specific considerations. Document relevant disease-specific requirements. Confirm follow-up recommendations. Validate quantitative measurement needs. Assess comparative study requirements.";
  } else {
    return "Verify appropriateness of imaging selection per ACR guidelines. Check required clinical elements for interpretation. Confirm protocol selection matches indication. Validate timing of imaging relative to symptoms. Assess need for specialty-specific considerations. Document relevant disease-specific requirements. Confirm follow-up recommendations. Validate quantitative measurement needs. Assess comparative study requirements. Verify safety considerations. Check preparation instructions.";
  }
}
function enforceWordCount(feedback, specialty) {
  const maxWords = getOptimalWordCount2(specialty);
  const words = feedback.split(/\s+/);
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(" ");
  }
  return feedback;
}
function countWords(text3) {
  return text3.split(/\s+/).filter(Boolean).length;
}
function generateSpecialtyValidationSection(specialty) {
  const validation = getSpecialtyValidation(specialty);
  const wordCount = countWords(validation);
  const optimalWordCount = getOptimalWordCount2(specialty);
  return `SPECIALTY VALIDATION (${specialty}, ${wordCount}/${optimalWordCount} words):
${validation}`;
}

// server/anthropic.ts
var MODEL = "claude-3-7-sonnet-20250219";
var anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "dummy-api-key-for-development"
});
async function processDictation(strippedText, specialty = "General Radiology", patientAge, patientGender) {
  console.log(`Using specialty: ${specialty} for validation`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("No Anthropic API key set, returning mock data");
    return getMockProcessingResult(strippedText, specialty);
  }
  try {
    const ageStr = patientAge ? `${patientAge} years old` : "";
    const genderStr = patientGender || "";
    const patientContext = [ageStr, genderStr].filter(Boolean).join(" ");
    const specialtyValidation = generateSpecialtyValidationSection(specialty);
    const optimalWordCount = getOptimalWordCount2(specialty);
    const prompt = `
Patient context: ${patientContext}
Specialty: ${specialty}

Dictation text: "${strippedText}"

=== IMAGING ORDER VALIDATION FRAMEWORK ===

PRIMARY VALIDATION:
- Modality-indication alignment: Imaging matches clinical question per ACR Criteria
- Clinical information sufficiency: Contains minimum required elements
- Safety verification: Check contraindications
- Laterality specification: Clear side indication for paired structures

${specialtyValidation}

AUC COMPLIANCE:
- CDSM consultation documented
- Appropriate use score/rating documented
- Priority Clinical Areas coverage verified

FEEDBACK FORMAT:
[CONCERN]: [RECOMMENDATION]. [JUSTIFICATION].

Analyze order against criteria. Provide feedback limited to exactly ${optimalWordCount} words if issues found. Format response as valid JSON with structure:
{
  "diagnosisCodes": [{"code": "string", "description": "string"}],
  "procedureCodes": [{"code": "string", "description": "string"}],
  "validationStatus": "valid" or "invalid",
  "complianceScore": number (0-100),
  "feedback": "string" (limit to ${optimalWordCount} words if provided)
}
`;
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      temperature: 0,
      system: "You are an expert medical imaging validation system. Analyze imaging orders for appropriateness using ACR criteria, safety, and AUC compliance.",
      messages: [{ role: "user", content: prompt }]
    });
    let content = "";
    if (response.content && response.content.length > 0) {
      const contentBlock = response.content[0];
      if (contentBlock.type === "text") {
        content = contentBlock.text;
      }
    }
    let jsonText = content;
    if (content.includes("```json")) {
      const match = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        jsonText = match[1];
      }
    } else {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from Claude response");
      }
      jsonText = jsonMatch[0];
    }
    const result = JSON.parse(jsonText);
    result.complianceScore = Math.round(result.complianceScore * 10);
    return result;
  } catch (error) {
    console.error("Error processing dictation with Claude:", error);
    throw new Error("Failed to process dictation with AI service");
  }
}
function getMockProcessingResult(text3, specialty = "General Radiology") {
  const optimalWordCount = getOptimalWordCount2(specialty);
  let feedbackText = "";
  if (text3.toLowerCase().includes("gallbladder") || text3.toLowerCase().includes("cholecystitis")) {
    feedbackText = "Verify gallbladder wall thickness measurement. Document any Murphy's sign findings. Confirm fever and leukocytosis documentation. Assess risk factors for complicated cholecystitis.";
    if (optimalWordCount > 30) {
      feedbackText += " Consider sonographic findings correlation. Verify documented symptom duration for accurate treatment planning.";
    }
    if (optimalWordCount > 35) {
      feedbackText += " Evaluate for any percutaneous intervention planning requirements. Document antibiotic history if relevant.";
    }
    feedbackText = enforceWordCount(feedbackText, specialty);
    return {
      diagnosisCodes: [
        { code: "R10.11", description: "Right upper quadrant pain" },
        { code: "K80.00", description: "Calculus of gallbladder with acute cholecystitis without obstruction" }
      ],
      procedureCodes: [
        { code: "74176", description: "CT Abdomen & Pelvis without contrast" }
      ],
      validationStatus: "valid",
      complianceScore: 998,
      feedback: feedbackText
    };
  }
  if (text3.toLowerCase().includes("headache") || text3.toLowerCase().includes("migraine")) {
    feedbackText = "Verify headache chronicity and severity documentation. Check for documented red flags. Confirm prior imaging results. Note any neurological deficit documentation.";
    if (optimalWordCount > 30) {
      feedbackText += " Validate consideration of less radiation-intensive options. Document failure of conservative management approaches.";
    }
    if (optimalWordCount > 35) {
      feedbackText += " Evaluate for vestibular or ocular symptom documentation. Consider specialized sequence requirements based on clinical suspicion.";
    }
    feedbackText = enforceWordCount(feedbackText, specialty);
    return {
      diagnosisCodes: [
        { code: "G43.909", description: "Migraine, unspecified, not intractable, without status migrainosus" },
        { code: "H53.8", description: "Other visual disturbances" },
        { code: "R42", description: "Dizziness and giddiness" }
      ],
      procedureCodes: [
        { code: "70551", description: "MRI Brain without contrast" }
      ],
      validationStatus: "valid",
      complianceScore: 995,
      feedback: feedbackText
    };
  }
  feedbackText = "Verify specific symptom duration documentation. Confirm acute vs. chronic presentation. Document any fever pattern. Assess prior antibiotic use if infection suspected.";
  if (optimalWordCount > 30) {
    feedbackText += " Validate presence of required laboratory findings. Consider documentation of relevant exposure history.";
  }
  if (optimalWordCount > 35) {
    feedbackText += " Evaluate need for dedicated protocol adjustments. Document any immunocompromised status that may affect interpretation.";
  }
  feedbackText = enforceWordCount(feedbackText, specialty);
  return {
    diagnosisCodes: [
      { code: "R53.83", description: "Other fatigue" },
      { code: "R50.9", description: "Fever, unspecified" }
    ],
    procedureCodes: [
      { code: "71045", description: "Chest X-ray, single view" }
    ],
    validationStatus: "valid",
    complianceScore: 873,
    feedback: feedbackText
  };
}

// server/enhancedAnthropicIntegration.ts
import Anthropic2 from "@anthropic-ai/sdk";

// server/dbUtils.ts
import BetterSqlite3 from "better-sqlite3";
import * as path from "path";
function extractClinicalContext(text3) {
  const normalizedText = text3.toLowerCase().replace(/non contrast/g, "noncontrast").replace(/non-contrast/g, "noncontrast").replace(/t2-weighted/g, "t2weighted").replace(/t1-weighted/g, "t1weighted");
  const modalityPatterns = {
    mri: /\b(mri|magnetic resonance( imaging)?)\b/i,
    ct: /\b(ct( scan)?|computed tomography)\b/i,
    xray: /\b(xray|x-ray|radiograph)\b/i,
    ultrasound: /\b(us|ultrasound|sonograph|sonogram)\b/i,
    pet: /\b(pet( scan| ct)?|positron emission)\b/i,
    mammogram: /\bmammogra/i,
    nuclear: /\b(nuclear|scintigraphy)\b/i
  };
  const contrastPatterns = {
    withContrast: /\b(with contrast|contrast enhanced|with gad|with gadolinium)\b/i,
    withoutContrast: /\b(without contrast|non-?contrast|no contrast)\b/i,
    withAndWithout: /\b(with and without|without and with)\b/i
  };
  const anatomyPatterns = {
    shoulder: /\b(shoulder|glenohumeral|acromi|rotator cuff|labr)\b/i,
    knee: /\b(knee|patella|acl|pcl|mcl|lcl|meniscus)\b/i,
    spine: /\b(spine|cervical|thoracic|lumbar|sacral)\b/i,
    brain: /\b(brain|head|cranial|cerebral|cerebellum)\b/i,
    abdomen: /\b(abdomen|abdominal|liver|spleen|pancreas|kidney)\b/i,
    pelvis: /\b(pelvis|pelvic|hip|bladder)\b/i,
    chest: /\b(chest|thorax|thoracic|lung|mediastinum)\b/i,
    wrist: /\b(wrist|carpal|tfcc|triangular fibrocartilage|scaphoid|lunate)\b/i,
    elbow: /\b(elbow|olecranon|cubital)\b/i,
    ankle: /\b(ankle|tarsal|calcaneus|talus)\b/i,
    foot: /\b(foot|metatarsal|phalanges|toe)\b/i,
    hand: /\b(hand|metacarpal|phalanx|finger|thumb)\b/i,
    extremity: /\b(extremity|arm|leg)\b/i
  };
  const conditionPatterns = {
    tear: /\b(tear|rupture|torn)\b/i,
    fracture: /\b(fracture|fx)\b/i,
    pain: /\b(pain|ache|painful|discomfort)\b/i,
    tumor: /\b(tumor|mass|lesion|neoplasm|cancer)\b/i,
    infection: /\b(infection|abscess|osteomyelitis)\b/i,
    arthritis: /\b(arthritis|degenerative|osteoarthritis|degen)\b/i,
    sprain: /\b(sprain|strain|tendinitis|tendinopathy)\b/i
  };
  const lateralityPatterns = {
    right: /\b(right|rt)\b/i,
    left: /\b(left|lt)\b/i,
    bilateral: /\b(bilateral|both)\b/i
  };
  const patientInfoPatterns = {
    athlete: /\b(athlete|player|sports|athletic)\b/i,
    elderly: /\b(elderly|geriatric|older adult|senior)\b/i,
    pediatric: /\b(child|pediatric|adolescent|teen|young)\b/i,
    adult: /\b([2-9][0-9]([- ]|\s)?(year|y)([- ]|\s)?(old)?)\b/i
  };
  const modality = [];
  for (const [key, pattern] of Object.entries(modalityPatterns)) {
    if (pattern.test(normalizedText)) {
      modality.push(key);
    }
  }
  for (const [key, pattern] of Object.entries(contrastPatterns)) {
    if (pattern.test(normalizedText)) {
      modality.push(key.toLowerCase());
    }
  }
  const anatomy = [];
  for (const [key, pattern] of Object.entries(anatomyPatterns)) {
    if (pattern.test(normalizedText)) {
      anatomy.push(key);
    }
  }
  let laterality = "unspecified";
  if (lateralityPatterns.right.test(normalizedText)) {
    laterality = "right";
  } else if (lateralityPatterns.left.test(normalizedText)) {
    laterality = "left";
  } else if (lateralityPatterns.bilateral.test(normalizedText)) {
    laterality = "bilateral";
  }
  const clinicalConditions = [];
  for (const [key, pattern] of Object.entries(conditionPatterns)) {
    if (pattern.test(normalizedText)) {
      clinicalConditions.push(key);
    }
  }
  const patientInfo = {};
  if (patientInfoPatterns.athlete.test(normalizedText)) {
    patientInfo.isAthlete = true;
  }
  const ageMatch = normalizedText.match(/\b([1-9][0-9])[ -]?(year|y)s?\b/i);
  if (ageMatch && ageMatch[1]) {
    patientInfo.approximateAge = parseInt(ageMatch[1], 10);
  }
  return {
    modality,
    anatomy,
    laterality,
    clinicalConditions,
    patientInfo
  };
}
function extractMedicalKeywords(text3) {
  const context = extractClinicalContext(text3);
  const keywordSet = /* @__PURE__ */ new Set();
  context.modality.forEach((m) => keywordSet.add(m));
  context.anatomy.forEach((a) => keywordSet.add(a));
  if (context.laterality !== "unspecified") {
    keywordSet.add(context.laterality);
  }
  context.clinicalConditions.forEach((c) => keywordSet.add(c));
  const words = text3.toLowerCase().split(/\W+/).filter((w) => w.length > 3).filter((w) => !["with", "without", "patient", "year", "requesting", "ordering", "male", "female", "body", "screen", "please"].includes(w));
  words.forEach((w) => keywordSet.add(w));
  return Array.from(keywordSet);
}
function getRelevantDiagnosisCodes(db3, keywords) {
  if (keywords.length === 0) return [];
  try {
    console.log("DEBUG - Running diagnosis lookup with keywords:", keywords);
    const normalizedText = keywords.join(" ").toLowerCase();
    const context = extractClinicalContext(normalizedText);
    console.log("DEBUG - Extracted clinical context:", JSON.stringify(context, null, 2));
    let targetedQueries = [];
    if (context.anatomy.length > 0 && context.laterality !== "unspecified") {
      context.anatomy.forEach((anatomyPart) => {
        let conditions = [];
        let params = [];
        conditions.push(`Description LIKE ?`);
        params.push(`%${anatomyPart}%`);
        conditions.push(`Description LIKE ?`);
        params.push(`%${context.laterality}%`);
        if (context.clinicalConditions.length > 0) {
          context.clinicalConditions.forEach((condition) => {
            conditions.push(`Description LIKE ?`);
            params.push(`%${condition}%`);
          });
        }
        const whereClause = conditions.join(" AND ");
        targetedQueries.push({
          query: `
            SELECT ICD10_Code AS code, Description AS description
            FROM icd10_codes
            WHERE ${whereClause}
            ORDER BY ICD10_Code ASC
            LIMIT 5
          `,
          params
        });
      });
    }
    const specificCodeQueries = [];
    if (context.anatomy.includes("shoulder") && context.laterality === "right") {
      specificCodeQueries.push({
        query: `
          SELECT ICD10_Code AS code, Description AS description
          FROM icd10_codes
          WHERE ICD10_Code = 'M25.511' -- Pain in right shoulder
          OR ICD10_Code LIKE 'S43.4%'  -- Sprain of shoulder joint
          OR ICD10_Code LIKE 'M75.1%'  -- Rotator cuff tear
          ORDER BY ICD10_Code ASC
        `,
        params: []
      });
    } else if (context.anatomy.includes("shoulder") && context.laterality === "left") {
      specificCodeQueries.push({
        query: `
          SELECT ICD10_Code AS code, Description AS description
          FROM icd10_codes
          WHERE ICD10_Code = 'M25.512' -- Pain in left shoulder
          OR ICD10_Code LIKE 'S43.4%'  -- Sprain of shoulder joint
          OR ICD10_Code LIKE 'M75.1%'  -- Rotator cuff tear
          ORDER BY ICD10_Code ASC
        `,
        params: []
      });
    }
    if ((normalizedText.includes("labral") || normalizedText.includes("labrum")) && (normalizedText.includes("tear") || normalizedText.includes("lesion"))) {
      specificCodeQueries.push({
        query: `
          SELECT ICD10_Code AS code, Description AS description
          FROM icd10_codes
          WHERE ICD10_Code LIKE 'S43.43%' -- Superior glenoid labrum lesion
          ORDER BY ICD10_Code ASC
        `,
        params: []
      });
    }
    if (context.anatomy.includes("knee")) {
      const lateralityCondition = context.laterality === "right" ? "AND (Description LIKE '%right%' OR ICD10_Code LIKE '%1')" : context.laterality === "left" ? "AND (Description LIKE '%left%' OR ICD10_Code LIKE '%2')" : "";
      specificCodeQueries.push({
        query: `
          SELECT ICD10_Code AS code, Description AS description
          FROM icd10_codes
          WHERE (ICD10_Code LIKE 'M23%' OR ICD10_Code LIKE 'M17%' OR ICD10_Code LIKE 'S83%')
          ${lateralityCondition}
          ORDER BY ICD10_Code ASC
          LIMIT 10
        `,
        params: []
      });
    }
    targetedQueries = [...targetedQueries, ...specificCodeQueries];
    let targetedResults = [];
    targetedQueries.forEach((queryObj) => {
      try {
        const results = db3.prepare(queryObj.query).all(...queryObj.params);
        console.log(`DEBUG - Targeted query found ${results.length} results`);
        targetedResults = [...targetedResults, ...results];
      } catch (e) {
        console.error("Error executing targeted query:", e);
      }
    });
    const uniqueTargetedResults = targetedResults.filter(
      (item, index, self) => index === self.findIndex((t) => t.code === item.code)
    );
    if (uniqueTargetedResults.length > 0) {
      console.log(`DEBUG - Found ${uniqueTargetedResults.length} diagnosis codes from targeted queries`);
      return uniqueTargetedResults.map((match) => ({
        code: match.code,
        description: match.description,
        confidence: 0.9
        // High confidence for targeted matches
      }));
    }
    console.log("DEBUG - Falling back to keyword-based search");
    const commonWords = ["with", "without", "patient", "year", "requesting", "ordering", "male", "female", "body", "screen"];
    const filteredKeywords = keywords.filter(
      (word) => !commonWords.includes(word.toLowerCase()) && word.length > 2
    );
    if (filteredKeywords.length === 0) {
      filteredKeywords.push(...keywords.filter((word) => word.length > 4).slice(0, 3));
    }
    console.log("DEBUG - Filtered diagnosis keywords:", filteredKeywords);
    let matchScoreSQL = filteredKeywords.map(
      (_, i) => `(CASE WHEN Description LIKE ? THEN 1 ELSE 0 END)`
    ).join(" + ");
    const searchTerms = filteredKeywords.map((word) => `%${word}%`);
    const whereConditions = searchTerms.map(() => "Description LIKE ?").join(" OR ");
    const query = `
      SELECT 
        ICD10_Code AS code, 
        Description AS description,
        (${matchScoreSQL}) AS match_score
      FROM icd10_codes
      WHERE ${whereConditions}
      ORDER BY match_score DESC
      LIMIT 12
    `;
    console.log("DEBUG - Scored match query being executed");
    const queryParams = [...searchTerms, ...searchTerms];
    const scoredMatches = db3.prepare(query).all(queryParams);
    console.log(`DEBUG - Found ${scoredMatches.length} diagnosis codes with keyword scoring`);
    return scoredMatches.map((match) => ({
      code: match.code,
      description: match.description,
      confidence: match.match_score ? Math.min(0.9, 0.5 + match.match_score * 0.1) : 0.7
    }));
  } catch (error) {
    console.error("Error getting diagnosis codes:", error);
    return [];
  }
}
function getRelevantProcedureCodes(db3, keywords) {
  if (keywords.length === 0) return [];
  try {
    console.log("DEBUG - Running procedure lookup with keywords:", keywords);
    const normalizedText = keywords.join(" ").toLowerCase();
    const context = extractClinicalContext(normalizedText);
    console.log("DEBUG - Extracted clinical context for procedures:", JSON.stringify(context, null, 2));
    const targetedQueries = [];
    if (context.modality.includes("mri") && context.anatomy.includes("shoulder")) {
      let contrastClause = "";
      if (normalizedText.includes("labral") || normalizedText.includes("labrum")) {
        contrastClause = "AND (Description LIKE '%with contrast%' OR Description LIKE '%arthrogram%')";
      }
      targetedQueries.push({
        query: `
          SELECT CPT_Code AS code, Description AS description, Modality AS modality
          FROM cpt_codes
          WHERE (Description LIKE '%MRI%' OR Description LIKE '%magnetic resonance%')
          AND (Description LIKE '%shoulder%' OR Description LIKE '%joint%' OR Description LIKE '%upper extremity%')
          AND CPT_Code LIKE '73%'
          ${contrastClause}
          ORDER BY CPT_Code
          LIMIT 10
        `,
        params: ["73%"]
      });
      if ((normalizedText.includes("labral") || normalizedText.includes("labrum")) && (normalizedText.includes("tear") || normalizedText.includes("lesion"))) {
        targetedQueries.push({
          query: `
            SELECT CPT_Code AS code, Description AS description, Modality AS modality
            FROM cpt_codes
            WHERE (Description LIKE '%MRI%' OR Description LIKE '%magnetic resonance%')
            AND (Description LIKE '%shoulder%' OR Description LIKE '%joint%' OR Description LIKE '%upper extremity%')
            AND (Description LIKE '%with contrast%' OR Description LIKE '%arthrogram%')
            AND CPT_Code LIKE '73222%'
            ORDER BY CPT_Code
            LIMIT 5
          `,
          params: ["73222%"]
        });
      }
    }
    if (context.modality.includes("ct")) {
      const anatomyParts = {
        shoulder: "upper extremity",
        knee: "lower extremity",
        spine: "spine",
        brain: "head",
        abdomen: "abdomen",
        pelvis: "pelvis",
        chest: "chest"
      };
      const ctPatterns = {
        "upper extremity": "732%",
        "lower extremity": "737%",
        spine: "721%",
        head: "70%",
        abdomen: "741%",
        pelvis: "721%",
        chest: "71%"
      };
      for (const anatomyKey of context.anatomy) {
        const mappedAnatomy = anatomyParts[anatomyKey];
        if (mappedAnatomy && ctPatterns[mappedAnatomy]) {
          targetedQueries.push({
            query: `
              SELECT CPT_Code AS code, Description AS description, Modality AS modality
              FROM cpt_codes
              WHERE Modality LIKE '%CT%'
              AND Description LIKE ?
              AND CPT_Code LIKE ?
              ORDER BY CPT_Code
              LIMIT 5
            `,
            params: [`%${mappedAnatomy}%`, ctPatterns[mappedAnatomy]]
          });
        }
      }
    }
    if (targetedQueries.length === 0 && context.modality.length > 0) {
      context.modality.forEach((modalityType) => {
        if (["mri", "ct", "xray", "ultrasound"].includes(modalityType)) {
          let modalityParam = "";
          if (modalityType === "mri") modalityParam = "%MRI%";
          else if (modalityType === "ct") modalityParam = "%CT%";
          else if (modalityType === "xray") modalityParam = "%X-ray%";
          else if (modalityType === "ultrasound") modalityParam = "%Ultrasound%";
          targetedQueries.push({
            query: `
              SELECT CPT_Code AS code, Description AS description, Modality AS modality
              FROM cpt_codes
              WHERE Modality LIKE ?
              ORDER BY CPT_Code
              LIMIT 10
            `,
            params: [modalityParam]
          });
        }
      });
    }
    let targetedResults = [];
    targetedQueries.forEach((queryObj) => {
      try {
        const results = db3.prepare(queryObj.query).all(...queryObj.params);
        console.log(`DEBUG - Targeted procedure query found ${results.length} results`);
        targetedResults = [...targetedResults, ...results];
      } catch (e) {
        console.error("Error executing targeted procedure query:", e);
      }
    });
    const uniqueTargetedResults = targetedResults.filter(
      (item, index, self) => index === self.findIndex((t) => t.code === item.code)
    );
    if (uniqueTargetedResults.length > 0) {
      console.log(`DEBUG - Found ${uniqueTargetedResults.length} procedure codes from targeted queries`);
      return uniqueTargetedResults.map((match) => ({
        code: match.code,
        description: match.description,
        modality: match.modality,
        confidence: 0.9
        // High confidence for targeted matches
      }));
    }
    console.log("DEBUG - Falling back to keyword-based procedure search");
    const commonWords = ["with", "without", "patient", "year", "requesting", "ordering", "male", "female", "body", "screen"];
    const filteredKeywords = keywords.filter(
      (word) => !commonWords.includes(word.toLowerCase()) && word.length > 2
    );
    if (filteredKeywords.length === 0) {
      filteredKeywords.push(...keywords.filter((word) => word.length > 4).slice(0, 3));
    }
    console.log("DEBUG - Filtered procedure keywords:", filteredKeywords);
    const modalityKeywords = ["mri", "ct", "xray", "x-ray", "ultrasound", "mammogram"];
    const matchedModalities = modalityKeywords.filter(
      (m) => keywords.some((k) => k.toLowerCase() === m || k.toLowerCase().includes(m))
    );
    const exactMatches = filteredKeywords.filter((k) => k.length > 4).flatMap((keyword) => {
      const modalityClause = matchedModalities.length > 0 ? `AND (${matchedModalities.map((m) => `Modality LIKE '%${m}%'`).join(" OR ")})` : "";
      const query2 = `
          SELECT CPT_Code AS code, Description AS description, Modality AS modality
          FROM cpt_codes
          WHERE Description LIKE ? ${modalityClause}
          LIMIT 5
        `;
      const results = db3.prepare(query2).all(`%${keyword}%`);
      return results;
    });
    let matchScoreSQL = filteredKeywords.map(
      (_, i) => `(CASE WHEN Description LIKE ? THEN 1 ELSE 0 END)`
    ).join(" + ");
    if (matchedModalities.length > 0) {
      const modalityConditions = matchedModalities.map((m) => `Modality LIKE '%${m}%'`).join(" OR ");
      matchScoreSQL += ` + (CASE WHEN ${modalityConditions} THEN 3 ELSE 0 END)`;
    }
    const searchTerms = filteredKeywords.map((word) => `%${word}%`);
    if (searchTerms.length === 0) {
      console.log("DEBUG - No valid procedure search terms after filtering, using fallback");
      const fallbackTerms = ["%mri%", "%ct%", "%xray%"].filter(
        (t) => keywords.some((k) => k.toLowerCase().includes(t.replace(/%/g, "")))
      );
      if (fallbackTerms.length > 0) {
        const fallbackQuery = `
          SELECT CPT_Code AS code, Description AS description, Modality AS modality
          FROM cpt_codes
          WHERE ${fallbackTerms.map(() => "Modality LIKE ?").join(" OR ")}
          LIMIT 12
        `;
        console.log("DEBUG - Using fallback modality search:", fallbackTerms);
        return db3.prepare(fallbackQuery).all(fallbackTerms).map((match) => ({
          code: match.code,
          description: match.description,
          modality: match.modality,
          confidence: 0.6
        }));
      }
      console.log("DEBUG - No search terms available at all, returning empty array");
      return [];
    }
    const whereConditions = searchTerms.map(() => "Description LIKE ?").join(" OR ");
    const query = `
      SELECT 
        CPT_Code AS code, 
        Description AS description,
        Modality AS modality,
        (${matchScoreSQL}) AS match_score
      FROM cpt_codes
      WHERE ${whereConditions}
      ORDER BY match_score DESC
      LIMIT 12
    `;
    console.log("DEBUG - Scored procedure match query being executed");
    console.log("DEBUG - Search terms count:", searchTerms.length);
    console.log("DEBUG - Query parameter count needed:", matchScoreSQL.split("?").length - 1);
    console.log("DEBUG - Where clause parameter count:", whereConditions.split("?").length - 1);
    const allParams = [...searchTerms, ...searchTerms];
    console.log("DEBUG - Total parameters being passed:", allParams.length);
    const scoredMatches = db3.prepare(query).all(allParams);
    console.log(`DEBUG - Found ${scoredMatches.length} procedure codes with scoring`);
    const allMatches = [...exactMatches, ...scoredMatches];
    const uniqueMatches = allMatches.filter(
      (match, index, self) => index === self.findIndex((m) => m.code === match.code)
    );
    return uniqueMatches.map((match) => ({
      code: match.code,
      description: match.description,
      modality: match.modality,
      confidence: match.match_score ? Math.min(0.9, 0.5 + match.match_score * 0.1) : 0.7
    }));
  } catch (error) {
    console.error("Error getting procedure codes:", error);
    return [];
  }
}
function getAppropriatenessMappings(db3, diagnosisCodes2, procedureCodes2, dictationText) {
  if (diagnosisCodes2.length === 0 || procedureCodes2.length === 0) return [];
  try {
    let context = null;
    let normalizedText = "";
    if (dictationText) {
      context = extractClinicalContext(dictationText);
      normalizedText = dictationText.toLowerCase();
      console.log("DEBUG - Clinical context for mappings:", JSON.stringify(context, null, 2));
    }
    let hasSpecificMappings = false;
    const allMappings = [];
    if (context && context.anatomy.includes("shoulder") && (dictationText?.toLowerCase().includes("labral") || dictationText?.toLowerCase().includes("labrum")) && diagnosisCodes2.some((code) => code === "M25.511" || code === "S43.431")) {
      console.log("DEBUG - Detected specific shoulder labral tear scenario");
      const contrastMRI = procedureCodes2.find((code) => code.includes("73222"));
      if (contrastMRI) {
        try {
          const query2 = `
            SELECT 
              ? AS diagnosisCode,
              (SELECT Description FROM icd10_codes WHERE ICD10_Code = ?) AS diagnosisDescription,
              ? AS procedureCode,
              (SELECT Description FROM cpt_codes WHERE CPT_Code = ?) AS procedureDescription,
              (SELECT Modality FROM cpt_codes WHERE CPT_Code = ?) AS modality,
              7 AS score,
              'ACR Appropriateness Criteria' AS evidence,
              'Superior for evaluation of labral tears, subtle rotator cuff tears, and adhesive capsulitis' AS justification
          `;
          const labralCode = diagnosisCodes2.includes("S43.431") ? "S43.431" : "M25.511";
          const params = [labralCode, labralCode, contrastMRI, contrastMRI, contrastMRI];
          const result = db3.prepare(query2).get(params);
          if (result) {
            console.log("DEBUG - Added custom mapping for labral tear with contrast MRI");
            allMappings.push({
              diagnosisCode: result.diagnosisCode,
              diagnosisDescription: result.diagnosisDescription,
              procedureCode: result.procedureCode,
              procedureDescription: result.procedureDescription,
              modality: result.modality,
              score: result.score,
              evidence: result.evidence,
              justification: result.justification
            });
            hasSpecificMappings = true;
          }
        } catch (e) {
          console.error("Error adding custom labral tear mapping:", e);
        }
      }
      const nonContrastMRI = procedureCodes2.find((code) => code.includes("73221"));
      if (nonContrastMRI) {
        try {
          const query2 = `
            SELECT 
              ? AS diagnosisCode,
              (SELECT Description FROM icd10_codes WHERE ICD10_Code = ?) AS diagnosisDescription,
              ? AS procedureCode,
              (SELECT Description FROM cpt_codes WHERE CPT_Code = ?) AS procedureDescription,
              (SELECT Modality FROM cpt_codes WHERE CPT_Code = ?) AS modality,
              8 AS score,
              'ACR Appropriateness Criteria' AS evidence,
              'Indicated when X-rays arenormal or inconclusive and there is suspicion for rotator cuff tear, labral pathology, or other soft tissue abnormalities' AS justification
          `;
          const labralCode = diagnosisCodes2.includes("S43.431") ? "S43.431" : "M25.511";
          const params = [labralCode, labralCode, nonContrastMRI, nonContrastMRI, nonContrastMRI];
          const result = db3.prepare(query2).get(params);
          if (result) {
            console.log("DEBUG - Added custom mapping for labral tear with non-contrast MRI");
            allMappings.push({
              diagnosisCode: result.diagnosisCode,
              diagnosisDescription: result.diagnosisDescription,
              procedureCode: result.procedureCode,
              procedureDescription: result.procedureDescription,
              modality: result.modality,
              score: result.score,
              evidence: result.evidence,
              justification: result.justification
            });
            hasSpecificMappings = true;
          }
        } catch (e) {
          console.error("Error adding custom labral tear mapping:", e);
        }
      }
    }
    const diagPlaceholders = diagnosisCodes2.map(() => "?").join(",");
    const procPlaceholders = procedureCodes2.map(() => "?").join(",");
    const query = `
      SELECT 
        m.ICD10_Code AS diagnosisCode,
        i.Description AS diagnosisDescription,
        m.CPT_Code AS procedureCode,
        c.Description AS procedureDescription,
        c.Modality AS modality,
        m.Appropriateness AS score,
        m.Citation AS evidence,
        m.Enhanced_Notes AS justification
      FROM icd10_cpt_mappings m
      JOIN icd10_codes i ON m.ICD10_Code = i.ICD10_Code
      JOIN cpt_codes c ON m.CPT_Code = c.CPT_Code
      WHERE m.ICD10_Code IN (${diagPlaceholders})
      AND m.CPT_Code IN (${procPlaceholders})
      ORDER BY m.Appropriateness DESC
    `;
    const results = db3.prepare(query).all([...diagnosisCodes2, ...procedureCodes2]);
    console.log(`DEBUG - Found ${results.length} appropriateness mappings from database`);
    const dbMappings = results.map((row) => ({
      diagnosisCode: row.diagnosisCode,
      diagnosisDescription: row.diagnosisDescription,
      procedureCode: row.procedureCode,
      procedureDescription: row.procedureDescription,
      modality: row.modality,
      score: row.score,
      evidence: row.evidence,
      justification: row.justification
    }));
    let filteredDbMappings = dbMappings;
    if (context && context.anatomy.length > 0) {
      const isAnatomicallyConsistent = (mapping) => {
        const procDesc = mapping.procedureDescription.toLowerCase();
        if (context.anatomy.includes("shoulder") || context.anatomy.includes("elbow") || context.anatomy.includes("wrist") || context.anatomy.includes("extremity")) {
          if (procDesc.includes("lower extremity") || procDesc.includes(" knee") || procDesc.includes(" foot") || procDesc.includes(" ankle") || procDesc.includes(" hip") || procDesc.includes("breast") || procDesc.includes("temporomandibular") || procDesc.includes(" head") || procDesc.includes(" neck")) {
            return false;
          }
        }
        if (context.anatomy.includes("wrist")) {
          if (procDesc.includes("breast") || procDesc.includes("brain") || procDesc.includes("temporomandibular") || procDesc.includes(" head") || procDesc.includes(" neck") || procDesc.includes(" ankle") || procDesc.includes(" foot") || procDesc.includes(" knee") || procDesc.includes(" hip")) {
            return false;
          }
        }
        if (context.anatomy.includes("knee") || context.anatomy.includes("ankle") || context.anatomy.includes("foot") || context.anatomy.includes("extremity") && normalizedText.includes("lower")) {
          if (procDesc.includes("upper extremity") || procDesc.includes("shoulder") || procDesc.includes("wrist") || procDesc.includes("elbow") || procDesc.includes("breast") || procDesc.includes("temporomandibular") || procDesc.includes(" head") || procDesc.includes(" neck")) {
            return false;
          }
        }
        if (context.anatomy.includes("brain") || context.anatomy.includes("head") || context.anatomy.includes("neck")) {
          if (procDesc.includes("shoulder") || procDesc.includes("extremity") || procDesc.includes("foot") || procDesc.includes("knee") || procDesc.includes("breast") || procDesc.includes("pelvis") || procDesc.includes("abdomen")) {
            return false;
          }
        }
        if (normalizedText.includes("tfcc") || normalizedText.includes("ulnar") && normalizedText.includes("wrist")) {
          if (procDesc.includes("breast") || procDesc.includes("temporomandibular") || procDesc.includes(" head") || procDesc.includes(" neck")) {
            return false;
          }
        }
        return true;
      };
      filteredDbMappings = dbMappings.filter(isAnatomicallyConsistent);
      if (filteredDbMappings.length !== dbMappings.length) {
        console.log(`DEBUG - Filtered out ${dbMappings.length - filteredDbMappings.length} anatomically inconsistent mappings`);
      }
    }
    return [...allMappings, ...filteredDbMappings];
  } catch (error) {
    console.error("Error getting appropriateness mappings:", error);
    return [];
  }
}
function generateDatabaseContext(dictationText) {
  const dbPath = path.resolve("./DB/temp_markdown_csv_mappings_medical_codes.db");
  const db3 = new BetterSqlite3(dbPath);
  try {
    const keywords = extractMedicalKeywords(dictationText);
    console.log("Extracted keywords:", keywords);
    const possibleDiagnoses = getRelevantDiagnosisCodes(db3, keywords);
    console.log("DEBUG - Diagnosis codes found:", JSON.stringify(possibleDiagnoses, null, 2));
    const possibleProcedures = getRelevantProcedureCodes(db3, keywords);
    console.log("DEBUG - Procedure codes found:", JSON.stringify(possibleProcedures, null, 2));
    const diagnosisCodes2 = possibleDiagnoses.map((d) => d.code);
    const procedureCodes2 = possibleProcedures.map((p) => p.code);
    console.log("DEBUG - Diagnosis codes for mappings:", diagnosisCodes2);
    console.log("DEBUG - Procedure codes for mappings:", procedureCodes2);
    let markdownDocs = [];
    if (diagnosisCodes2.length > 0) {
      console.log("DEBUG - Checking for markdown content...");
      try {
        const mdQuery = `
          SELECT icd10_code, content 
          FROM icd10_markdown_docs
          WHERE icd10_code IN (${diagnosisCodes2.map(() => "?").join(",")})
          LIMIT 5
        `;
        markdownDocs = db3.prepare(mdQuery).all(diagnosisCodes2);
        console.log(`DEBUG - Found ${markdownDocs.length} markdown entries:`);
        if (markdownDocs.length > 0) {
          markdownDocs.forEach((r) => {
            console.log(`DEBUG - Markdown for ${r.icd10_code}: ${r.content.substring(0, 100)}...`);
          });
        }
      } catch (error) {
        console.error("Error checking markdown:", error);
      }
    }
    const appropriatenessMappings = getAppropriatenessMappings(
      db3,
      diagnosisCodes2,
      procedureCodes2,
      dictationText
      // Pass the original text for context-aware mapping
    );
    console.log(`DEBUG - Found ${appropriatenessMappings.length} appropriateness mappings`);
    return {
      possibleDiagnoses,
      possibleProcedures,
      appropriatenessMappings,
      markdownDocs
    };
  } finally {
    db3.close();
  }
}
function formatDatabaseContext(dbContext) {
  const diagnosesSection = dbContext.possibleDiagnoses.length > 0 ? `POSSIBLE DIAGNOSES (from database):
${dbContext.possibleDiagnoses.map(
    (d) => `- ${d.code}: ${d.description} (confidence: ${Math.round(d.confidence * 100)}%)`
  ).join("\n")}` : "No relevant diagnoses found in database.";
  const proceduresSection = dbContext.possibleProcedures.length > 0 ? `POSSIBLE PROCEDURES (from database):
${dbContext.possibleProcedures.map(
    (p) => `- ${p.code}: ${p.description} (${p.modality || "modality unknown"}) (confidence: ${Math.round(p.confidence * 100)}%)`
  ).join("\n")}` : "No relevant procedures found in database.";
  const mappingsSection = dbContext.appropriatenessMappings.length > 0 ? `APPROPRIATENESS MAPPINGS (from ACR guidelines):
${dbContext.appropriatenessMappings.map(
    (m) => `- ${m.diagnosisCode} (${m.diagnosisDescription}) + ${m.procedureCode} (${m.procedureDescription}):
  * Score: ${m.score}/9 (${m.score >= 7 ? "Usually Appropriate" : m.score >= 4 ? "May Be Appropriate" : "Rarely Appropriate"})
  * Evidence: ${m.evidence || "Not specified"}
  * Justification: ${m.justification || "Not specified"}`
  ).join("\n\n")}` : "No appropriateness mappings found in database.";
  const markdownSection = dbContext.markdownDocs && dbContext.markdownDocs.length > 0 ? `MEDICAL DOCUMENTATION (from guidelines):
${dbContext.markdownDocs.map(
    (doc) => `--- DOCUMENTATION FOR ${doc.icd10_code} ---
${doc.content}`
  ).join("\n\n")}` : "No medical documentation found in database.";
  return `
DATABASE CONTEXT:
${diagnosesSection}

${proceduresSection}

${mappingsSection}

${markdownSection}
`;
}

// server/enhancedAnthropicIntegration.ts
async function processEnhancedDictation(strippedText, specialty = "General Radiology", patientAge, patientGender) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("No Anthropic API key found, using mock results");
    return getMockProcessingResult2(strippedText, specialty);
  }
  try {
    const dbContext = generateDatabaseContext(strippedText);
    const formattedDbContext = formatDatabaseContext(dbContext);
    const anthropic2 = new Anthropic2({
      apiKey
    });
    const targetWordCount = getOptimalWordCount(specialty);
    const systemPrompt = `You are RadOrderValidator, an expert system that analyzes radiology order dictations to:
1. Extract ICD-10 diagnosis codes and CPT procedure codes
2. Validate the appropriateness of the ordered imaging based on evidence-based guidelines
3. Provide feedback to help ensure appropriate imaging utilization

You're evaluating a dictation in the field of ${specialty}.
${patientAge ? `The patient is ${patientAge} years old.` : ""}
${patientGender ? `The patient's gender is ${patientGender}.` : ""}

Your goal is to holistically evaluate the clinical appropriateness of the ordered imaging and provide educational feedback.

You'll analyze the entire order text and evaluate medical necessity in context. Ensure your feedback is:
- Evidence-based and aligned with ACR guidelines
- Educational rather than prescriptive
- Focused on appropriate imaging (right scan, right patient, right time)
- Concise and targeted to physicians in the ${specialty} specialty

IMPORTANT: Research shows that for ${specialty}, the optimal educational feedback should be exactly ${targetWordCount} words for maximum effectiveness. Your feedback should follow this structure:
1. Issue identification (what's inappropriate about the order, if applicable)
2. Specific recommendation (what would be more appropriate)
3. Clinical justification (based on guidelines)
4. Educational component (to help improve future orders)

${formattedDbContext}

OUTPUT INSTRUCTIONS:
1. Review the dictation and extract the most relevant diagnosis codes (ICD-10) and procedure codes (CPT).
2. Evaluate the clinical appropriateness of the imaging order based on the diagnosis and evidence-based guidelines from the database.
3. Provide structured output in JSON format with the following fields:
   - diagnosisCodes: Array of objects with 'code' and 'description' fields
   - procedureCodes: Array of objects with 'code' and 'description' fields
   - validationStatus: 'valid' or 'invalid'
   - complianceScore: A score from 1-9 (9 being highest compliance)
   - feedback: Educational feedback about the appropriateness of the order, targeting exactly ${targetWordCount} words

You must respond with ONLY the JSON output. Do not include any other text before or after the JSON.`;
    const userMessage = strippedText;
    console.log("Making API request to Claude");
    const response = await anthropic2.messages.create({
      model: "claude-3-7-sonnet-20250219",
      // Using the latest model
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: [
        { role: "user", content: userMessage }
      ]
    });
    let aiResponse = "";
    for (const block of response.content) {
      const textBlock = block;
      if (textBlock.type === "text") {
        aiResponse += textBlock.text;
      }
    }
    try {
      let jsonText = aiResponse;
      if (aiResponse.includes("```json")) {
        const match = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          jsonText = match[1];
        }
      }
      const result = JSON.parse(jsonText);
      if (!result.diagnosisCodes || !result.procedureCodes || !result.validationStatus) {
        throw new Error("Response missing required fields");
      }
      if (result.feedback && specialty) {
        const optimalWordCount = getOptimalWordCount(specialty);
        const words = result.feedback.split(/\s+/);
        const currentWordCount = words.length;
        console.log(`Feedback analysis for ${specialty}:`);
        console.log(`- Current word count: ${currentWordCount}`);
        console.log(`- Optimal word count: ${optimalWordCount}`);
        console.log(`- Difference: ${currentWordCount - optimalWordCount}`);
        console.log(`- Word count comparison: ${currentWordCount > optimalWordCount ? "Too verbose" : currentWordCount < optimalWordCount ? "Too brief" : "Optimal"}`);
      }
      return result;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Raw response:", aiResponse);
      return getMockProcessingResult2(strippedText, specialty);
    }
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    return getMockProcessingResult2(strippedText, specialty);
  }
}
function getMockProcessingResult2(text3, specialty = "General Radiology") {
  const diagnosisCodes2 = [
    { code: "M54.5", description: "Low back pain" },
    { code: "M51.26", description: "Intervertebral disc displacement, lumbar region" }
  ];
  const procedureCodes2 = text3.toLowerCase().includes("mri") ? [{ code: "72148", description: "MRI lumbar spine without contrast" }] : text3.toLowerCase().includes("ct") ? [{ code: "72131", description: "CT lumbar spine without contrast" }] : [{ code: "72100", description: "X-ray lumbar spine, 2 or 3 views" }];
  const isValid = text3.length > 100;
  const complianceScore = isValid ? 7 : 3;
  const targetWordCount = getOptimalWordCount(specialty);
  let feedback = isValid ? "This order appears to be clinically appropriate based on the provided information. The patient's symptoms of low back pain with radiation to the leg suggest possible disc herniation. Conservative treatment has been attempted without significant improvement. MRI is the appropriate first-line imaging modality for suspected disc pathology with radicular symptoms after a trial of conservative therapy. The clinical scenario aligns with ACR Appropriateness Criteria. No contrast is necessary for initial evaluation." : "This order lacks sufficient clinical information to fully establish medical necessity. For low back pain, imaging is generally not indicated unless there are red flag symptoms or failure of conservative treatment after 6 weeks. The documentation does not clearly establish either criterion. According to ACR Appropriateness Criteria, plain radiographs should be the initial imaging for uncomplicated low back pain when imaging is deemed necessary.";
  const words = feedback.split(/\s+/);
  if (words.length > targetWordCount) {
    feedback = words.slice(0, targetWordCount).join(" ") + "...";
  }
  return {
    diagnosisCodes: diagnosisCodes2,
    procedureCodes: procedureCodes2,
    validationStatus: isValid ? "valid" : "invalid",
    complianceScore,
    feedback
  };
}

// server/testEnhancedValidation.ts
async function testDatabaseContext(testCase) {
  try {
    const dbContext = generateDatabaseContext(testCase.dictation);
    const formattedContext = formatDatabaseContext(dbContext);
    console.log(`
==== Database Context for ${testCase.id} ====`);
    console.log(formattedContext);
    const result = {
      testCaseId: testCase.id,
      dbContextStats: {
        diagnosisCount: dbContext.possibleDiagnoses.length,
        procedureCount: dbContext.possibleProcedures.length,
        mappingCount: dbContext.appropriatenessMappings.length
      }
    };
    return result;
  } catch (error) {
    console.error(`Error in database context test for ${testCase.id}:`, error);
    return {
      testCaseId: testCase.id,
      dbContextStats: {
        diagnosisCount: 0,
        procedureCount: 0,
        mappingCount: 0
      },
      error: error.message
    };
  }
}

// server/hipaa.ts
function stripPHI(text3) {
  let sanitized = text3.replace(/\b(Mr\.|Mrs\.|Ms\.|Dr\.|Miss)\s+[A-Z][a-z]+\b/g, "[Patient]");
  sanitized = sanitized.replace(/\b\d{6,10}\b/g, "[MRN]");
  sanitized = sanitized.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, "[SSN]");
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[Email]");
  sanitized = sanitized.replace(/\b(\+\d{1,2}\s?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[Phone]");
  sanitized = sanitized.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "[Date]");
  sanitized = sanitized.replace(/\b\d+\s+[A-Za-z\s]+,\s+[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5}(-\d{4})?\b/g, "[Address]");
  return sanitized;
}

// server/routes/auth.ts
import { Router } from "express";

// server/middleware/auth.ts
import jwt2 from "jsonwebtoken";

// server/utils/jwt.ts
import jwt from "jsonwebtoken";
import { randomUUID as randomUUID2 } from "crypto";
var JWT_SECRET = process.env.JWT_SECRET || "radorderpad-jwt-secret-key";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "radorderpad-refresh-secret-key";
var ACCESS_TOKEN_EXPIRY = "15m";
var REFRESH_TOKEN_EXPIRY = "7d";
function createUserPayload(user) {
  const isDeveloperMode = process.env.NODE_ENV !== "production" && user.email === "physician@abcfamilymedicine.com";
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organizationId: user.organizationId,
    isDeveloperMode
  };
}
function generateTokens(user) {
  const userPayload = createUserPayload(user);
  const tokenId = randomUUID2();
  const accessToken = jwt.sign(
    {
      ...userPayload,
      jti: tokenId
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken2 = jwt.sign(
    {
      sub: user.id,
      jti: tokenId
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  const decoded = jwt.decode(accessToken);
  const expiresIn = typeof decoded.exp === "number" ? decoded.exp - Math.floor(Date.now() / 1e3) : 900;
  return {
    accessToken,
    refreshToken: refreshToken2,
    expiresIn
  };
}
function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return {
      id: payload.id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      organizationId: payload.organizationId,
      isDeveloperMode: payload.isDeveloperMode
    };
  } catch (error) {
    return null;
  }
}
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
function generateAccessToken(payload) {
  const tokenId = randomUUID2();
  return jwt.sign(
    {
      ...payload,
      jti: tokenId
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

// server/middleware/auth.ts
var authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }
    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await storage.getUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Account is inactive" });
    }
    const isDeveloperMode = process.env.NODE_ENV !== "production" && user.email === "physician@abcfamilymedicine.com";
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      // In developer mode, we give admin role access regardless of actual role
      role: isDeveloperMode ? "admin" : user.role,
      organizationId: user.organizationId,
      isDeveloperMode
    };
    next();
  } catch (error) {
    if (error instanceof jwt2.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error instanceof jwt2.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }
    console.error("Auth error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};
var refreshToken = async (req, res, next) => {
  try {
    const { user } = req;
    if (!user) {
      return next();
    }
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      isDeveloperMode: user.isDeveloperMode
    });
    res.setHeader("X-Refresh-Token", token);
    res.setHeader("Access-Control-Expose-Headers", "X-Refresh-Token");
    next();
  } catch (error) {
    console.error("Token refresh error:", error);
    next();
  }
};
var requireAuth = [authenticateJWT, refreshToken];
var requireRole = (roles) => {
  return (req, res, next) => {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(user.role) && !user.isDeveloperMode) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// server/routes/auth.ts
import { z as z2 } from "zod";
import jwt3 from "jsonwebtoken";
var router = Router();
router.post("/login", async (req, res) => {
  try {
    const schema = z2.object({
      email: z2.string().email(),
      password: z2.string().min(1)
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: result.error.format()
      });
    }
    const { email, password } = result.data;
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    let organizationType = null;
    if (user.organizationId) {
      const organization = await storage.getOrganizationById(user.organizationId);
      if (organization) {
        organizationType = organization.type;
      }
    }
    const tokens = generateTokens(user);
    const tokenExpiry = /* @__PURE__ */ new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);
    await storage.createRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.refreshToken.split(".")[2],
      // Use last part of token as ID
      tokenExpiry,
      req.ip,
      req.headers["user-agent"]
    );
    await storage.createAuditLog({
      userId: user.id,
      action: "login",
      resourceType: "user",
      resourceId: String(user.id),
      details: { ip: req.ip },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    });
    return res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          organizationType,
          // Include the organization type in the response
          name: `${user.firstName} ${user.lastName}`,
          // Add name field for client compatibility
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      },
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/refresh", async (req, res) => {
  try {
    console.log("Refresh token endpoint called");
    const schema = z2.object({
      refreshToken: z2.string().min(1)
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: result.error.format()
      });
    }
    const { refreshToken: refreshToken2 } = result.data;
    try {
      const decoded = jwt3.verify(refreshToken2, process.env.JWT_REFRESH_SECRET || "default_refresh_secret");
      if (!decoded || typeof decoded !== "object" || !decoded.sub) {
        return res.status(401).json({
          success: false,
          message: "Invalid token format"
        });
      }
      const userId = decoded.sub;
      const user = await storage.getUserById(Number(userId));
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }
      const tokens = generateTokens(user);
      const tokenExpiry = /* @__PURE__ */ new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7);
      await storage.createRefreshToken(
        user.id,
        tokens.refreshToken,
        tokens.refreshToken.split(".")[2],
        // Use last part of token as ID
        tokenExpiry,
        req.ip,
        req.headers["user-agent"]
      );
      await storage.createAuditLog({
        userId: user.id,
        action: "refresh_token",
        resourceType: "user",
        resourceId: String(user.id),
        details: { ip: req.ip },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || ""
      });
      return res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId
          }
        },
        expiresIn: tokens.expiresIn
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/logout", async (req, res) => {
  try {
    const schema = z2.object({
      refreshToken: z2.string().min(1)
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: result.error.format()
      });
    }
    const { refreshToken: refreshToken2 } = result.data;
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/logout", async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/session", async (req, res) => {
  try {
    console.log("Session endpoint called");
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("Session check: No auth header");
      return res.json({ authenticated: false });
    }
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      console.log("Session check: No token in auth header");
      return res.json({ authenticated: false });
    }
    try {
      const decoded = jwt3.verify(token, process.env.JWT_SECRET || "default_secret");
      if (!decoded || typeof decoded !== "object" || !decoded.sub) {
        console.log("Session check: Invalid token payload");
        return res.json({ authenticated: false });
      }
      const userId = decoded.sub;
      const user = await storage.getUserById(Number(userId));
      if (!user) {
        console.log("Session check: User not found");
        return res.json({ authenticated: false });
      }
      let organizationType = null;
      if (user.organizationId) {
        const organization = await storage.getOrganizationById(user.organizationId);
        if (organization) {
          organizationType = organization.type;
        }
      }
      console.log(`Session check: Authenticated as ${user.email}`);
      return res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          organizationType,
          // Include the organization type in the response
          isActive: user.isActive,
          npi: user.npi,
          signatureUrl: user.signatureUrl,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.log("Session check: Token verification failed", error);
      return res.json({ authenticated: false });
    }
  } catch (error) {
    console.error("Get session error:", error);
    return res.json({ authenticated: false });
  }
});
router.post("/register", async (req, res) => {
  try {
    const schema = z2.object({
      email: z2.string().email(),
      password: z2.string().min(8),
      firstName: z2.string().min(1),
      lastName: z2.string().min(1),
      organizationId: z2.number().int().positive(),
      role: z2.enum(["admin", "physician", "medical_assistant", "scheduler"])
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: result.error.format()
      });
    }
    const { email, password, firstName, lastName, organizationId, role } = result.data;
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const organization = await storage.getOrganizationById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }
    const user = await storage.createUser({
      email,
      password,
      firstName,
      lastName,
      organizationId,
      role
    });
    const tokens = generateTokens(user);
    const tokenExpiry = /* @__PURE__ */ new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);
    await storage.createRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.refreshToken.split(".")[2],
      // Use last part of token as ID
      tokenExpiry,
      req.ip,
      req.headers["user-agent"]
    );
    await storage.createAuditLog({
      userId: user.id,
      action: "register",
      resourceType: "user",
      resourceId: String(user.id),
      details: { ip: req.ip },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    });
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/revoke-all-tokens", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const revokedCount = await storage.revokeAllUserRefreshTokens(userId);
    await storage.createAuditLog({
      userId,
      action: "revoke_all_tokens",
      resourceType: "user",
      resourceId: String(userId),
      details: { count: revokedCount, ip: req.ip },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    });
    res.json({ success: true, revokedCount });
  } catch (error) {
    console.error("Revoke tokens error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/request-password-reset", async (req, res) => {
  try {
    const schema = z2.object({
      email: z2.string().email()
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: result.error.format()
      });
    }
    const { email } = result.data;
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.json({
        success: true,
        message: "If your email exists in our system, you will receive password reset instructions"
      });
    }
    const token = await storage.createPasswordResetToken(user.id);
    await storage.createAuditLog({
      userId: user.id,
      action: "password_reset_request",
      resourceType: "user",
      resourceId: String(user.id),
      details: { ip: req.ip },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    });
    res.json({
      success: true,
      message: "If your email exists in our system, you will receive password reset instructions",
      // Include the reset URL for testing - in production you would only send this via email
      resetUrl: `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/validate-reset-token", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({
        valid: false,
        error: "Missing token"
      });
    }
    const validToken = await storage.getActivePasswordResetTokens(token);
    if (!validToken) {
      return res.json({
        valid: false,
        error: "Invalid or expired token"
      });
    }
    const user = await storage.getUserById(validToken.userId);
    res.json({
      valid: true,
      email: user?.email
    });
  } catch (error) {
    console.error("Validate reset token error:", error);
    res.status(500).json({
      valid: false,
      error: "Internal server error"
    });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const schema = z2.object({
      token: z2.string().min(1),
      password: z2.string().min(8)
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: result.error.format()
      });
    }
    const { token, password } = result.data;
    const validToken = await storage.getActivePasswordResetTokens(token);
    if (!validToken) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired token"
      });
    }
    const user = await storage.getUserById(validToken.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found"
      });
    }
    await storage.updateUserPassword(user.id, password);
    await storage.revokeAllUserRefreshTokens(user.id);
    await storage.markPasswordResetTokenUsed(token);
    await storage.createAuditLog({
      userId: user.id,
      action: "password_reset",
      resourceType: "user",
      resourceId: String(user.id),
      details: { ip: req.ip },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    });
    res.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router.post("/verify-email/request", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: "Email already verified"
      });
    }
    const token = await storage.createEmailVerificationToken(user.id);
    await storage.createAuditLog({
      userId: user.id,
      action: "email_verification_request",
      resourceType: "user",
      resourceId: String(user.id),
      details: { ip: req.ip },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    });
    res.json({
      success: true,
      message: "Verification email sent",
      // Include the verification URL for testing - in production you would only send this via email
      verificationUrl: `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${token}`
    });
  } catch (error) {
    console.error("Email verification request error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router.post("/verify-email", async (req, res) => {
  try {
    const schema = z2.object({
      token: z2.string().min(1)
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: result.error.format()
      });
    }
    const { token } = result.data;
    const validToken = await storage.getActiveEmailVerificationTokens(token);
    if (!validToken) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired token"
      });
    }
    const user = await storage.getUserById(validToken.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "User not found"
      });
    }
    await storage.markUserEmailVerified(user.id);
    await storage.markEmailVerificationTokenUsed(token);
    await storage.createAuditLog({
      userId: user.id,
      action: "email_verified",
      resourceType: "user",
      resourceId: String(user.id),
      details: { ip: req.ip },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    });
    res.json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
var auth_default = router;

// server/routes/invitations.ts
import { Router as Router2 } from "express";
import multer from "multer";

// server/services/csvImportService.ts
import csvParser from "csv-parser";
import { Readable } from "stream";
import { z as z3 } from "zod";
var CSVImportService = class {
  /**
   * Process a CSV file as a stream
   */
  async processCSVBuffer(buffer, roleType) {
    const records = [];
    await new Promise((resolve2, reject) => {
      const stream = Readable.from(buffer);
      stream.pipe(csvParser()).on("data", (data) => records.push(data)).on("end", resolve2).on("error", reject);
    });
    const results = {
      successful: [],
      failed: []
    };
    for (const record of records) {
      let validation;
      switch (roleType) {
        case "physician":
          validation = this.validatePhysician(record);
          break;
        case "medical_assistant":
          validation = this.validateMedicalAssistant(record);
          break;
        case "scheduler":
          validation = this.validateScheduler(record);
          break;
        default:
          validation = { valid: false, errors: ["Invalid role type"] };
      }
      if (validation.valid) {
        results.successful.push(record);
      } else {
        results.failed.push({
          record,
          reason: validation.errors.join(", ")
        });
      }
    }
    return results;
  }
  /**
   * Validate a physician record
   */
  validatePhysician(record) {
    try {
      physicianImportSchema.parse(record);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => e.message)
        };
      }
      return {
        valid: false,
        errors: ["Unknown validation error"]
      };
    }
  }
  /**
   * Validate a medical assistant record
   */
  validateMedicalAssistant(record) {
    try {
      medicalAssistantImportSchema.parse(record);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => e.message)
        };
      }
      return {
        valid: false,
        errors: ["Unknown validation error"]
      };
    }
  }
  /**
   * Validate a scheduler record
   */
  validateScheduler(record) {
    try {
      schedulerImportSchema.parse(record);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => e.message)
        };
      }
      return {
        valid: false,
        errors: ["Unknown validation error"]
      };
    }
  }
};

// server/services/emailService.ts
import nodemailer from "nodemailer";
import fs from "fs";
import path2 from "path";
import Handlebars from "handlebars";
var EmailService = class {
  constructor() {
    this.templateDir = path2.join(process.cwd(), "email_templates");
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  /**
   * Send an email using a template
   */
  async sendEmail(options) {
    try {
      const templatePath = path2.join(this.templateDir, `${options.template}.html`);
      const templateContent = fs.readFileSync(templatePath, "utf-8");
      const template = Handlebars.compile(templateContent);
      const html = template(options.data);
      await this.transporter.sendMail({
        from: options.from || `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html
      });
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }
};

// server/services/invitationService.ts
import crypto from "crypto";
import { addDays } from "date-fns";

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres2 from "postgres";
var connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/radorderpad";
var client2 = postgres2(connectionString);
var db2 = drizzle(client2, { schema: schema_exports });

// server/services/invitationService.ts
import { eq as eq3 } from "drizzle-orm";
var InvitationService = class {
  constructor() {
    this.emailService = new EmailService();
  }
  /**
   * Generate a new invitation token
   */
  generateToken() {
    return crypto.randomBytes(32).toString("hex");
  }
  /**
   * Create an invitation link
   */
  createInvitationLink({ token, baseUrl }) {
    return `${baseUrl}/accept-invitation?token=${token}`;
  }
  /**
   * Create a new user invitation
   */
  async createInvitation(options) {
    const token = this.generateToken();
    const expiresAt = addDays(/* @__PURE__ */ new Date(), 7);
    const invitation = {
      organizationId: options.organizationId,
      invitedByUserId: options.invitedByUserId,
      email: options.email,
      role: options.role,
      token,
      expiresAt,
      status: "pending"
    };
    await db2.insert(userInvitations).values([invitation]);
    return token;
  }
  /**
   * Send an invitation email
   */
  async sendInvitationEmail(token, baseUrl) {
    try {
      const invitation = await db2.query.userInvitations.findFirst({
        where: eq3(userInvitations.token, token),
        with: {
          organization: true,
          invitedBy: true
        }
      });
      if (!invitation) {
        throw new Error("Invitation not found");
      }
      const invitationLink = this.createInvitationLink({ token, baseUrl });
      const invitedBy = invitation.invitedBy ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}` : "The administrator";
      const formattedRole = invitation.role.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
      const emailSent = await this.emailService.sendEmail({
        to: invitation.email,
        subject: `You're invited to join ${invitation.organization.name} on RadOrderPad`,
        template: "invitation",
        data: {
          firstName: "",
          // Will be filled in when user accepts invitation
          lastName: "",
          // Will be filled in when user accepts invitation
          email: invitation.email,
          invitedBy,
          organizationName: invitation.organization.name,
          role: formattedRole,
          invitationLink
        }
      });
      return emailSent;
    } catch (error) {
      console.error("Error sending invitation email:", error);
      return false;
    }
  }
  /**
   * Validate an invitation token
   */
  async validateInvitation(token) {
    try {
      const invitation = await db2.query.userInvitations.findFirst({
        where: eq3(userInvitations.token, token)
      });
      if (!invitation) {
        return false;
      }
      const now = /* @__PURE__ */ new Date();
      if (invitation.status !== "pending" || invitation.expiresAt < now) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error validating invitation:", error);
      return false;
    }
  }
  /**
   * Accept an invitation and create a user account
   */
  async acceptInvitation(token, userData) {
    try {
      const invitation = await db2.query.userInvitations.findFirst({
        where: eq3(userInvitations.token, token)
      });
      if (!invitation) {
        throw new Error("Invitation not found");
      }
      const isValid = await this.validateInvitation(token);
      if (!isValid) {
        throw new Error("Invalid or expired invitation");
      }
      const [newUser] = await db2.insert(users).values({
        organizationId: invitation.organizationId,
        email: invitation.email,
        passwordHash: userData.password,
        // Note: This will be hashed in the auth service
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: invitation.role,
        npi: userData.npi,
        specialty: userData.specialty,
        emailVerified: true,
        // Auto-verify email since it was validated through invitation
        invitationToken: token,
        invitationAcceptedAt: /* @__PURE__ */ new Date()
      }).returning({ id: users.id });
      await db2.update(userInvitations).set({ status: "accepted" }).where(eq3(userInvitations.token, token));
      return newUser?.id || null;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      return null;
    }
  }
  /**
   * Invite multiple users via CSV import
   */
  async bulkInviteUsers(records, organizationId, invitedByUserId, baseUrl) {
    let successful = 0;
    let failed = 0;
    for (const record of records) {
      try {
        const token = await this.createInvitation({
          email: record.email,
          role: record.role,
          organizationId,
          invitedByUserId
        });
        const emailSent = await this.sendInvitationEmail(token, baseUrl);
        if (emailSent) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error("Error inviting user:", error);
        failed++;
      }
    }
    return { successful, failed };
  }
};

// server/services/index.ts
var csvImportService = new CSVImportService();
var emailService = new EmailService();
var invitationService = new InvitationService();

// server/routes/invitations.ts
import { z as z4 } from "zod";
import { hash } from "bcryptjs";
import { eq as eq4 } from "drizzle-orm";
var router2 = Router2();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  }
});
var createInvitationSchema = z4.object({
  email: z4.string().email("Invalid email address"),
  role: z4.enum(["admin", "physician", "medical_assistant", "scheduler"], {
    errorMap: () => ({ message: "Invalid role" })
  }),
  organizationId: z4.number().int().positive("Organization ID is required")
});
var acceptInvitationSchema = z4.object({
  token: z4.string().min(1, "Invalid token"),
  firstName: z4.string().min(1, "First name is required"),
  lastName: z4.string().min(1, "Last name is required"),
  password: z4.string().min(8, "Password must be at least 8 characters"),
  npi: z4.string().length(10, "NPI must be 10 digits").optional(),
  specialty: z4.string().optional()
});
router2.get("/api/invitations/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const isValid = await invitationService.validateInvitation(token);
    if (!isValid) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired invitation"
      });
    }
    const invitation = await db2.query.userInvitations.findFirst({
      where: eq4(userInvitations.token, token),
      with: {
        organization: true
      }
    });
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found"
      });
    }
    return res.json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organization: invitation.organization.name,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error("Error getting invitation details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get invitation details"
    });
  }
});
router2.post("/api/invitations", requireAuth, requireRole(["admin"]), async (req, res) => {
  try {
    const parsedBody = createInvitationSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: parsedBody.error.errors
      });
    }
    const { email, role, organizationId } = parsedBody.data;
    const existingUser = await db2.query.users.findFirst({
      where: eq4(users.email, email)
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists"
      });
    }
    const token = await invitationService.createInvitation({
      email,
      role,
      organizationId,
      invitedByUserId: req.user.id
    });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const emailSent = await invitationService.sendInvitationEmail(token, baseUrl);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send invitation email"
      });
    }
    return res.json({
      success: true,
      message: "Invitation sent successfully"
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create invitation"
    });
  }
});
router2.post("/api/invitations/accept", async (req, res) => {
  try {
    const parsedBody = acceptInvitationSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: parsedBody.error.errors
      });
    }
    const { token, firstName, lastName, password, npi, specialty } = parsedBody.data;
    const passwordHash = await hash(password, 10);
    const userId = await invitationService.acceptInvitation(token, {
      firstName,
      lastName,
      password: passwordHash,
      npi,
      specialty
    });
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Failed to accept invitation"
      });
    }
    return res.json({
      success: true,
      message: "Invitation accepted successfully",
      userId
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to accept invitation"
    });
  }
});
router2.post(
  "/api/invitations/bulk-import",
  requireAuth,
  requireRole(["admin"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }
      const { role } = req.body;
      if (!role || !["physician", "medical_assistant", "scheduler"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role type"
        });
      }
      const results = await csvImportService.processCSVBuffer(
        req.file.buffer,
        role
      );
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const invitationResults = await invitationService.bulkInviteUsers(
        results.successful,
        req.user.organizationId,
        req.user.id,
        baseUrl
      );
      const admin = await db2.query.users.findFirst({
        where: eq4(users.id, req.user.id)
      });
      if (admin) {
        const formattedRole = role.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
        await emailService.sendEmail({
          to: admin.email,
          subject: `CSV Import Results: ${formattedRole}s`,
          template: "import-results",
          data: {
            firstName: admin.firstName,
            email: admin.email,
            importType: formattedRole,
            successCount: invitationResults.successful,
            failureCount: invitationResults.failed + results.failed.length,
            hasFailures: results.failed.length > 0,
            failures: results.failed
          }
        });
      }
      return res.json({
        success: true,
        message: "CSV processed successfully",
        results: {
          successful: invitationResults.successful,
          failed: invitationResults.failed + results.failed.length,
          total: results.successful.length + results.failed.length
        }
      });
    } catch (error) {
      console.error("Error importing users from CSV:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to import users from CSV"
      });
    }
  }
);
var invitations_default = router2;

// server/routes/users.ts
import express from "express";
import { z as z5 } from "zod";

// server/middleware/roles.ts
var adminOnly = (req, res, next) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// server/routes/users.ts
import bcrypt2 from "bcryptjs";
var router3 = express.Router();
router3.get("/", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    const users2 = await storage.getUsersByOrganization(user.organizationId);
    const sanitizedUsers = users2.map((user2) => {
      const { passwordHash, ...sanitizedUser } = user2;
      return sanitizedUser;
    });
    return res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});
router3.get("/organization", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    console.log("GET /api/users/organization - Request received", {
      user: user ? {
        id: user.id,
        organizationId: user.organizationId,
        role: user.role,
        hasUser: !!user
      } : "No user in request"
    });
    if (!user) {
      console.error("Error fetching organization users: Invalid user - user object is null");
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (!user.organizationId) {
      console.error("Error fetching organization users: Missing organizationId", {
        userId: user.id,
        userKeys: Object.keys(user)
      });
      return res.status(400).json({ error: "Missing organization ID" });
    }
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const sortField = req.query.sortField || "lastName";
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
    const filters = {};
    if (req.query.role && req.query.role !== "all") {
      filters.role = req.query.role;
    }
    if (req.query.status && req.query.status !== "all") {
      filters.status = req.query.status;
    }
    if (req.query.search) {
      filters.search = req.query.search;
    }
    console.log(`Fetching users for organization ID ${user.organizationId} with pagination and sorting`, {
      limit,
      offset,
      sortField,
      sortOrder,
      filters
    });
    const result = await storage.getUsersByOrganizationPaginated(
      user.organizationId,
      limit,
      offset,
      sortField,
      sortOrder,
      filters
    );
    console.log(`Found ${result.users.length} users (${result.total} total) for organization ID ${user.organizationId}`);
    const sanitizedUsers = result.users.map((user2) => {
      const { passwordHash, ...sanitizedUser } = user2;
      return sanitizedUser;
    });
    return res.json({
      users: sanitizedUsers,
      total: result.total,
      limit,
      offset,
      sortField,
      sortOrder
    });
  } catch (error) {
    console.error("Error fetching organization users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});
router3.get("/export", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    if (!user || !user.organizationId) {
      return res.status(400).json({ error: "Invalid user or missing organization ID" });
    }
    const filters = {};
    if (req.query.role && req.query.role !== "all") {
      filters.role = req.query.role;
    }
    if (req.query.status && req.query.status !== "all") {
      filters.status = req.query.status;
    }
    if (req.query.search) {
      filters.search = req.query.search;
    }
    const sortField = req.query.sortField || "lastName";
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
    const result = await storage.getUsersByOrganizationPaginated(
      user.organizationId,
      1e3,
      // Large limit to get all users
      0,
      // No offset
      sortField,
      sortOrder,
      filters
    );
    const organization = await storage.getOrganizationById(user.organizationId);
    const date = /* @__PURE__ */ new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=users-${formattedDate}.csv`);
    let csvContent = "First Name,Last Name,Email,Role,Status,Email Verified,Last Login";
    if (organization?.type === "referring_practice") {
      csvContent += ",NPI,Specialty";
    }
    csvContent += "\n";
    result.users.forEach((user2) => {
      let row = [
        user2.firstName,
        user2.lastName,
        user2.email,
        user2.role,
        user2.isActive ? "Active" : "Inactive",
        user2.emailVerified ? "Yes" : "No",
        user2.lastLogin ? new Date(user2.lastLogin).toLocaleString() : "Never"
      ];
      if (organization?.type === "referring_practice") {
        row.push(user2.npi || "");
        row.push(user2.specialty || "");
      }
      csvContent += row.map((field) => {
        if (field && typeof field === "string" && (field.includes(",") || field.includes('"') || field.includes("\n"))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(",") + "\n";
    });
    return res.send(csvContent);
  } catch (error) {
    console.error("Error exporting users:", error);
    return res.status(500).json({ error: "Failed to export users" });
  }
});
router3.get("/me", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const currentUser = await storage.getUserById(user.id);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const { passwordHash, ...sanitizedUser } = currentUser;
    const organization = await storage.getOrganizationById(currentUser.organizationId);
    return res.json({
      ...sanitizedUser,
      organization: organization || void 0
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ error: "Failed to fetch current user" });
  }
});
router3.get("/:id", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    const userId = parseInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const targetUser = await storage.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (targetUser.organizationId !== user.organizationId) {
      return res.status(403).json({ error: "Not authorized to access this user" });
    }
    const { passwordHash, ...sanitizedUser } = targetUser;
    return res.json(sanitizedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});
router3.post("/", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    const userSchema = z5.object({
      firstName: z5.string().min(1),
      lastName: z5.string().min(1),
      email: z5.string().email(),
      role: z5.enum(["admin", "physician", "medical_assistant", "scheduler"]),
      npi: z5.string().optional().nullable(),
      password: z5.string().min(8),
      specialtyId: z5.number().optional().nullable()
    });
    const validationResult = userSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid user data", details: validationResult.error });
    }
    const userData = validationResult.data;
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }
    const passwordHash = await bcrypt2.hash(userData.password, 10);
    const newUser = await storage.createUser({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      passwordHash,
      role: userData.role,
      organizationId: user.organizationId,
      npi: userData.npi || null,
      specialtyId: userData.specialtyId || null,
      isActive: true,
      emailVerified: true
      // Admins can create pre-verified accounts
    });
    const { passwordHash: _, ...sanitizedUser } = newUser;
    return res.status(201).json({
      message: "User created successfully",
      user: sanitizedUser
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});
router3.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const userId = parseInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (userId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this user" });
    }
    const targetUser = await storage.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (targetUser.organizationId !== user.organizationId) {
      return res.status(403).json({ error: "Not authorized to update this user" });
    }
    const updateSchema = z5.object({
      firstName: z5.string().min(1).optional(),
      lastName: z5.string().min(1).optional(),
      npi: z5.string().nullable().optional(),
      specialtyId: z5.number().nullable().optional(),
      signatureUrl: z5.string().nullable().optional(),
      isActive: z5.boolean().optional(),
      role: z5.enum(["admin", "physician", "medical_assistant", "scheduler"]).optional()
    });
    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid update data", details: validationResult.error });
    }
    const updateData = validationResult.data;
    if (user.role !== "admin") {
      delete updateData.role;
      delete updateData.isActive;
    }
    const updatedUser = await storage.updateUser(userId, updateData);
    const { passwordHash, ...sanitizedUser } = updatedUser;
    return res.json({
      message: "User updated successfully",
      user: sanitizedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});
router3.post("/:id/change-password", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const userId = parseInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (userId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to change this user's password" });
    }
    const targetUser = await storage.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (targetUser.organizationId !== user.organizationId) {
      return res.status(403).json({ error: "Not authorized to update this user" });
    }
    const passwordSchema = z5.object({
      currentPassword: z5.string().min(1),
      newPassword: z5.string().min(8)
    });
    const validationResult = passwordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid password data", details: validationResult.error });
    }
    const { currentPassword, newPassword } = validationResult.data;
    if (userId === user.id) {
      const isPasswordValid = await bcrypt2.compare(currentPassword, targetUser.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }
    const passwordHash = await bcrypt2.hash(newPassword, 10);
    await storage.updateUserPassword(userId, passwordHash);
    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
});
router3.post("/import", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    const importSchema = z5.object({
      users: z5.array(z5.object({
        firstName: z5.string().min(1),
        lastName: z5.string().min(1),
        email: z5.string().email(),
        role: z5.enum(["admin", "physician", "medical_assistant", "scheduler"]),
        npi: z5.string().optional().nullable(),
        specialtyId: z5.number().optional().nullable()
      }))
    });
    const validationResult = importSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid import data", details: validationResult.error });
    }
    const { users: users2 } = validationResult.data;
    const results = await Promise.all(users2.map(async (userData) => {
      try {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          return {
            email: userData.email,
            status: "skipped",
            message: "User already exists"
          };
        }
        const invitation = await storage.createUserInvitation({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          npi: userData.npi || null,
          specialtyId: userData.specialtyId || null,
          organizationId: user.organizationId,
          invitedByUserId: user.id
        });
        return {
          email: userData.email,
          status: "invited",
          message: "Invitation created successfully"
        };
      } catch (error) {
        console.error(`Error processing user ${userData.email}:`, error);
        return {
          email: userData.email,
          status: "error",
          message: error.message || "Failed to process user"
        };
      }
    }));
    const summary = {
      total: results.length,
      invited: results.filter((r) => r.status === "invited").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error").length
    };
    return res.json({
      message: "Users import processed",
      summary,
      results
    });
  } catch (error) {
    console.error("Error importing users:", error);
    return res.status(500).json({ error: "Failed to import users" });
  }
});
var users_default = router3;

// server/routes/organizations.ts
import express2 from "express";
import { z as z6 } from "zod";
var router4 = express2.Router();
router4.get("/", requireAuth, adminOnly, async (req, res) => {
  try {
    const organizations3 = await storage.getAllOrganizations();
    return res.json(organizations3);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return res.status(500).json({ error: "Failed to fetch organizations" });
  }
});
router4.get("/current", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const organization = await storage.getOrganizationById(user.organizationId);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }
    return res.json(organization);
  } catch (error) {
    console.error("Error fetching current organization:", error);
    return res.status(500).json({ error: "Failed to fetch organization" });
  }
});
router4.get("/:id", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    const organizationId = parseInt(req.params.id);
    if (organizationId !== user.organizationId) {
      const relationship = await storage.getRelationshipBetweenOrganizations(
        user.organizationId,
        organizationId
      );
      if (!relationship || relationship.status !== "active") {
        return res.status(403).json({ error: "Not authorized to access this organization" });
      }
    }
    const organization = await storage.getOrganizationById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }
    return res.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return res.status(500).json({ error: "Failed to fetch organization" });
  }
});
router4.patch("/:id", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    const organizationId = parseInt(req.params.id);
    if (organizationId !== user.organizationId) {
      return res.status(403).json({ error: "Not authorized to update this organization" });
    }
    const organization = await storage.getOrganizationById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }
    const updateSchema = z6.object({
      name: z6.string().min(1).optional(),
      type: z6.enum(["referring_practice", "radiology_group"]).optional(),
      npi: z6.string().nullable().optional(),
      taxId: z6.string().nullable().optional(),
      addressLine1: z6.string().nullable().optional(),
      addressLine2: z6.string().nullable().optional(),
      city: z6.string().nullable().optional(),
      state: z6.string().nullable().optional(),
      zipCode: z6.string().nullable().optional(),
      phone: z6.string().nullable().optional(),
      fax: z6.string().nullable().optional(),
      email: z6.string().email().nullable().optional(),
      website: z6.string().url().nullable().optional(),
      logoUrl: z6.string().url().nullable().optional()
    });
    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid update data", details: validationResult.error });
    }
    const updateData = validationResult.data;
    const updatedOrg = await storage.updateOrganization(organizationId, updateData);
    return res.json({
      message: "Organization updated successfully",
      organization: updatedOrg
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    return res.status(500).json({ error: "Failed to update organization" });
  }
});
router4.get("/relationships/all", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    console.log(`[RELATIONSHIPS] Fetching active relationships for user ${user.id} (${user.email}), organization ${user.organizationId}`);
    const userOrg = await storage.getOrganizationById(user.organizationId);
    console.log(`[RELATIONSHIPS] User organization: ${userOrg?.name} (${userOrg?.type})`);
    const allRelationships = await storage.getOrganizationRelationshipsByOrganization(
      user.organizationId,
      "active"
    );
    console.log(`[RELATIONSHIPS] Found ${allRelationships.length} active relationships:`);
    allRelationships.forEach((rel, idx) => {
      const isInitiator = rel.organizationId === user.organizationId;
      const partnerOrg = isInitiator ? rel.relatedOrganization : rel.organization;
      console.log(`[RELATIONSHIPS] ${idx + 1}: ${rel.organizationId} -> ${rel.relatedOrganizationId} (showing "${partnerOrg?.name || "Unknown"}" as partner org)`);
    });
    return res.json(allRelationships);
  } catch (error) {
    console.error("Error fetching relationships:", error);
    return res.status(500).json({ error: "Failed to fetch relationships" });
  }
});
router4.get("/relationships/incoming", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    console.log(`[RELATIONSHIPS] Fetching incoming pending relationships for organization ${user.organizationId}`);
    const relationships = await storage.getOrganizationRelationshipsByOrganization(
      user.organizationId,
      "pending"
    );
    const incomingRelationships = relationships.filter(
      (rel) => rel.relatedOrganizationId === user.organizationId
    );
    console.log(`[RELATIONSHIPS] Found ${incomingRelationships.length} incoming pending relationships`);
    return res.json(incomingRelationships);
  } catch (error) {
    console.error("Error fetching incoming relationship requests:", error);
    return res.status(500).json({ error: "Failed to fetch incoming relationship requests" });
  }
});
router4.post("/relationships/request", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    console.log("Received relationship request:", req.body);
    const requestSchema = z6.object({
      targetOrganizationId: z6.number().optional(),
      targetOrganizationName: z6.string().min(1).optional(),
      notes: z6.string().nullable().optional()
    }).refine((data) => data.targetOrganizationId !== void 0 || data.targetOrganizationName !== void 0, {
      message: "Either targetOrganizationId or targetOrganizationName must be provided"
    });
    const validationResult = requestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid request data", details: validationResult.error });
    }
    const { targetOrganizationId, targetOrganizationName, notes } = validationResult.data;
    let targetOrganization;
    if (targetOrganizationId) {
      console.log(`Finding organization by ID: ${targetOrganizationId}`);
      targetOrganization = await storage.getOrganizationById(targetOrganizationId);
    } else if (targetOrganizationName) {
      console.log(`Finding organization by name: ${targetOrganizationName}`);
      targetOrganization = await storage.getOrganizationByName(targetOrganizationName);
    }
    if (!targetOrganization) {
      return res.status(404).json({ error: "Target organization not found" });
    }
    const userOrganization = await storage.getOrganizationById(user.organizationId);
    if (!userOrganization) {
      return res.status(404).json({ error: "User organization not found" });
    }
    if (user.organizationId === targetOrganization.id) {
      return res.status(400).json({ error: "Cannot create a relationship with your own organization" });
    }
    if (userOrganization.type === targetOrganization.type) {
      return res.status(400).json({
        error: "Cannot create relationship between organizations of the same type. A referring practice must connect to a radiology group and vice versa."
      });
    }
    const existingRelationship = await storage.getRelationshipBetweenOrganizations(
      user.organizationId,
      targetOrganization.id
    );
    if (existingRelationship) {
      console.log(`Existing relationship found: ${JSON.stringify(existingRelationship)}`);
      const organizationDetails = await Promise.all([
        storage.getOrganizationById(user.organizationId),
        storage.getOrganizationById(targetOrganization.id)
      ]);
      const [userOrg, targetOrg] = organizationDetails;
      return res.status(409).json({
        error: `A relationship already exists between ${userOrg?.name || "your organization"} and ${targetOrg?.name || "this organization"}`,
        details: `Current status: ${existingRelationship.status}`,
        status: existingRelationship.status,
        relationship: existingRelationship
      });
    }
    const relationship = await storage.createOrganizationRelationship({
      organizationId: user.organizationId,
      relatedOrganizationId: targetOrganization.id,
      initiatedById: user.id,
      notes: notes || null
    });
    const sourceOrganization = await storage.getOrganizationById(user.organizationId);
    return res.status(201).json({
      message: "Relationship request created",
      relationship,
      sourceOrganization,
      targetOrganization
    });
  } catch (error) {
    console.error("Error creating relationship request:", error);
    return res.status(500).json({ error: "Failed to create relationship request" });
  }
});
router4.patch("/relationships/:id", requireAuth, adminOnly, async (req, res) => {
  try {
    const { user } = req;
    const relationshipId = parseInt(req.params.id);
    const actionSchema = z6.object({
      action: z6.enum(["approve", "reject"]),
      notes: z6.string().nullable().optional()
    });
    const validationResult = actionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid action data", details: validationResult.error });
    }
    const { action, notes } = validationResult.data;
    const relationship = await storage.getOrganizationRelationshipById(relationshipId);
    if (!relationship) {
      return res.status(404).json({ error: "Relationship not found" });
    }
    if (relationship.relatedOrganizationId !== user.organizationId) {
      return res.status(403).json({ error: "Not authorized to respond to this relationship request" });
    }
    if (relationship.status !== "pending") {
      return res.status(400).json({ error: `Cannot ${action} a relationship that is not pending` });
    }
    const newStatus = action === "approve" ? "active" : "rejected";
    const updatedRelationship = await storage.updateOrganizationRelationship(relationshipId, {
      status: newStatus,
      approvedById: action === "approve" ? user.id : null,
      notes: notes || relationship.notes
    });
    return res.json({
      message: `Relationship ${newStatus}`,
      relationship: updatedRelationship
    });
  } catch (error) {
    console.error("Error responding to relationship request:", error);
    return res.status(500).json({ error: "Failed to respond to relationship request" });
  }
});
router4.get("/search/:query", requireAuth, async (req, res) => {
  try {
    const { query } = req.params;
    const { user } = req;
    if (!query || query.length < 3) {
      return res.status(400).json({ error: "Search query must be at least 3 characters" });
    }
    console.log(`[SEARCH] User ${user.id} (${user.email}) searching for organizations with query: "${query}"`);
    const organizations3 = await storage.searchOrganizationsByName(query);
    console.log(`[SEARCH] Found ${organizations3.length} matching organizations before filtering`);
    const userOrganization = await storage.getOrganizationById(user.organizationId);
    if (!userOrganization) {
      console.log(`[SEARCH] User organization (ID: ${user.organizationId}) not found`);
      return res.status(404).json({ error: "User organization not found" });
    }
    console.log(`[SEARCH] User organization: ${userOrganization.name} (${userOrganization.type})`);
    const filteredOrgs = organizations3.filter((org) => {
      const keep = org.id !== user.organizationId && org.type !== userOrganization.type;
      if (!keep) {
        console.log(`[SEARCH] Filtering out: ${org.name} (${org.type}) - Same org: ${org.id === user.organizationId}, Same type: ${org.type === userOrganization.type}`);
      }
      return keep;
    });
    console.log(`[SEARCH] Returning ${filteredOrgs.length} filtered organizations`);
    return res.json(filteredOrgs);
  } catch (error) {
    console.error("Error searching organizations:", error);
    return res.status(500).json({ error: "Failed to search organizations" });
  }
});
var organizations_default = router4;

// server/routes/pdf.ts
import { Router as Router3 } from "express";

// server/services/order-pdf.ts
import fs2 from "fs";
import path3 from "path";
import handlebars from "handlebars";
import htmlPdf from "html-pdf";
var OrderPdfService = class {
  constructor() {
    this.templatePath = path3.join(process.cwd(), "email_templates", "order-radiologist-focused.html");
  }
  /**
   * Generate a PDF from order data
   */
  async generateOrderPdf(order, diagnosisCodes2, procedureCodes2, referringPhysician, referringOrganization, options = {}) {
    const orderData = this.prepareOrderData(
      order,
      diagnosisCodes2,
      procedureCodes2,
      referringPhysician,
      referringOrganization
    );
    const html = await this.renderTemplate(orderData);
    return this.generatePdf(html, options);
  }
  /**
   * Prepare order data for template
   */
  prepareOrderData(order, diagnosisCodes2, procedureCodes2, referringPhysician, referringOrganization) {
    let patientAge;
    if (order.patientDob) {
      const dob = new Date(order.patientDob);
      const today = /* @__PURE__ */ new Date();
      patientAge = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || monthDiff === 0 && today.getDate() < dob.getDate()) {
        patientAge--;
      }
    }
    const orderDate = new Date(order.createdAt || /* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const patientDob = order.patientDob ? new Date(order.patientDob).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }) : "Unknown";
    const validationDate = new Date(order.validatedAt || /* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const orderNumber = order.id ? `ROP-${order.id.toString().padStart(8, "0")}` : `ROP-${(/* @__PURE__ */ new Date()).getTime().toString().substring(0, 8)}`;
    let contrastType = "";
    if (order.contrast === "without") {
      contrastType = "WITHOUT CONTRAST";
    } else if (order.contrast === "with") {
      contrastType = "WITH CONTRAST";
    } else if (order.contrast === "both") {
      contrastType = "WITHOUT AND WITH CONTRAST";
    }
    return {
      orderNumber,
      orderDate,
      exam: {
        modality: order.modality?.toUpperCase() || "",
        bodyPart: order.bodyPart?.toUpperCase() || "",
        contrastType,
        isRoutine: order.priority !== "stat",
        isStat: order.priority === "stat"
      },
      clinicalIndication: order.clinicalIndication || "",
      diagnosisCodes: diagnosisCodes2.map((code) => ({
        code: code.code,
        description: code.description || ""
      })),
      procedureCodes: procedureCodes2.map((code) => ({
        code: code.code,
        description: code.description || ""
      })),
      patient: {
        name: order.patientName || "",
        dob: patientDob,
        age: patientAge,
        mrn: order.patientMrn || "",
        gender: order.patientGender || ""
      },
      referringPhysician: {
        name: `${referringPhysician.firstName} ${referringPhysician.lastName}`,
        npi: referringPhysician.npi || "",
        specialty: referringPhysician.specialty || "",
        phone: referringPhysician.phoneNumber || "",
        organization: referringOrganization.name
      },
      insurance: {
        primary: order.insuranceProvider || "",
        policyNumber: order.insurancePolicyNumber || "",
        authorizationNumber: order.insuranceAuthNumber || void 0
      },
      validation: {
        score: order.complianceScore || 0,
        date: validationDate,
        notes: order.validationNotes || "Order validated against appropriate use criteria."
      },
      specialInstructions: order.specialInstructions || void 0
    };
  }
  /**
   * Render HTML from template
   */
  async renderTemplate(data) {
    const templateContent = await fs2.promises.readFile(this.templatePath, "utf8");
    const template = handlebars.compile(templateContent);
    return template(data);
  }
  /**
   * Generate PDF from HTML
   */
  generatePdf(html, options) {
    const pdfOptions = {
      format: options.format || "Letter",
      orientation: options.orientation || "portrait",
      border: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in"
      },
      footer: {
        height: "0.5in",
        contents: {
          default: '<div style="text-align: center; font-size: 10px; color: #777;">Generated by RadOrderPad</div>'
        }
      }
    };
    return new Promise((resolve2, reject) => {
      htmlPdf.create(html, pdfOptions).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve2(buffer);
        }
      });
    });
  }
};
var orderPdfService = new OrderPdfService();

// server/routes/pdf.ts
import { z as z7 } from "zod";
var pdfRouter = Router3();
pdfRouter.get("/test-sample", async (req, res) => {
  try {
    const sampleOrder = {
      id: 12345,
      orderNumber: "ORD123456",
      createdAt: /* @__PURE__ */ new Date(),
      patientName: "John Doe",
      patientDob: "01/01/1980",
      patientMrn: "MRN12345",
      patientGender: "Male",
      priority: "routine",
      modality: "MRI",
      bodyPart: "LUMBAR SPINE",
      contrast: "without",
      clinicalIndication: "MRI of the lumbar spine for severe lower back pain radiating to left leg for 2 weeks. Patient has failed physical therapy and NSAIDs.",
      complianceScore: 4,
      validationNotes: "Acute low back pain (<6 weeks) without red flags should be managed conservatively for 6 weeks before imaging.",
      validatedAt: /* @__PURE__ */ new Date(),
      insuranceProvider: "Blue Cross Blue Shield",
      insurancePolicyNumber: "BCBS123456789",
      insuranceAuthNumber: "AUTH123456",
      specialInstructions: "Patient is claustrophobic, may need sedation."
    };
    const diagnosisCodes2 = [
      { code: "M54.5", description: "Low back pain" },
      { code: "M54.16", description: "Radiculopathy, lumbar region" }
    ];
    const procedureCodes2 = [
      { code: "72148", description: "MRI lumbar spine without contrast" }
    ];
    const referringPhysician = {
      firstName: "Jane",
      lastName: "Smith",
      npi: "1234567890",
      specialty: "Neurology",
      phoneNumber: "(555) 123-4567"
    };
    const referringOrganization = {
      name: "ABC Medical Center"
    };
    const pdfBuffer = await orderPdfService.generateOrderPdf(
      sampleOrder,
      diagnosisCodes2,
      procedureCodes2,
      referringPhysician,
      referringOrganization,
      {
        format: "Letter",
        orientation: "portrait"
      }
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sample-radiology-order.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate sample PDF" });
  }
});
var generatePdfSchema = z7.object({
  orderNumber: z7.string(),
  clinicalIndication: z7.string(),
  diagnosisCodes: z7.array(
    z7.object({
      code: z7.string(),
      description: z7.string(),
      confidence: z7.number().optional()
    })
  ),
  procedureCodes: z7.array(
    z7.object({
      code: z7.string(),
      description: z7.string(),
      modality: z7.string().optional(),
      confidence: z7.number().optional()
    })
  ),
  exam: z7.object({
    modality: z7.string(),
    bodyPart: z7.string(),
    contrastType: z7.string(),
    isRoutine: z7.boolean(),
    isStat: z7.boolean()
  }),
  patient: z7.object({
    name: z7.string().optional(),
    dob: z7.string().optional(),
    mrn: z7.string().optional(),
    gender: z7.string().optional()
  }),
  referringPhysician: z7.object({
    name: z7.string().optional(),
    npi: z7.string().optional(),
    specialty: z7.string().optional(),
    phone: z7.string().optional(),
    organization: z7.string().optional()
  }),
  insurance: z7.object({
    provider: z7.string().optional(),
    policyNumber: z7.string().optional(),
    authorizationNumber: z7.string().optional()
  }),
  validation: z7.object({
    status: z7.enum(["valid", "invalid"]),
    score: z7.number(),
    date: z7.string(),
    notes: z7.string()
  }),
  specialInstructions: z7.string().optional(),
  orderDate: z7.string()
});
pdfRouter.post("/generate", async (req, res) => {
  try {
    const data = generatePdfSchema.parse(req.body);
    const order = {
      id: parseInt(data.orderNumber.replace(/\D/g, "")),
      orderNumber: data.orderNumber,
      createdAt: /* @__PURE__ */ new Date(),
      patientName: data.patient.name,
      patientDob: data.patient.dob,
      patientMrn: data.patient.mrn,
      patientGender: data.patient.gender,
      priority: data.exam.isStat ? "stat" : "routine",
      modality: data.exam.modality,
      bodyPart: data.exam.bodyPart,
      contrast: data.exam.contrastType.toLowerCase().includes("with") ? "with" : data.exam.contrastType.toLowerCase().includes("without and with") ? "both" : "without",
      clinicalIndication: data.clinicalIndication,
      complianceScore: data.validation.score,
      validationNotes: data.validation.notes,
      validatedAt: /* @__PURE__ */ new Date(),
      insuranceProvider: data.insurance.provider,
      insurancePolicyNumber: data.insurance.policyNumber,
      insuranceAuthNumber: data.insurance.authorizationNumber,
      specialInstructions: data.specialInstructions || ""
    };
    const referringPhysician = {
      firstName: data.referringPhysician.name?.split(" ")[0] || "",
      lastName: data.referringPhysician.name?.split(" ").slice(1).join(" ") || "",
      npi: data.referringPhysician.npi,
      specialty: data.referringPhysician.specialty,
      phoneNumber: data.referringPhysician.phone
    };
    const referringOrganization = {
      name: data.referringPhysician.organization || "Medical Group"
    };
    const pdfBuffer = await orderPdfService.generateOrderPdf(
      order,
      data.diagnosisCodes,
      data.procedureCodes,
      referringPhysician,
      referringOrganization,
      {
        format: "Letter",
        orientation: "portrait"
      }
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=radiology-order.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});
var pdf_default = pdfRouter;

// server/routes/medical-codes.ts
init_db_medical_codes_service();
import { Router as Router4 } from "express";
var router5 = Router4();
router5.get("/cpt/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const cptCode = await getCptCode(code);
    if (!cptCode) {
      return res.status(404).json({ error: "CPT code not found" });
    }
    res.json(cptCode);
  } catch (error) {
    console.error("Error fetching CPT code:", error);
    res.status(500).json({ error: "Failed to fetch CPT code" });
  }
});
router5.get("/cpt/modality/:modality", async (req, res) => {
  try {
    const modality = req.params.modality;
    const cptCodes = await getCptCodesByModality(modality);
    res.json(cptCodes);
  } catch (error) {
    console.error("Error fetching CPT codes by modality:", error);
    res.status(500).json({ error: "Failed to fetch CPT codes by modality" });
  }
});
router5.get("/icd10/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const icd10Code = await getIcd10Code(code);
    if (!icd10Code) {
      return res.status(404).json({ error: "ICD10 code not found" });
    }
    res.json(icd10Code);
  } catch (error) {
    console.error("Error fetching ICD10 code:", error);
    res.status(500).json({ error: "Failed to fetch ICD10 code" });
  }
});
router5.get("/icd10/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const icd10Codes = await getIcd10CodesByCategory(category);
    res.json(icd10Codes);
  } catch (error) {
    console.error("Error fetching ICD10 codes by category:", error);
    res.status(500).json({ error: "Failed to fetch ICD10 codes by category" });
  }
});
router5.get("/mapping/:icd10Code/:cptCode", async (req, res) => {
  try {
    const { icd10Code, cptCode } = req.params;
    const mapping = await getMapping(icd10Code, cptCode);
    if (!mapping) {
      return res.status(404).json({ error: "Mapping not found" });
    }
    res.json(mapping);
  } catch (error) {
    console.error("Error fetching mapping:", error);
    res.status(500).json({ error: "Failed to fetch mapping" });
  }
});
router5.get("/mappings/icd10/:icd10Code", async (req, res) => {
  try {
    const { icd10Code } = req.params;
    const mappings = await getAllMappingsForIcd10(icd10Code);
    res.json(mappings);
  } catch (error) {
    console.error("Error fetching mappings for ICD10:", error);
    res.status(500).json({ error: "Failed to fetch mappings for ICD10" });
  }
});
router5.get("/mappings/appropriateness/:level", async (req, res) => {
  try {
    const level = parseInt(req.params.level, 10);
    if (isNaN(level) || level < 1 || level > 10) {
      return res.status(400).json({ error: "Invalid appropriateness level. Must be a number between 1 and 10." });
    }
    const mappings = await getMappingsByAppropriateness(level);
    res.json(mappings);
  } catch (error) {
    console.error("Error fetching mappings by appropriateness:", error);
    res.status(500).json({ error: "Failed to fetch mappings by appropriateness" });
  }
});
router5.get("/markdown/:icd10Code", async (req, res) => {
  try {
    const { icd10Code } = req.params;
    const markdown = await getMarkdownDoc(icd10Code);
    if (!markdown) {
      return res.status(404).json({ error: "Markdown documentation not found" });
    }
    res.json(markdown);
  } catch (error) {
    console.error("Error fetching markdown documentation:", error);
    res.status(500).json({ error: "Failed to fetch markdown documentation" });
  }
});
router5.get("/search/cpt", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const results = await searchCptCodes(query);
    res.json(results);
  } catch (error) {
    console.error("Error searching CPT codes:", error);
    res.status(500).json({ error: "Failed to search CPT codes" });
  }
});
router5.get("/search/icd10", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const results = await searchIcd10Codes(query);
    res.json(results);
  } catch (error) {
    console.error("Error searching ICD10 codes:", error);
    res.status(500).json({ error: "Failed to search ICD10 codes" });
  }
});
var medical_codes_default = router5;

// server/routes.ts
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  console.log("\u{1F680} Starting server...");
  app2.get("/token", (req, res) => {
    res.status(200).json({ message: "Token endpoint is accessible via HTTP" });
  });
  app2.get("/pdf-test", (req, res) => {
    res.sendFile("test-pdf-generation.html", { root: "." });
  });
  app2.use("/api/auth", auth_default);
  app2.use("/api/invitations", invitations_default);
  app2.use("/api/users", users_default);
  app2.use("/api/organizations", organizations_default);
  app2.use("/api/pdf", pdf_default);
  app2.use("/api/medical-codes", medical_codes_default);
  app2.get("/api/patients", authenticateJWT, async (req, res) => {
    try {
      const patients2 = await storage.listPatients();
      res.json(patients2);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });
  app2.get("/api/patients/:id", authenticateJWT, async (req, res) => {
    try {
      const patient = await storage.getPatient(Number(req.params.id));
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });
  app2.get("/api/patients/:id/clinical-history", authenticateJWT, async (req, res) => {
    try {
      const patientId = Number(req.params.id);
      const type = req.query.type;
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      const history = await storage.getClinicalHistoryByPatient(patientId, type);
      await createAuditLog(req, "view", "clinical-history", String(patientId), {
        type: type || "all"
      });
      res.json(history);
    } catch (error) {
      console.error("Error fetching clinical history:", error);
      res.status(500).json({ error: "Failed to fetch clinical history" });
    }
  });
  app2.get("/api/orders/pending-patient-info", authenticateJWT, async (req, res) => {
    try {
      const user = req.user;
      let organizationId;
      if (user.organizationId) {
        organizationId = user.organizationId;
      }
      if (!["admin", "medical_assistant"].includes(user.role)) {
        return res.status(403).json({ error: "Not authorized to view pending patient info orders" });
      }
      const { orders: pendingOrders } = await storage.getOrdersByFilters({
        status: "pending_patient_info",
        ...organizationId ? { referringOrganizationId: organizationId } : {}
      });
      const ordersWithCodes = pendingOrders.map((order) => {
        const diagnosisCodes2 = order.icd10Codes ? order.icd10Codes.split(",").map((code) => ({
          code: code.trim(),
          description: ""
          // We don't have descriptions in this simplified model
        })) : [];
        const procedureCodes2 = order.cptCode ? [{ code: order.cptCode, description: "" }] : [];
        return {
          ...order,
          diagnosisCodes: diagnosisCodes2,
          procedureCodes: procedureCodes2
        };
      });
      res.json(ordersWithCodes);
    } catch (error) {
      console.error("Error fetching pending patient info orders:", error);
      res.status(500).json({ error: "Failed to fetch pending patient info orders" });
    }
  });
  app2.get("/api/orders", authenticateJWT, async (req, res) => {
    try {
      const user = req.user;
      const limit = req.query.limit ? Number(req.query.limit) : void 0;
      let orders2;
      if (user.organizationId) {
        const org = await storage.getOrganizationById(user.organizationId);
        if (org && org.type === "radiology_group") {
          const { orders: allOrders } = await storage.getOrdersByFilters({
            radiologyOrganizationId: user.organizationId
          });
          orders2 = allOrders.filter((order) => order.status !== "pending_patient_info");
        } else {
          const { orders: orgOrders } = await storage.getOrdersByFilters({
            referringOrganizationId: user.organizationId
          });
          orders2 = orgOrders;
        }
      } else {
        orders2 = await storage.listOrders(limit);
      }
      const ordersWithCodes = orders2.map((order) => {
        const diagnosisCodes2 = order.icd10Codes ? order.icd10Codes.split(",").map((code) => ({
          code: code.trim(),
          description: ""
          // We don't have descriptions in this simplified model
        })) : [];
        const procedureCodes2 = order.cptCode ? [{ code: order.cptCode, description: "" }] : [];
        return {
          ...order,
          diagnosisCodes: diagnosisCodes2,
          procedureCodes: procedureCodes2
        };
      });
      res.json(ordersWithCodes);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/:id", authenticateJWT, async (req, res) => {
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const user = req.user;
      if (order.status === "pending_patient_info" && user.organizationId) {
        const org = await storage.getOrganizationById(user.organizationId);
        if (org && org.type === "radiology_group") {
          return res.status(403).json({
            error: "Access denied",
            message: "This order is pending patient information completion by the referring practice"
          });
        }
      }
      const medicalCodesService = await Promise.resolve().then(() => (init_db_medical_codes_service(), db_medical_codes_service_exports));
      const diagnosisCodes2 = [];
      if (order.icd10Codes) {
        const icd10Codes = order.icd10Codes.split(",").map((code) => code.trim());
        for (const code of icd10Codes) {
          if (!code) continue;
          const codeData = await medicalCodesService.getIcd10Code(code);
          diagnosisCodes2.push({
            code,
            description: codeData?.description || ""
          });
        }
      }
      let procedureCodes2 = [];
      if (order.cptCode) {
        const cptData = await medicalCodesService.getCptCode(order.cptCode);
        procedureCodes2 = [{
          code: order.cptCode,
          description: cptData?.description || ""
        }];
      }
      const patientData = order.patient ? {
        id: order.patient.id,
        name: order.patientName || `${order.patient.firstName} ${order.patient.lastName}`,
        dob: order.patientDob || order.patient.dateOfBirth || "",
        gender: order.patientGender || order.patient.gender || "unknown",
        email: order.patient.email || "",
        phone: order.patient.phoneNumber || "",
        address: order.patient.addressLine1 ? `${order.patient.addressLine1}, ${order.patient.city || ""}, ${order.patient.state || ""} ${order.patient.zipCode || ""}` : "",
        pidn: order.patient.pidn || "",
        mrn: order.patientMrn || order.patient.mrn || "",
        insurance: order.insuranceProvider || ""
      } : {
        id: order.patientId,
        name: order.patientName || "Unknown",
        dob: order.patientDob || "Unknown",
        gender: order.patientGender || "unknown",
        email: "",
        phone: "",
        address: "",
        pidn: "",
        mrn: order.patientMrn || "",
        insurance: order.insuranceProvider || ""
      };
      const referringOrganization = order.referringOrganization ? {
        id: order.referringOrganization.id,
        name: order.referringOrganization.name || `Organization #${order.referringOrganizationId}`,
        type: order.referringOrganization.type || "referring_practice",
        phone: order.referringOrganization.phoneNumber || "",
        address: order.referringOrganization.addressLine1 || ""
      } : {
        id: order.referringOrganizationId,
        name: `Organization #${order.referringOrganizationId}`,
        type: "referring_practice",
        phone: "",
        address: ""
      };
      const referringPhysician = order.referringPhysician ? {
        id: order.referringPhysician.id,
        name: `${order.referringPhysician.firstName || "Dr."} ${order.referringPhysician.lastName || ""}`,
        npi: order.referringPhysician.npi || "",
        phone: order.referringPhysician.phoneNumber || "",
        organization: referringOrganization.name
      } : {
        id: order.signedByUserId || 0,
        name: "Unknown",
        npi: "",
        phone: "",
        organization: referringOrganization.name
      };
      await createAuditLog(req, "view", "order", String(order.id));
      res.json({
        ...order,
        diagnosisCodes: diagnosisCodes2,
        procedureCodes: procedureCodes2,
        patientData,
        referringPhysician,
        referringOrganization
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  app2.post("/api/orders/process-dictation", authenticateJWT, async (req, res) => {
    try {
      const schema = z8.object({
        dictationText: z8.string().min(20),
        patientId: z8.number(),
        specialty: z8.string().optional(),
        // Optional - can override physician's specialty
        patientAge: z8.number().optional(),
        patientGender: z8.string().optional(),
        useEnhancedValidation: z8.boolean().optional()
        // Optional - use database-enhanced validation
      });
      const validatedData = schema.parse(req.body);
      const user = req.user;
      let physicianSpecialty = "General Radiology";
      if (user && user.specialtyId) {
        try {
          const specialty = await storage.getSpecialty(user.specialtyId);
          if (specialty) {
            physicianSpecialty = specialty.name;
            console.log(`Using physician's specialty from profile: ${physicianSpecialty}`);
          }
        } catch (err) {
          console.error("Error fetching physician specialty:", err);
        }
      }
      const selectedSpecialty = validatedData.specialty || physicianSpecialty;
      const strippedText = stripPHI(validatedData.dictationText);
      const useEnhanced = validatedData.useEnhancedValidation === true;
      console.log(`Using ${useEnhanced ? "enhanced" : "standard"} validation`);
      const processingResult = useEnhanced ? await processEnhancedDictation(
        strippedText,
        selectedSpecialty,
        validatedData.patientAge,
        validatedData.patientGender
      ) : await processDictation(
        strippedText,
        selectedSpecialty,
        validatedData.patientAge,
        validatedData.patientGender
      );
      const usedSpecialty = selectedSpecialty;
      await createAuditLog(req, "process", "dictation", String(validatedData.patientId), {
        originalLength: validatedData.dictationText.length,
        strippedLength: strippedText.length,
        specialty: usedSpecialty,
        fromProfile: !validatedData.specialty,
        validationMethod: useEnhanced ? "enhanced" : "standard"
      });
      res.json({
        success: true,
        result: processingResult,
        validationMethod: useEnhanced ? "enhanced" : "standard"
      });
    } catch (error) {
      console.error("Error processing dictation:", error);
      if (error instanceof z8.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process dictation" });
    }
  });
  app2.post("/api/test/database-context", async (req, res) => {
    try {
      const schema = z8.object({
        dictationText: z8.string().min(10)
      });
      const validatedData = schema.parse(req.body);
      const result = await testDatabaseContext({
        id: "api-test",
        description: "API test case",
        dictation: validatedData.dictationText
      });
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error("Error testing database context:", error);
      if (error instanceof z8.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to test database context" });
    }
  });
  app2.post("/api/test/enhanced-validation", async (req, res) => {
    try {
      const schema = z8.object({
        dictationText: z8.string().min(10),
        specialty: z8.string().optional(),
        patientAge: z8.number().optional(),
        patientGender: z8.string().optional()
      });
      const validatedData = schema.parse(req.body);
      const strippedText = stripPHI(validatedData.dictationText);
      const processingResult = await processEnhancedDictation(
        strippedText,
        validatedData.specialty || "General Radiology",
        validatedData.patientAge,
        validatedData.patientGender
      );
      res.json({
        success: true,
        result: processingResult,
        validationMethod: "enhanced"
      });
    } catch (error) {
      console.error("Error testing enhanced validation:", error);
      if (error instanceof z8.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to test enhanced validation" });
    }
  });
  app2.post("/api/orders", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      const orderData = insertOrderSchema.parse(req.body.order);
      let patientId = orderData.patientId;
      if (patientId === 0 && req.body.patientName && req.body.patientDob) {
        const nameParts = req.body.patientName.split(" ");
        const firstName = nameParts[0] || "Unknown";
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Patient";
        const timestamp3 = Date.now().toString().slice(-8);
        const randomDigits = Math.floor(1e4 + Math.random() * 9e4);
        const pidn = `${timestamp3}${randomDigits}`;
        const newPatient = await storage.createPatient({
          organizationId: user.organizationId,
          firstName,
          lastName,
          dateOfBirth: req.body.patientDob,
          gender: "unknown",
          // Default gender until more info is collected
          pidn
          // Our internal Patient ID Number
        });
        patientId = newPatient.id;
      }
      const patient = await storage.getPatient(patientId);
      const medicalCodesService = await Promise.resolve().then(() => (init_medical_codes_service(), medical_codes_service_exports));
      let icd10CodeDescriptions = {};
      if (orderData.icd10Codes) {
        try {
          let icd10Codes = [];
          if (typeof orderData.icd10Codes === "string") {
            icd10Codes = orderData.icd10Codes.split(",").map((code) => code.trim());
          } else if (Array.isArray(orderData.icd10Codes)) {
            icd10Codes = orderData.icd10Codes;
          } else if (typeof orderData.icd10Codes === "object") {
            icd10Codes = JSON.parse(orderData.icd10Codes);
          }
          for (const code of icd10Codes) {
            if (!code) continue;
            const codeValue = code.trim();
            const icd10Data = await medicalCodesService.getIcd10Code(codeValue);
            if (icd10Data && icd10Data.description) {
              icd10CodeDescriptions[codeValue] = icd10Data.description;
              console.log(`Found ICD10 description for ${codeValue}: ${icd10Data.description}`);
            }
          }
          console.log("Final ICD10 descriptions:", icd10CodeDescriptions);
        } catch (err) {
          console.error("Error fetching ICD-10 code descriptions:", err);
        }
      }
      let cptCodeDescription = void 0;
      if (orderData.cptCode) {
        try {
          const cptData = await medicalCodesService.getCptCode(orderData.cptCode);
          if (cptData) {
            cptCodeDescription = cptData.description;
            console.log(`Found CPT description: ${cptCodeDescription}`);
          }
        } catch (err) {
          console.error("Error fetching CPT code description:", err);
        }
      }
      let referringOrganizationId = orderData.referringOrganizationId;
      let radiologyOrganizationId = orderData.radiologyOrganizationId;
      if (req.user.organizationId === 22) {
        referringOrganizationId = 22;
        radiologyOrganizationId = 21;
        console.log("\u2705 Forcing order routing: Birmingham Orthopedics -> Birmingham Physicians' Imaging");
      }
      if (referringOrganizationId === 21) {
        referringOrganizationId = 22;
        radiologyOrganizationId = 21;
        console.log("\u{1F6E0}\uFE0F Correcting invalid organization routing");
      }
      const newOrder = await storage.createOrder({
        ...orderData,
        radiologyOrganizationId,
        // Set the correct radiology organization
        patientId,
        // Use the correct patient ID (either existing or newly created)
        patientPidn: patient?.pidn,
        // Include PIDN from the patient record
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : void 0,
        // Include full name
        patientDob: patient?.dateOfBirth,
        // Include date of birth
        // Use snake_case for database field names as defined in the database schema
        icd10_code_descriptions: Object.entries(icd10CodeDescriptions).map(([code, desc3]) => `${code}: ${desc3}`).join(", "),
        // Format as "code: description" 
        cpt_code_description: cptCodeDescription
        // Include CPT code description
      });
      if (req.body.diagnosisCodes && Array.isArray(req.body.diagnosisCodes)) {
        for (const code of req.body.diagnosisCodes) {
          const validCode = z8.object({
            code: z8.string(),
            description: z8.string(),
            orderId: z8.number()
          }).parse({
            ...code,
            orderId: newOrder.id
          });
          const currentCodes = newOrder.icd10Codes || "";
          const updatedCodes = currentCodes ? `${currentCodes},${validCode.code}` : validCode.code;
          await storage.updateOrder(newOrder.id, {
            icd10Codes: updatedCodes,
            updatedByUserId: req.user.id
          });
        }
      }
      if (req.body.procedureCodes && Array.isArray(req.body.procedureCodes)) {
        for (const code of req.body.procedureCodes) {
          const validCode = z8.object({
            code: z8.string(),
            description: z8.string(),
            orderId: z8.number()
          }).parse({
            ...code,
            orderId: newOrder.id
          });
          await storage.updateOrder(newOrder.id, {
            cptCode: validCode.code,
            updatedByUserId: req.user.id
          });
        }
      }
      await createAuditLog(req, "create", "order", String(newOrder.id), {
        patientId: orderData.patientId
      });
      const diagnosisCodes2 = newOrder.icd10Codes ? newOrder.icd10Codes.split(",").map((code) => ({
        code: code.trim(),
        description: ""
        // We don't have descriptions in this simplified model
      })) : [];
      const procedureCodes2 = newOrder.cptCode ? [{ code: newOrder.cptCode, description: "" }] : [];
      res.status(201).json({
        success: true,
        order: {
          ...newOrder,
          diagnosisCodes: diagnosisCodes2,
          procedureCodes: procedureCodes2
        }
      });
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z8.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  app2.patch("/api/orders/:id", authenticateJWT, async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.physicianId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to update this order" });
      }
      const medicalCodesService = await Promise.resolve().then(() => (init_medical_codes_service(), medical_codes_service_exports));
      let updatedData = { ...req.body };
      if (req.body.icd10Codes && req.body.icd10Codes !== order.icd10Codes) {
        let icd10CodeDescriptions = {};
        try {
          const icd10Codes = req.body.icd10Codes.split(",").map((code) => code.trim());
          for (const code of icd10Codes) {
            if (!code) continue;
            const codeValue = code.trim();
            const icd10Data = await medicalCodesService.getIcd10Code(codeValue);
            if (icd10Data && icd10Data.description) {
              icd10CodeDescriptions[codeValue] = icd10Data.description;
              console.log(`Found ICD10 description for ${codeValue}: ${icd10Data.description}`);
            }
          }
          updatedData.icd10_code_descriptions = Object.entries(icd10CodeDescriptions).map(([code, desc3]) => `${code}: ${desc3}`).join(", ");
        } catch (err) {
          console.error("Error fetching ICD-10 code descriptions:", err);
        }
      }
      if (req.body.cptCode && req.body.cptCode !== order.cptCode) {
        try {
          const cptData = await medicalCodesService.getCptCode(req.body.cptCode);
          if (cptData && cptData.description) {
            updatedData.cpt_code_description = cptData.description;
            console.log(`Found CPT description: ${cptData.description}`);
          }
        } catch (err) {
          console.error("Error fetching CPT code description:", err);
        }
      }
      const userId = req.user.id;
      updatedData.updatedByUserId = userId;
      const updatedOrder = await storage.updateOrder(orderId, updatedData);
      await createAuditLog(req, "update", "order", String(orderId), {
        changes: Object.keys(updatedData)
      });
      let diagnosisCodes2 = [];
      if (updatedOrder?.icd10Codes) {
        const icd10Codes = updatedOrder.icd10Codes.split(",").map((code) => code.trim());
        diagnosisCodes2 = await Promise.all(icd10Codes.map(async (code) => {
          const codeData = await medicalCodesService.getIcd10Code(code);
          return {
            code,
            description: codeData?.description || ""
          };
        }));
      }
      let procedureCodes2 = [];
      if (updatedOrder?.cptCode) {
        const cptData = await medicalCodesService.getCptCode(updatedOrder.cptCode);
        procedureCodes2 = [{
          code: updatedOrder.cptCode,
          description: cptData?.description || ""
        }];
      }
      res.json({
        success: true,
        order: {
          ...updatedOrder || {},
          diagnosisCodes: diagnosisCodes2,
          procedureCodes: procedureCodes2
        }
      });
    } catch (error) {
      console.error("Error updating order:", error);
      if (error instanceof z8.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update order" });
    }
  });
  app2.post("/api/orders/:id/sign", authenticateJWT, async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const userId = req.user.id;
      if (order.physicianId !== userId && order.createdByUserId !== userId) {
        return res.status(403).json({ error: "Not authorized to sign this order" });
      }
      if (order.validationStatus !== "valid") {
        return res.status(400).json({ error: "Order must be validated before signing" });
      }
      const patient = await storage.getPatient(order.patientId);
      const isTemporaryPatient = !patient || !patient.address_line1 || !patient.city || !patient.state || !patient.zip_code || !patient.phone_number;
      const updates = {
        status: isTemporaryPatient ? "pending_patient_info" : "complete",
        signedByUserId: userId,
        updatedByUserId: userId
        // Add user ID for history tracking
      };
      updates.signatureDate = /* @__PURE__ */ new Date();
      if (req.user.organizationId === 22) {
        updates.referringOrganizationId = 22;
        updates.radiologyOrganizationId = 21;
        console.log("\u2705 Sign endpoint - Forcing order routing: Birmingham Orthopedics -> Birmingham Physicians' Imaging");
      }
      if (order.referringOrganizationId === 21) {
        updates.referringOrganizationId = 22;
        updates.radiologyOrganizationId = 21;
        console.log("\u{1F6E0}\uFE0F Sign endpoint - Correcting invalid organization routing");
      }
      console.log(`Setting order status to ${updates.status} based on patient info completeness`);
      const updatedOrder = await storage.updateOrder(orderId, updates);
      await createAuditLog(req, "sign", "order", String(orderId));
      res.json({
        success: true,
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error signing order:", error);
      res.status(500).json({ error: "Failed to sign order" });
    }
  });
  app2.post("/api/orders/:id/complete-patient-info", authenticateJWT, async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.status !== "pending_patient_info") {
        return res.status(400).json({
          error: "Invalid order status",
          message: "This endpoint can only be used for orders with pending_patient_info status"
        });
      }
      const user = req.user;
      if (!["admin", "medical_assistant"].includes(user.role)) {
        return res.status(403).json({ error: "Not authorized to complete patient information" });
      }
      const patientDataSchema = z8.object({
        fullName: z8.string().min(1),
        dateOfBirth: z8.string().min(1),
        gender: z8.string().optional(),
        mrn: z8.string().min(1),
        phoneNumber: z8.string().optional(),
        email: z8.union([z8.string().email(), z8.string().max(0)]).optional(),
        // Allow valid email or empty string
        address: z8.string().optional(),
        insuranceProvider: z8.string().optional(),
        insurancePolicyNumber: z8.string().optional(),
        insuranceGroupNumber: z8.string().optional(),
        notes: z8.string().optional(),
        pidn: z8.string().optional()
        // Preserve the PIDN if provided
      });
      const validatedData = patientDataSchema.parse(req.body);
      const patient = await storage.getPatient(order.patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      const nameParts = validatedData.fullName.split(" ");
      const firstName = nameParts[0] || patient.firstName;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : patient.lastName;
      await storage.updatePatient(patient.id, {
        firstName,
        lastName,
        dateOfBirth: validatedData.dateOfBirth,
        gender: validatedData.gender || patient.gender,
        mrn: validatedData.mrn,
        // External MRN
        pidn: validatedData.pidn || patient.pidn,
        // Preserve the PIDN
        phoneNumber: validatedData.phoneNumber || patient.phoneNumber,
        email: validatedData.email || patient.email
      });
      const updateData = {
        status: "complete",
        insuranceProvider: validatedData.insuranceProvider,
        insurancePolicyNumber: validatedData.insurancePolicyNumber,
        insuranceGroupNumber: validatedData.insuranceGroupNumber,
        updatedByUserId: user.id
      };
      if (req.user.organizationId === 22) {
        updateData.referringOrganizationId = 22;
        updateData.radiologyOrganizationId = 21;
        console.log("\u2705 Complete patient info - Forcing order routing: Birmingham Orthopedics -> Birmingham Physicians' Imaging");
      }
      if (order.referringOrganizationId === 21) {
        updateData.referringOrganizationId = 22;
        updateData.radiologyOrganizationId = 21;
        console.log("\u{1F6E0}\uFE0F Complete patient info - Correcting invalid organization routing");
      }
      if (order.referringOrganizationId === 22) {
        updateData.radiologyOrganizationId = 21;
        console.log("\u{1F4CB} Complete patient info - Setting Birmingham Physicians' Imaging as radiology org");
      }
      await storage.updateOrder(orderId, updateData);
      if (validatedData.notes) {
        try {
          await storage.createOrderNote({
            orderId,
            userId: user.id,
            note: `Patient information completed. Notes: ${validatedData.notes}`
          });
          console.log("\u2705 Successfully added order note with simplified schema");
        } catch (noteError) {
          console.error("Warning: Failed to add order note, but continuing with order completion", noteError);
        }
      }
      await createAuditLog(req, "update", "patient_information", String(orderId), {
        completedBy: user.id,
        patientId: patient.id
      });
      const updatedOrder = await storage.getOrder(orderId);
      res.json({
        success: true,
        message: "Patient information completed successfully",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error completing patient information:", error);
      if (error instanceof z8.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to complete patient information" });
    }
  });
  app2.get("/api/analytics/compliance-by-specialty", authenticateJWT, adminOnly, async (req, res) => {
    try {
      const data = await storage.getComplianceBySpecialty();
      res.json(data);
    } catch (error) {
      console.error("Error fetching specialty compliance:", error);
      res.status(500).json({ error: "Failed to fetch specialty compliance data" });
    }
  });
  app2.get("/api/analytics/order-statistics", authenticateJWT, async (req, res) => {
    try {
      const stats = await storage.getOrderStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching order statistics:", error);
      res.status(500).json({ error: "Failed to fetch order statistics" });
    }
  });
  app2.get("/api/alerts", authenticateJWT, adminOnly, async (req, res) => {
    try {
      const alerts = await storage.listActiveAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });
  app2.patch("/api/alerts/:id", authenticateJWT, adminOnly, async (req, res) => {
    try {
      const alertId = Number(req.params.id);
      const { status } = req.body;
      if (status !== "resolved" && status !== "active") {
        return res.status(400).json({ error: "Status must be 'resolved' or 'active'" });
      }
      const userId = req.user.id;
      const updatedAlert = await storage.updateAlertStatus(alertId, status, status === "resolved" ? userId : void 0);
      await createAuditLog(req, "update", "alert", String(alertId), {
        status
      });
      res.json({
        success: true,
        alert: updatedAlert
      });
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  });
  async function createAuditLog(req, action, resourceType, resourceId, details = {}) {
    if (!req.user) return;
    const userId = req.user.id;
    return storage.createAuditLog({
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    });
  }
  return httpServer;
}

// server/vite.ts
import express3 from "express";
import fs3 from "fs";
import path5, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path4, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var apiServerUrl = process.env.API_SERVER_URL || "http://localhost:5001";
var vite_config_default = defineConfig({
  // Define environment variables to be exposed to the client
  define: {
    "import.meta.env.VITE_API_SERVER_URL": JSON.stringify(apiServerUrl)
  },
  plugins: [
    react(),
    tsconfigPaths(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path4.resolve(__dirname, "client", "src"),
      "@shared": path4.resolve(__dirname, "shared")
    }
  },
  root: path4.resolve(__dirname, "client"),
  build: {
    outDir: path4.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  // Add server configuration with proxy
  server: {
    port: 5001,
    proxy: {
      // Proxy all /api requests to the actual API server
      "/api": {
        target: "https://api.radorderpad.com",
        changeOrigin: true,
        secure: true,
        headers: {
          Connection: "keep-alive"
        },
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
            console.log("Request Headers:", req.headers);
            if (req.headers.authorization) {
              proxyReq.setHeader("Authorization", req.headers.authorization);
              console.log("Setting Authorization header:", req.headers.authorization);
            }
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
            console.log("Response Headers:", proxyRes.headers);
          });
        }
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path5.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
var app = express4();
app.use(express4.json());
app.use(express4.urlencoded({ extended: false }));
var protectedDirs = ["/DB/", "/DO NOT DEPLOY/", "/attached_assets/"];
app.use((req, res, next) => {
  const reqPath = req.path.toLowerCase();
  for (const dir of protectedDirs) {
    if (reqPath.includes(dir.toLowerCase())) {
      return res.status(403).json({ error: "Access forbidden" });
    }
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  console.log("Forcing development mode for Vite middleware");
  if (true) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
