import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { Loader2, Upload, X } from 'lucide-react';

const BANNER_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/static/bnibanner.jpg`
  : 'http://localhost:3000/static/bnibanner.jpg';

// 婚宴分類選項
const WEDDING_CATEGORIES = [
  '場地',
  '攝影',
  '錄影',
  '化妝',
  '婚紗',
  '餐飲',
  '佈置',
  '主持',
  '音響燈光',
  '婚禮統籌',
  '婚禮小物',
  '喜帖設計',
  '婚禮蛋糕',
  '花藝',
  '婚車租賃',
  '其他',
];

const formSchema = z.object({
  englishFirstName: z.string().min(1, '請輸入名'),
  englishLastName: z.string().min(1, '請輸入姓'),
  companyName: z.string().optional(),
  chapter: z.string().min(1, '請選擇所屬分會'),
  profession: z.string().min(1, '請輸入專業領域'),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, '請輸入有效的電話號碼'),
  email: z.string().email('請輸入有效的電郵地址'),
  yearsOfMembership: z.number().min(1).max(25),
  isGoldMember: z.enum(['yes', 'no']),
  isDnA: z.enum(['yes', 'no']),
  weddingCategory: z.string().min(1, '請選擇婚宴分類'),
  weddingServices: z.string().min(10, '請詳細描述您的婚宴服務（至少10個字元）'),
  serviceArea: z.string().optional(),
  pastCasesCount: z.number().optional(),
  uniqueAdvantage: z.string().optional(),
  facebookLink: z.string().url('請輸入有效的 Facebook 連結').optional().or(z.literal('')),
  instagramLink: z.string().url('請輸入有效的 Instagram 連結').optional().or(z.literal('')),
  websiteLink: z.string().url('請輸入有效的網站連結').optional().or(z.literal('')),
  bniMemberDiscount: z.string().optional(),
  referrer: z.string().optional(),
  bniWeddingBusinessCount: z.number().optional(),
  bniBusinessAmount: z.string().optional(),
  bnwgGoals: z.string().optional(),
  interestedInAdmin: z.enum(['yes', 'no']).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function MemberForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [, setLocation] = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      yearsOfMembership: 1,
      isGoldMember: 'no',
      isDnA: 'no',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // 檢查檔案數量
    if (uploadedFiles.length + files.length > 3) {
      toast.error('最多只能上傳 3 個檔案');
      return;
    }
    
    // 檢查每個檔案大小 (16MB limit)
    for (const file of files) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error(`檔案 ${file.name} 大小不能超過 16MB`);
        return;
      }
    }
    
    setUploadedFiles(prev => [...prev, ...files]);
    toast.success(`已選擇 ${files.length} 個檔案`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.info('已移除檔案');
  };

  const onSubmit = async (data: FormData) => {
    if (uploadedFiles.length !== 3) {
      toast.error('請上傳連續三個月綠燈證明文件（共 3 個檔案）');
      return;
    }

    setIsSubmitting(true);
    try {
      // 上傳所有綠燈檔案
      const uploadedFileData = [];
      
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`檔案 ${file.name} 上傳失敗`);
        }

        const { fileKey, fileUrl } = await uploadResponse.json();
        uploadedFileData.push({
          fileKey,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      }

      // 上傳 Company Logo 檔案（如果有）
      let logoData: { logoFileKey?: string; logoFileUrl?: string } = {};
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);

        const logoUploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: logoFormData,
        });

        if (!logoUploadResponse.ok) {
          throw new Error('Company Logo 上傳失敗');
        }

        const { fileKey, fileUrl } = await logoUploadResponse.json();
        logoData = {
          logoFileKey: fileKey,
          logoFileUrl: fileUrl,
        };
      }

      // 提交會員資訊（包含檔案資訊）
      const response = await fetch('/api/application/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ...logoData,
          files: uploadedFileData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '提交失敗');
      }

      // 跳轉到成功頁面
      setLocation('/success');
    } catch (error) {
      console.error('提交錯誤:', error);
      toast.error('提交失敗', {
        description: error instanceof Error ? error.message : '請稍後再試',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Banner */}
      {BANNER_URL && (
        <div className="w-full h-64 md:h-80 overflow-hidden relative">
          <img
            src={BANNER_URL}
            alt="BNI BNWG Banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Form */}
      <div className="container py-8 md:py-12">
        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl font-serif text-primary">
              會員資訊收集表
            </CardTitle>
            <CardDescription className="text-base mt-2">
              請填寫以下資訊，我們將為您提供最專業的婚宴服務支援
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* 基本資訊 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">基本資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="englishLastName">
                      姓 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="englishLastName"
                      {...register('englishLastName')}
                      placeholder="例如：Doe"
                    />
                    {errors.englishLastName && (
                      <p className="text-sm text-destructive">{errors.englishLastName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="englishFirstName">
                      名 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="englishFirstName"
                      {...register('englishFirstName')}
                      placeholder="例如：John"
                    />
                    {errors.englishFirstName && (
                      <p className="text-sm text-destructive">{errors.englishFirstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">公司/品牌名稱</Label>
                    <Input
                      id="companyName"
                      {...register('companyName')}
                      placeholder="例如：ABC Wedding Studio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chapter">
                      所屬分會 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="chapter"
                      {...register('chapter')}
                      placeholder="例如：香港分會"
                    />
                    {errors.chapter && (
                      <p className="text-sm text-destructive">{errors.chapter.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession">
                      專業領域 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="profession"
                      {...register('profession')}
                      placeholder="例如：婚禮攝影"
                    />
                    {errors.profession && (
                      <p className="text-sm text-destructive">{errors.profession.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      會員電話 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="例如：+852 1234 5678"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      會員電郵 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="example@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 會員資歷 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">會員資歷</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfMembership">
                      入會年資 <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => setValue('yearsOfMembership', parseInt(value))}
                      defaultValue="1"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇入會年資" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 25 }, (_, i) => i + 1).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year} 年
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isGoldMember">
                      金章會員 <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => setValue('isGoldMember', value as 'yes' | 'no')}
                      defaultValue="no"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">是</SelectItem>
                        <SelectItem value="no">否</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isDnA">
                      D&A <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => setValue('isDnA', value as 'yes' | 'no')}
                      defaultValue="no"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 上載連續三個月綠燈 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">上載連續三個月綠燈</h3>
                <div className="space-y-2">
                  <Label htmlFor="greenLightFiles">
                    請上傳 3 個檔案 <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('greenLightFiles')?.click()}
                      disabled={uploadedFiles.length >= 3}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      選擇檔案
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      已上傳 {uploadedFiles.length} / 3 個檔案
                    </span>
                  </div>
                  <input
                    id="greenLightFiles"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {/* 已上傳檔案列表 */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="gap-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    支援格式：PDF, JPG, PNG，每個檔案最大 16MB
                  </p>
                </div>
              </div>

              {/* 婚宴服務資訊 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">婚宴服務資訊</h3>

                <div className="space-y-2">
                  <Label htmlFor="weddingCategory">
                    婚宴分類 <span className="text-destructive">*</span>
                  </Label>
                  <Select onValueChange={(value) => setValue('weddingCategory', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇婚宴分類" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEDDING_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.weddingCategory && (
                    <p className="text-sm text-destructive">{errors.weddingCategory.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weddingServices">
                    婚宴服務描述 <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="weddingServices"
                    {...register('weddingServices')}
                    placeholder="請詳細描述您提供的婚宴服務內容、特色、經驗等..."
                    rows={5}
                  />
                  {errors.weddingServices && (
                    <p className="text-sm text-destructive">{errors.weddingServices.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceArea">服務區域</Label>
                    <Input
                      id="serviceArea"
                      {...register('serviceArea')}
                      placeholder="例如：香港、九龍、新界"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pastCasesCount">過往婚宴案例數量</Label>
                    <Input
                      id="pastCasesCount"
                      type="number"
                      {...register('pastCasesCount', { valueAsNumber: true })}
                      placeholder="例如：100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uniqueAdvantage">特色服務/差異化優勢</Label>
                  <Textarea
                    id="uniqueAdvantage"
                    {...register('uniqueAdvantage')}
                    placeholder="請描述您的獨特優勢或特色服務..."
                    rows={3}
                  />
                </div>
              </div>

              {/* 社交媒體與網站 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">社交媒體與網站</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebookLink">Facebook 連結</Label>
                    <Input
                      id="facebookLink"
                      {...register('facebookLink')}
                      placeholder="https://facebook.com/..."
                    />
                    {errors.facebookLink && (
                      <p className="text-sm text-destructive">{errors.facebookLink.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagramLink">Instagram 連結</Label>
                    <Input
                      id="instagramLink"
                      {...register('instagramLink')}
                      placeholder="https://instagram.com/..."
                    />
                    {errors.instagramLink && (
                      <p className="text-sm text-destructive">{errors.instagramLink.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteLink">網站連結</Label>
                    <Input
                      id="websiteLink"
                      {...register('websiteLink')}
                      placeholder="https://example.com"
                    />
                    {errors.websiteLink && (
                      <p className="text-sm text-destructive">{errors.websiteLink.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Logo 上傳 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">上傳 Company Logo</h3>
                <div className="space-y-2">
                  <Label htmlFor="logoFile">
                    白色/透明 Company Logo
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logoFile')?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      選擇 Company Logo 檔案
                    </Button>
                    {logoFile && (
                      <span className="text-sm text-muted-foreground">
                        {logoFile.name}
                      </span>
                    )}
                  </div>
                  <input
                    id="logoFile"
                    type="file"
                    accept=".png,.svg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 16 * 1024 * 1024) {
                          toast.error('Company Logo 檔案大小不能超過 16MB');
                          return;
                        }
                        setLogoFile(file);
                        toast.success(`已選擇 Company Logo: ${file.name}`);
                      }
                    }}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    支援格式：PNG, SVG，檔案最大 16MB
                  </p>
                </div>
              </div>

              {/* 業務統計調查 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">
                  業務統計調查（2025 年 3 月 - 2026 年 6 月）
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bniWeddingBusinessCount">
                      在 BNI 所獲得的婚禮相關業務宗數
                    </Label>
                    <Input
                      id="bniWeddingBusinessCount"
                      type="number"
                      {...register('bniWeddingBusinessCount', { valueAsNumber: true })}
                      placeholder="例如：10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bniBusinessAmount">
                      生意成交金額
                    </Label>
                    <Input
                      id="bniBusinessAmount"
                      {...register('bniBusinessAmount')}
                      placeholder="例如：HKD 100,000"
                    />
                  </div>
                </div>
              </div>

              {/* 目標與意願 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">目標與意願</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bnwgGoals">
                      最期望透過 BNI Wedding Group 完成的目標是什麼或其他意見
                    </Label>
                    <Textarea
                      id="bnwgGoals"
                      {...register('bnwgGoals')}
                      placeholder="請分享您的目標與期望..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestedInAdmin">
                      會否有興趣將來成為 Admin Group 成員
                    </Label>
                    <Select
                      onValueChange={(value) => setValue('interestedInAdmin', value as 'yes' | 'no')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 其他資訊 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">其他資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bniMemberDiscount">BNI 會員折扣</Label>
                    <Input
                      id="bniMemberDiscount"
                      {...register('bniMemberDiscount')}
                      placeholder="例如：9折優惠"
                    />
                    <p className="text-xs text-muted-foreground">
                      2026 優惠即日至 12 月 31 日
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referrer">介紹人</Label>
                    <Input
                      id="referrer"
                      {...register('referrer')}
                      placeholder="介紹人姓名"
                    />
                  </div>
                </div>
              </div>

              {/* 提交按鈕 */}
              <div className="flex justify-center items-center pt-4 w-full">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="px-12"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    '提交會員資訊'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
