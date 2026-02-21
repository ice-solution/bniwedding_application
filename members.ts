import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createMember, createMemberFile, getAllMembers, getMemberById, getMemberFiles, updateMemberStatus } from "../db";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

export const membersRouter = router({
  /**
   * AI 智能分類分析
   * 根據婚宴服務描述，使用 LLM 分析並建議適合的分類
   */
  analyzeCategory: publicProcedure
    .input(z.object({
      description: z.string().min(10),
    }))
    .query(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "你是一位專業的婚宴服務分類專家。根據用戶提供的服務描述，分析並建議最適合的婚宴服務分類。可選分類包括：場地、攝影、錄影、化妝、婚紗禮服、餐飲、婚禮統籌、花藝佈置、婚禮音樂、婚禮主持、婚禮蛋糕、婚禮邀請卡、婚禮小物、婚車租賃、蜜月旅遊、婚戒珠寶、其他。請返回 1-3 個最相關的分類。",
          },
          {
            role: "user",
            content: `請分析以下婚宴服務描述，並建議適合的分類：\n\n${input.description}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "wedding_category_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: { type: "string" },
                  description: "建議的婚宴服務分類列表（1-3個）",
                },
                reasoning: {
                  type: "string",
                  description: "分類建議的理由",
                },
              },
              required: ["categories", "reasoning"],
              additionalProperties: false,
            },
          },
        },
      });

      const messageContent = response.choices[0]?.message.content;
      const contentStr = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
      const result = JSON.parse(contentStr || "{}");
      return {
        categories: result.categories || [],
        reasoning: result.reasoning || "",
      };
    }),

  /**
   * 提交會員資訊
   * 包含檔案上傳與資料儲存
   */
  submit: publicProcedure
    .input(z.object({
      englishName: z.string().min(1),
      companyName: z.string().optional(),
      chapter: z.string().min(1),
      profession: z.string().min(1),
      phone: z.string(),
      email: z.string().email(),
      yearsOfMembership: z.number().min(1).max(25),
      isGoldMember: z.enum(["yes", "no"]),
      weddingCategory: z.string().min(1),
      weddingServices: z.string().min(10),
      serviceArea: z.string().optional(),
      pastCasesCount: z.number().optional(),
      uniqueAdvantage: z.string().optional(),
      facebookLink: z.string().optional(),
      instagramLink: z.string().optional(),
      websiteLink: z.string().optional(),
      bniMemberDiscount: z.string().optional(),
      referrer: z.string().optional(),
      // 多檔案資訊
      files: z.array(z.object({
        fileKey: z.string(),
        fileUrl: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      })).length(3),
    }))
    .mutation(async ({ input }) => {
      // 建立會員記錄
      const memberResult = await createMember({
        englishName: input.englishName,
        companyName: input.companyName,
        chapter: input.chapter,
        profession: input.profession,
        phone: input.phone,
        email: input.email,
        yearsOfMembership: input.yearsOfMembership,
        isGoldMember: input.isGoldMember,
        weddingCategory: input.weddingCategory,
        weddingServices: input.weddingServices,
        serviceArea: input.serviceArea,
        pastCasesCount: input.pastCasesCount,
        uniqueAdvantage: input.uniqueAdvantage,
        facebookLink: input.facebookLink,
        instagramLink: input.instagramLink,
        websiteLink: input.websiteLink,
        bniMemberDiscount: input.bniMemberDiscount,
        referrer: input.referrer,
        status: "pending",
      });

      const memberId = Number(memberResult[0].insertId);

      // 建立檔案記錄（三個檔案）
      for (const file of input.files) {
        await createMemberFile({
          memberId,
          fileKey: file.fileKey,
          fileUrl: file.fileUrl,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
        });
      }

      // 發送通知給管理員
      await notifyOwner({
        title: "新會員資訊提交",
        content: `會員 ${input.englishName} (${input.email}) 已提交資訊，請前往後台審核。\n\n專業領域：${input.profession}\n所屬分會：${input.chapter}\n婚宴服務：${input.weddingServices.substring(0, 100)}...`,
      });

      return {
        success: true,
        memberId,
      };
    }),

  /**
   * 獲取所有會員列表（管理員）
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    // 只有管理員可以查看
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const membersList = await getAllMembers();
    return membersList;
  }),

  /**
   * 獲取單個會員詳情（管理員）
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const member = await getMemberById(input.id);
      if (!member) {
        throw new Error("Member not found");
      }

      const files = await getMemberFiles(input.id);

      return {
        member,
        files,
      };
    }),

  /**
   * 更新會員狀態（管理員）
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      await updateMemberStatus(input.id, input.status);

      return {
        success: true,
      };
    }),
});
