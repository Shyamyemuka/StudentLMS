"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCheck, CheckCircle, XCircle, Mail, Calendar } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface PendingFaculty {
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export default function FacultyApprovals() {
  const [pendingUsers, setPendingUsers] = useState<PendingFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingFaculty | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchPendingFaculty();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("faculty_approvals_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchPendingFaculty();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingFaculty = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "faculty_pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching pending faculty:", error);
      toast.error("Failed to load pending faculty");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "faculty" })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Faculty account approved successfully");
      fetchPendingFaculty();
    } catch (error: any) {
      console.error("Error approving faculty:", error);
      toast.error("Failed to approve faculty account");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectClick = (user: PendingFaculty) => {
    setSelectedUser(user);
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedUser) return;

    setProcessing(selectedUser.user_id);
    try {
      // Call API to delete both profile and auth user
      const response = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUser.user_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject request");
      }

      toast.success("Faculty request rejected and user removed");
      setShowRejectDialog(false);
      fetchPendingFaculty();
    } catch (error: any) {
      console.error("Error rejecting faculty:", error);
      toast.error(error.message || "Failed to reject faculty request");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground font-bold">Loading pending requests...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground font-heading mb-2">
            Faculty Approvals
          </h2>
          <p className="text-muted-foreground font-bold">
            Review and approve faculty account requests
          </p>
        </div>

        {/* Stats */}
        <Card 
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          className="bg-card border-2 border-border p-6 shadow-hard-sm"
        >
          <div className="flex items-center gap-4">
            <UserCheck className="w-8 h-8 text-primary" />
            <div>
              <div className="text-2xl font-bold text-foreground font-heading">
                {pendingUsers.length}
              </div>
              <div className="text-sm text-muted-foreground font-bold">
                Pending Faculty Request{pendingUsers.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </Card>

        {/* Pending List */}
        {pendingUsers.length === 0 ? (
          <Card 
            style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
            className="bg-card border-2 border-border p-12 text-center shadow-hard-md"
          >
            <UserCheck className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-muted-foreground font-bold">No pending faculty requests</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <Card
                key={user.user_id}
                style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
                className="bg-card border-2 border-border p-6 shadow-hard-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground font-heading mb-2">
                      {user.full_name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground font-bold">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        {user.email}
                      </span>
                      <span className="hidden sm:inline text-border">•</span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Requested {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(user.user_id)}
                      disabled={processing === user.user_id}
                      size="sm"
                      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-border font-bold shadow-hard-sm cursor-pointer transition-all active:scale-95">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {processing === user.user_id ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(user)}
                      disabled={processing === user.user_id}
                      size="sm"
                      variant="outline"
                      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                      className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-2 border-destructive/30 font-bold shadow-hard-sm cursor-pointer transition-all active:scale-95">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Confirmation Dialog */}
      <Dialog
        isOpen={showRejectDialog}
        onClose={() => !processing && setShowRejectDialog(false)}
        title="Reject Faculty Request?"
        confirmText="Reject"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleReject}
        onCancel={() => setShowRejectDialog(false)}>
        {selectedUser && (
          <div className="space-y-4 font-bold">
            <p className="text-muted-foreground text-sm">
              Are you sure you want to reject the faculty request from{" "}
              <span className="text-foreground font-bold">
                {selectedUser.full_name}
              </span>
              ?
            </p>
            <p className="text-destructive text-sm font-bold">
              This will delete their account. They will need to sign up again if
              they wish to reapply.
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}
