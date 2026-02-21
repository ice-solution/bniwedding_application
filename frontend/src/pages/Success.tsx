import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Success() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-serif text-primary">
            提交成功！
          </CardTitle>
          <CardDescription className="text-base mt-2">
            您的會員資訊已成功提交並新增至 Google Sheet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              感謝您填寫會員資訊收集表。我們已收到您的申請資料，並已自動記錄到系統中。
            </p>
            <p className="text-sm text-muted-foreground">
              我們會盡快審核您的資訊，如有任何問題，我們會透過您提供的聯絡方式與您聯繫。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={() => setLocation('/')}
              size="lg"
              className="px-8"
            >
              返回首頁
            </Button>
            <Button
              onClick={() => {
                window.location.reload();
                setLocation('/');
              }}
              variant="outline"
              size="lg"
              className="px-8"
            >
              填寫另一份申請
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
