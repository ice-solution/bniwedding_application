import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Download, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Member = {
  id: number;
  englishName: string;
  companyName: string | null;
  chapter: string;
  profession: string;
  phone: string;
  email: string;
  yearsOfMembership: number;
  isGoldMember: "yes" | "no";
  weddingCategory: string | null;
  weddingServices: string;
  serviceArea: string | null;
  pastCasesCount: number | null;
  uniqueAdvantage: string | null;
  facebookLink: string | null;
  instagramLink: string | null;
  websiteLink: string | null;
  bniMemberDiscount: string | null;
  referrer: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

export default function AdminDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: members, isLoading, refetch } = trpc.members.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateStatusMutation = trpc.members.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("會員狀態已更新");
      refetch();
      setDetailsOpen(false);
    },
    onError: (error: any) => {
      toast.error("更新失敗", { description: error.message });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>管理員登入</CardTitle>
            <CardDescription>請登入以訪問管理後台</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>登入</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>權限不足</CardTitle>
            <CardDescription>您沒有權限訪問此頁面</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredMembers = members?.filter((member) => {
    const matchesSearch =
      member.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profession.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (!filteredMembers || filteredMembers.length === 0) {
      toast.error("沒有可匯出的資料");
      return;
    }

    const headers = [
      "ID",
      "英文名稱",
      "公司名稱",
      "所屬分會",
      "專業領域",
      "電話",
      "電郵",
      "入會年資",
      "金章會員",
      "婚宴分類",
      "服務區域",
      "案例數量",
      "狀態",
      "提交時間",
    ];

    const rows = filteredMembers.map((m) => [
      m.id,
      m.englishName,
      m.companyName || "",
      m.chapter,
      m.profession,
      m.phone,
      m.email,
      m.yearsOfMembership,
      m.isGoldMember === "yes" ? "是" : "否",
      m.weddingCategory || "",
      m.serviceArea || "",
      m.pastCasesCount || "",
      m.status === "pending" ? "待審核" : m.status === "approved" ? "已批准" : "已拒絕",
      new Date(m.createdAt).toLocaleString("zh-TW"),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bni-members-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("CSV 檔案已匯出");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            待審核
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="w-3 h-3" />
            已批准
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            已拒絕
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleViewDetails = (member: Member) => {
    setSelectedMember(member);
    setDetailsOpen(true);
  };

  const handleUpdateStatus = (status: "pending" | "approved" | "rejected") => {
    if (!selectedMember) return;
    updateStatusMutation.mutate({ id: selectedMember.id, status });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-serif">BNI BNWG 會員管理後台</CardTitle>
                <CardDescription className="mt-2">查看、篩選、管理會員資訊</CardDescription>
              </div>
              <Button onClick={handleExportCSV} className="gap-2">
                <Download className="w-4 h-4" />
                匯出 CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 篩選區域 */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋名稱、電郵、專業領域..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="狀態篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="pending">待審核</SelectItem>
                  <SelectItem value="approved">已批准</SelectItem>
                  <SelectItem value="rejected">已拒絕</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 會員列表 */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredMembers && filteredMembers.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>英文名稱</TableHead>
                      <TableHead>專業領域</TableHead>
                      <TableHead>所屬分會</TableHead>
                      <TableHead>電郵</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>提交時間</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.id}</TableCell>
                        <TableCell className="font-medium">{member.englishName}</TableCell>
                        <TableCell>{member.profession}</TableCell>
                        <TableCell>{member.chapter}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>{new Date(member.createdAt).toLocaleDateString("zh-TW")}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(member)}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            查看
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>沒有找到符合條件的會員資訊</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 會員詳情對話框 */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>會員詳細資訊</DialogTitle>
            <DialogDescription>查看並管理會員提交的完整資訊</DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg border-b pb-2">基本資訊</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">英文名稱：</span>
                    <span className="font-medium">{selectedMember.englishName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">公司名稱：</span>
                    <span className="font-medium">{selectedMember.companyName || "未提供"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">所屬分會：</span>
                    <span className="font-medium">{selectedMember.chapter}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">專業領域：</span>
                    <span className="font-medium">{selectedMember.profession}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">電話：</span>
                    <span className="font-medium">{selectedMember.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">電郵：</span>
                    <span className="font-medium">{selectedMember.email}</span>
                  </div>
                </div>
              </div>

              {/* 會員資歷 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg border-b pb-2">會員資歷</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">入會年資：</span>
                    <span className="font-medium">{selectedMember.yearsOfMembership} 年</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">金章會員：</span>
                    <span className="font-medium">{selectedMember.isGoldMember === "yes" ? "是" : "否"}</span>
                  </div>
                </div>
              </div>

              {/* 婚宴服務資訊 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg border-b pb-2">婚宴服務資訊</h4>
                <div className="space-y-2 text-sm">
                  {selectedMember.weddingCategory && (
                    <div>
                      <span className="text-muted-foreground">婚宴分類：</span>
                      <Badge variant="secondary" className="ml-2">
                        {selectedMember.weddingCategory}
                      </Badge>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">服務描述：</span>
                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedMember.weddingServices}</p>
                  </div>
                  {selectedMember.serviceArea && (
                    <div>
                      <span className="text-muted-foreground">服務區域：</span>
                      <span className="font-medium ml-2">{selectedMember.serviceArea}</span>
                    </div>
                  )}
                  {selectedMember.pastCasesCount !== null && (
                    <div>
                      <span className="text-muted-foreground">過往案例數量：</span>
                      <span className="font-medium ml-2">{selectedMember.pastCasesCount}</span>
                    </div>
                  )}
                  {selectedMember.uniqueAdvantage && (
                    <div>
                      <span className="text-muted-foreground">特色優勢：</span>
                      <p className="mt-1 p-3 bg-muted rounded-md">{selectedMember.uniqueAdvantage}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 社交媒體 */}
              {(selectedMember.facebookLink || selectedMember.instagramLink || selectedMember.websiteLink) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg border-b pb-2">社交媒體與網站</h4>
                  <div className="space-y-2 text-sm">
                    {selectedMember.facebookLink && (
                      <div>
                        <span className="text-muted-foreground">Facebook：</span>
                        <a
                          href={selectedMember.facebookLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-2"
                        >
                          {selectedMember.facebookLink}
                        </a>
                      </div>
                    )}
                    {selectedMember.instagramLink && (
                      <div>
                        <span className="text-muted-foreground">Instagram：</span>
                        <a
                          href={selectedMember.instagramLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-2"
                        >
                          {selectedMember.instagramLink}
                        </a>
                      </div>
                    )}
                    {selectedMember.websiteLink && (
                      <div>
                        <span className="text-muted-foreground">網站：</span>
                        <a
                          href={selectedMember.websiteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-2"
                        >
                          {selectedMember.websiteLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 其他資訊 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg border-b pb-2">其他資訊</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedMember.bniMemberDiscount && (
                    <div>
                      <span className="text-muted-foreground">BNI 會員折扣：</span>
                      <span className="font-medium">{selectedMember.bniMemberDiscount}</span>
                    </div>
                  )}
                  {selectedMember.referrer && (
                    <div>
                      <span className="text-muted-foreground">介紹人：</span>
                      <span className="font-medium">{selectedMember.referrer}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 狀態管理 */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold text-lg">狀態管理</h4>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus("pending")}
                    disabled={updateStatusMutation.isPending || selectedMember.status === "pending"}
                    className="gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    待審核
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={updateStatusMutation.isPending || selectedMember.status === "approved"}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    批准
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={updateStatusMutation.isPending || selectedMember.status === "rejected"}
                    className="gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    拒絕
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
