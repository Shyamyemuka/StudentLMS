"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DialogRoot as Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Phone,
  User,
  Calendar,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Registration {
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export function RegistrationManagement() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);

      // Call server-side API route to fetch registrations with emails
      const response = await fetch(
        `/api/admin/student-registrations?filter=${filter}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }

      const { registrations } = await response.json();
      setRegistrations(registrations || []);
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations");
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };
  const handleApproveRegistration = async () => {
    if (!selectedReg) {
      toast.error("No registration selected");
      return;
    }

    try {
      setProcessing(true);

      // Call server-side API route for approval
      const response = await fetch("/api/admin/student-registrations/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: selectedReg.user_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve registration");
      }

      toast.success("Student approved successfully!");

      setSelectedReg(null);
      fetchRegistrations();
    } catch (error: any) {
      console.error("Error approving registration:", error);
      toast.error(error.message || "Failed to approve registration");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRegistration = async () => {
    if (!selectedReg) {
      toast.error("No registration selected");
      return;
    }

    try {
      setProcessing(true);

      // Call server-side API route for rejection
      const response = await fetch("/api/admin/student-registrations/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: selectedReg.user_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject registration");
      }

      toast.success("Student registration rejected and account deleted");

      setSelectedReg(null);
      fetchRegistrations();
    } catch (error: any) {
      console.error("Error rejecting registration:", error);
      toast.error(error.message || "Failed to reject registration");
    } finally {
      setProcessing(false);
    }
  };

  const openApproveDialog = (registration: Registration) => {
    setSelectedReg(registration);
  };

  const openRejectDialog = (registration: Registration) => {
    setSelectedReg(registration);
  };

  const getStatusBadge = (role: string) => {
    if (role === "student_pending") {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending Approval
        </Badge>
      );
    }
    if (role === "student") {
      return (
        <Badge className="bg-[#4CAF8F]/20 text-[#4CAF8F] border-[#4CAF8F]/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (role === "rejected_student") {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return <Badge variant="outline">{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#EAEAEA]">
            Student Registrations
          </h2>
          <p className="text-[#B0B0B0]">
            Review and approve student registration applications
          </p>
        </div>
        <Button
          onClick={fetchRegistrations}
          variant="outline"
          className="border-[#2A2F35]">
          Refresh
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as any)}
        className="w-full">
        <TabsList className="bg-[#14181D] border border-[#2A2F35]">
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            </div>
          ) : registrations.length === 0 ? (
            <Card className="bg-[#14181D] border-[#2A2F35]">
              <CardContent className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-12 w-12 text-[#707070] mb-4" />
                <p className="text-[#B0B0B0]">No registrations found</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#14181D] border-[#2A2F35]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A2F35] hover:bg-[#0B0D10]/50">
                      <TableHead className="text-[#B0B0B0]">
                        Student Name
                      </TableHead>
                      <TableHead className="text-[#B0B0B0]">Contact</TableHead>
                      <TableHead className="text-[#B0B0B0]">
                        Applied Date
                      </TableHead>
                      <TableHead className="text-[#B0B0B0]">Status</TableHead>
                      <TableHead className="text-[#B0B0B0]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow
                        key={reg.user_id}
                        className="border-[#2A2F35] hover:bg-[#0B0D10]/50">
                        <TableCell>
                          <div className="font-medium text-[#EAEAEA]">
                            {reg.full_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1 text-[#B0B0B0]">
                              <Mail className="h-3 w-3" />
                              {reg.email}
                            </div>
                            {reg.phone && (
                              <div className="flex items-center gap-1 text-[#B0B0B0]">
                                <Phone className="h-3 w-3" />
                                {reg.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-[#B0B0B0]">
                          {formatDate(reg.created_at)}
                        </TableCell>
                        <TableCell>{getStatusBadge(reg.role)}</TableCell>
                        <TableCell>
                          {reg.role === "student_pending" ? (
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => openApproveDialog(reg)}
                                    className="bg-[#4CAF8F] hover:bg-[#4CAF8F]/90">
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg bg-[#14181D] border-[#2A2F35]">
                                  <DialogHeader>
                                    <DialogTitle className="text-[#EAEAEA]">
                                      Approve Student
                                    </DialogTitle>
                                    <DialogDescription className="text-[#B0B0B0]">
                                      Approve {selectedReg?.full_name} as a
                                      student
                                    </DialogDescription>
                                  </DialogHeader>

                                  {selectedReg && (
                                    <div className="space-y-4">
                                      {/* Student Details */}
                                      <div className="bg-[#0B0D10] p-4 rounded-lg space-y-2 text-sm border border-[#2A2F35]">
                                        <h3 className="font-semibold mb-2 text-[#EAEAEA]">
                                          Student Information:
                                        </h3>
                                        <div className="space-y-1 text-[#B0B0B0]">
                                          <div>
                                            <strong className="text-[#EAEAEA]">
                                              Name:
                                            </strong>{" "}
                                            {selectedReg.full_name}
                                          </div>
                                          <div>
                                            <strong className="text-[#EAEAEA]">
                                              Email:
                                            </strong>{" "}
                                            {selectedReg.email}
                                          </div>
                                          {selectedReg.phone && (
                                            <div>
                                              <strong className="text-[#EAEAEA]">
                                                Phone:
                                              </strong>{" "}
                                              {selectedReg.phone}
                                            </div>
                                          )}
                                          <div>
                                            <strong className="text-[#EAEAEA]">
                                              Registered:
                                            </strong>{" "}
                                            {formatDate(selectedReg.created_at)}
                                          </div>
                                        </div>
                                      </div>

                                      <Alert className="bg-[#D4AF37]/10 border-[#D4AF37]/30">
                                        <AlertCircle className="h-4 w-4 text-[#D4AF37]" />
                                        <AlertDescription className="text-[#EAEAEA]">
                                          This will change the student's role
                                          from "pending" to "student", granting
                                          them full access to the platform.
                                        </AlertDescription>
                                      </Alert>

                                      <div className="flex gap-2 justify-end">
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="border-[#2A2F35]">
                                            Cancel
                                          </Button>
                                        </DialogTrigger>
                                        <Button
                                          onClick={handleApproveRegistration}
                                          disabled={processing}
                                          className="bg-[#4CAF8F] hover:bg-[#4CAF8F]/90">
                                          {processing ? (
                                            <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              Approving...
                                            </>
                                          ) : (
                                            <>
                                              <Check className="mr-2 h-4 w-4" />
                                              Approve Student
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openRejectDialog(reg)}
                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-500">
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md bg-[#14181D] border-[#2A2F35]">
                                  <DialogHeader>
                                    <DialogTitle className="text-[#EAEAEA]">
                                      Reject Student
                                    </DialogTitle>
                                    <DialogDescription className="text-[#B0B0B0]">
                                      Are you sure you want to reject{" "}
                                      {selectedReg?.full_name}?
                                    </DialogDescription>
                                  </DialogHeader>

                                  <Alert className="bg-red-500/10 border-red-500/30">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <AlertDescription className="text-[#EAEAEA]">
                                      This will permanently delete the user's
                                      account and they will need to register
                                      again.
                                    </AlertDescription>
                                  </Alert>

                                  <div className="flex gap-2 justify-end">
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="border-[#2A2F35]">
                                        Cancel
                                      </Button>
                                    </DialogTrigger>
                                    <Button
                                      onClick={handleRejectRegistration}
                                      disabled={processing}
                                      variant="destructive"
                                      className="bg-red-500 hover:bg-red-600">
                                      {processing ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Rejecting...
                                        </>
                                      ) : (
                                        <>
                                          <X className="mr-2 h-4 w-4" />
                                          Reject & Delete
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[#B0B0B0]">
                              {reg.role === "student" ? "Approved" : reg.role}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
