import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * BNI BNWG 會員資訊表
 * 儲存會員提交的完整資訊
 */
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  // 基本資訊
  englishName: varchar("englishName", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  chapter: varchar("chapter", { length: 255 }).notNull(), // 所屬分會
  profession: varchar("profession", { length: 255 }).notNull(), // 專業領域
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  
  // 會員資歷
  yearsOfMembership: int("yearsOfMembership").notNull(), // 入會年資 (1-25)
  isGoldMember: mysqlEnum("isGoldMember", ["yes", "no"]).notNull(), // 金章會員
  
  // 婚宴服務資訊
  weddingCategory: text("weddingCategory"), // AI 建議的婚宴分類（JSON 陣列）
  weddingServices: text("weddingServices").notNull(), // 婚宴服務描述
  serviceArea: varchar("serviceArea", { length: 500 }), // 服務區域
  pastCasesCount: int("pastCasesCount"), // 過往婚宴案例數量
  uniqueAdvantage: text("uniqueAdvantage"), // 特色服務/差異化優勢
  
  // 社交媒體與網站
  facebookLink: varchar("facebookLink", { length: 500 }),
  instagramLink: varchar("instagramLink", { length: 500 }),
  websiteLink: varchar("websiteLink", { length: 500 }),
  
  // 折扣與介紹人
  bniMemberDiscount: varchar("bniMemberDiscount", { length: 500 }), // BNI 會員折扣
  referrer: varchar("referrer", { length: 255 }), // 介紹人
  
  // 系統欄位
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

/**
 * 會員上傳檔案元數據表
 * 儲存綠燈證明文件的 S3 參考資訊
 */
export const memberFiles = mysqlTable("memberFiles", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(), // 關聯到 members 表
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 file key
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(), // S3 public URL
  fileName: varchar("fileName", { length: 255 }).notNull(), // 原始檔案名稱
  fileSize: int("fileSize"), // 檔案大小（bytes）
  mimeType: varchar("mimeType", { length: 100 }), // 檔案類型
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type MemberFile = typeof memberFiles.$inferSelect;
export type InsertMemberFile = typeof memberFiles.$inferInsert;