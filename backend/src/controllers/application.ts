import { Request, Response } from 'express';
import { uploadToGoogleDrive } from '../services/googleDrive.js';
import { createExcelFromData } from '../services/excel.js';
import { appendToGoogleSheet } from '../services/googleSheets.js';
import { z } from 'zod';

const applicationSchema = z.object({
  englishName: z.string().min(1),
  companyName: z.string().optional(),
  chapter: z.string().min(1),
  profession: z.string().min(1),
  phone: z.string(),
  email: z.string().email(),
  yearsOfMembership: z.number().min(1).max(25),
  isGoldMember: z.enum(['yes', 'no']),
  weddingCategory: z.string().min(1),
  weddingServices: z.string().min(10),
  serviceArea: z.string().optional(),
  pastCasesCount: z.number().optional(),
  uniqueAdvantage: z.string().optional(),
  facebookLink: z.string().url().optional().or(z.literal('')),
  instagramLink: z.string().url().optional().or(z.literal('')),
  websiteLink: z.string().url().optional().or(z.literal('')),
  bniMemberDiscount: z.string().optional(),
  referrer: z.string().optional(),
});

export async function submitApplication(req: Request, res: Response) {
  try {
    // 驗證輸入資料
    const data = applicationSchema.parse(req.body);

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (spreadsheetId) {
      // 如果有設定 Google Sheet ID，直接新增到 Sheet
      await appendToGoogleSheet(data, spreadsheetId);
      
      res.json({
        success: true,
        message: '申請已成功提交並新增至 Google Sheet',
        spreadsheetId,
      });
    } else {
      // 如果沒有設定 Sheet ID，使用原本的 Excel 方式
      const excelBuffer = await createExcelFromData(data);
      const fileId = await uploadToGoogleDrive(
        excelBuffer,
        `${data.englishName}_${Date.now()}.xlsx`
      );

      res.json({
        success: true,
        message: '申請已成功提交並上傳至 Google Drive',
        fileId,
      });
    }
  } catch (error) {
    console.error('Application submission error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: '資料驗證失敗',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: '提交失敗，請稍後再試',
    });
  }
}
