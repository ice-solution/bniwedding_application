import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// AI 分類功能已移除，改為下拉選單

describe("members.list", () => {
  it("should allow admin to list members", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.members.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject non-admin users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.members.list()).rejects.toThrow("Please login");
  });
});

describe("members.updateStatus", () => {
  it("should allow admin to update member status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 假設資料庫中存在 ID 為 1 的會員
    // 這個測試可能需要先建立測試資料
    const result = await caller.members.updateStatus({
      id: 1,
      status: "approved",
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
  });

  it("should reject non-admin users from updating status", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.members.updateStatus({
        id: 1,
        status: "approved",
      })
    ).rejects.toThrow("Please login");
  });
});

describe("members.submit", () => {
  it("should validate required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.members.submit({
        englishName: "",
        companyName: undefined,
        chapter: "",
        profession: "",
        phone: "",
        email: "invalid-email",
        yearsOfMembership: 0,
        isGoldMember: "yes",
        weddingServices: "short",
        fileKey: "test-key",
        fileUrl: "test-url",
        fileName: "test.pdf",
        fileSize: 1000,
        mimeType: "application/pdf",
      })
    ).rejects.toThrow();
  });

  it("should accept valid member submission with 3 files", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.members.submit({
      englishName: "John Doe",
      companyName: "Test Company",
      chapter: "Hong Kong Chapter",
      profession: "Wedding Photography",
      phone: "+852 1234 5678",
      email: "john@example.com",
      yearsOfMembership: 5,
      isGoldMember: "yes",
      weddingCategory: "攝影",
      weddingServices: "Professional wedding photography services with 10 years of experience.",
      serviceArea: "Hong Kong, Kowloon",
      pastCasesCount: 100,
      uniqueAdvantage: "Unique artistic style",
      facebookLink: "https://facebook.com/test",
      instagramLink: "https://instagram.com/test",
      websiteLink: "https://example.com",
      bniMemberDiscount: "10% off",
      referrer: "Jane Smith",
      files: [
        {
          fileKey: "test-file-key-1",
          fileUrl: "https://example.com/file1.pdf",
          fileName: "green-light-month1.pdf",
          fileSize: 1024000,
          mimeType: "application/pdf",
        },
        {
          fileKey: "test-file-key-2",
          fileUrl: "https://example.com/file2.pdf",
          fileName: "green-light-month2.pdf",
          fileSize: 1024000,
          mimeType: "application/pdf",
        },
        {
          fileKey: "test-file-key-3",
          fileUrl: "https://example.com/file3.pdf",
          fileName: "green-light-month3.pdf",
          fileSize: 1024000,
          mimeType: "application/pdf",
        },
      ],
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
    expect(result).toHaveProperty("memberId");
    expect(typeof result.memberId).toBe("number");
  });
});
