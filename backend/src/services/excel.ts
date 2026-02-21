import * as XLSX from 'xlsx';

interface ApplicationData {
  englishName: string;
  companyName?: string;
  chapter: string;
  profession: string;
  phone: string;
  email: string;
  yearsOfMembership: number;
  isGoldMember: 'yes' | 'no';
  weddingCategory: string;
  weddingServices: string;
  serviceArea?: string;
  pastCasesCount?: number;
  uniqueAdvantage?: string;
  facebookLink?: string;
  instagramLink?: string;
  websiteLink?: string;
  bniMemberDiscount?: string;
  referrer?: string;
}

/**
 * 從申請資料建立 Excel 檔案
 */
export async function createExcelFromData(data: ApplicationData): Promise<Buffer> {
  // 準備工作表資料
  const worksheetData = [
    ['欄位', '內容'],
    ['提交時間', new Date().toLocaleString('zh-TW')],
    ['英文名稱', data.englishName],
    ['公司/品牌名稱', data.companyName || ''],
    ['所屬分會', data.chapter],
    ['專業領域', data.profession],
    ['會員電話', data.phone],
    ['會員電郵', data.email],
    ['入會年資', `${data.yearsOfMembership} 年`],
    ['金章會員', data.isGoldMember === 'yes' ? '是' : '否'],
    ['婚宴分類', data.weddingCategory],
    ['婚宴服務描述', data.weddingServices],
    ['服務區域', data.serviceArea || ''],
    ['過往婚宴案例數量', data.pastCasesCount?.toString() || ''],
    ['特色服務/差異化優勢', data.uniqueAdvantage || ''],
    ['Facebook 連結', data.facebookLink || ''],
    ['Instagram 連結', data.instagramLink || ''],
    ['網站連結', data.websiteLink || ''],
    ['BNI 會員折扣', data.bniMemberDiscount || ''],
    ['介紹人', data.referrer || ''],
  ];

  // 建立工作簿
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // 設定欄寬
  worksheet['!cols'] = [
    { wch: 20 }, // 欄位名稱欄
    { wch: 50 }, // 內容欄
  ];

  // 將工作表加入工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '會員資訊');

  // 將工作簿轉換為 Buffer
  const excelBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  return excelBuffer;
}
