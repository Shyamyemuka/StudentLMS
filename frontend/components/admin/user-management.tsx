"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Trash2, Edit2, Mail, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [processing, setProcessing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("user_management_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchUsers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users from API route which includes emails
      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const { users } = await response.json();
      setUsers(users || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query),
      );
    }

    setFilteredUsers(filtered);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditDialog(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    // Prevent changing student roles
    if (selectedUser.role === "student") {
      toast.error(
        "Student roles cannot be changed. Students must remain students.",
      );
      return;
    }

    // Prevent changing student role to anything else
    if (newRole === "student" && selectedUser.role !== "student") {
      toast.error("Cannot change faculty or admin accounts to student role.");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast.success("User role updated successfully");
      setShowEditDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      // Delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", selectedUser.user_id);

      if (profileError) throw profileError;

      // Note: Deleting auth user requires admin API call on backend
      // For now, we just delete the profile

      toast.success("User deleted successfully");
      setShowDeleteDialog(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive/10 text-destructive border-destructive/30 border font-bold";
      case "faculty":
        return "bg-secondary/15 text-secondary border-secondary/30 border font-bold";
      case "faculty_pending":
        return "bg-primary/15 text-primary border-primary/30 border font-bold";
      case "student":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 border font-bold";
      default:
        return "bg-muted text-muted-foreground border-border/30 border font-bold";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground font-bold">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2 font-heading">
            User Management
          </h2>
          <p className="text-muted-foreground font-medium font-body">
            Manage user accounts, roles, and permissions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-card border-2 border-border rounded-xl text-foreground font-bold font-body focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
            <option value="faculty_pending">Pending Faculty</option>
            <option value="student">Student</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-card border-2 border-border p-4 shadow-hard-sm rounded-xl">
            <div className="text-2xl font-bold text-foreground">
              {filteredUsers.length}
            </div>
            <div className="text-xs text-muted-foreground font-bold">
              {roleFilter === "all" ? "Total Users" : "Filtered Users"}
            </div>
          </Card>
          <Card className="bg-card border-2 border-border p-4 shadow-hard-sm rounded-xl">
            <div className="text-2xl font-bold text-success">
              {users.filter((u) => u.role === "student").length}
            </div>
            <div className="text-xs text-muted-foreground font-bold">Students</div>
          </Card>
          <Card className="bg-card border-2 border-border p-4 shadow-hard-sm rounded-xl">
            <div className="text-2xl font-bold text-secondary">
              {users.filter((u) => u.role === "faculty").length}
            </div>
            <div className="text-xs text-muted-foreground font-bold">Faculty</div>
          </Card>
          <Card className="bg-card border-2 border-border p-4 shadow-hard-sm rounded-xl">
            <div className="text-2xl font-bold text-destructive">
              {users.filter((u) => u.role === "admin").length}
            </div>
            <div className="text-xs text-muted-foreground font-bold">Admins</div>
          </Card>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card className="bg-card border-2 border-border p-12 text-center shadow-hard-sm rounded-xl">
            <p className="text-muted-foreground font-medium font-body">No users found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card
                key={user.user_id}
                className="bg-card border-2 border-border p-4 hover:border-primary/50 transition-colors shadow-hard-sm rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground truncate font-heading">
                        {user.full_name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeColor(user.role)}>
                        {user.role === "faculty_pending"
                          ? "Pending Faculty"
                          : user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground font-bold font-body">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Joined {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditClick(user)}
                      size="sm"
                      variant="outline"
                      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                      className="bg-primary/10 hover:bg-primary/20 text-primary border-2 border-border font-bold shadow-hard-sm cursor-pointer transition-all active:scale-95">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Role
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(user)}
                      size="sm"
                      variant="outline"
                      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                      className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-2 border-border font-bold shadow-hard-sm cursor-pointer transition-all active:scale-95">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog
        isOpen={showEditDialog}
        onClose={() => !processing && setShowEditDialog(false)}
        title="Edit User Role"
        confirmText="Update Role"
        cancelText="Cancel"
        confirmVariant="primary"
        onConfirm={handleUpdateRole}
        onCancel={() => setShowEditDialog(false)}>
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-2 font-body">
                Changing role for:{" "}
                <span className="text-foreground font-bold">
                  {selectedUser.full_name}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2 font-body">
                Select New Role
              </label>
              {selectedUser.role === "student" ? (
                <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
                  <p className="text-destructive font-bold text-sm font-body">
                    ⚠️ Student accounts cannot be changed to another role.
                  </p>
                </div>
              ) : (
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 bg-background border-2 border-border rounded-xl text-foreground font-bold font-body focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="faculty">Faculty</option>
                  <option value="faculty_pending">Pending Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => !processing && setShowDeleteDialog(false)}
        title="Delete User?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteUser}
        onCancel={() => setShowDeleteDialog(false)}>
        {selectedUser && (
          <div className="space-y-4 font-body">
            <p className="text-muted-foreground font-bold text-sm">
              Are you sure you want to delete{" "}
              <span className="text-foreground font-black">
                {selectedUser.full_name}
              </span>
              ?
            </p>
            <p className="text-destructive font-black text-sm">
              This action cannot be undone. The user's profile will be
              permanently deleted.
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}
