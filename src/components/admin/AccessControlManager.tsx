'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Save, Shield, Trash2, Users } from 'lucide-react';

interface PermissionItem {
  key: string;
  kind: 'module' | 'page';
  label: string;
  description: string;
  routePrefixes: string[];
}

interface AccessGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  deniedPaths: string[];
  isSystem?: boolean;
}

interface AccessMember {
  userId: string;
  groupIds: string[];
  directPermissions: string[];
  deniedPaths: string[];
  isBlocked: boolean;
}

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  username: string;
  role: string;
}

interface AccessStats {
  usersTotal: number;
  adminsTotal: number;
  groupsTotal: number;
  membersConfigured: number;
  blockedMembers: number;
  portfoliosTotal: number;
  watchlistsTotal: number;
  alertsTotal: number;
}

interface AccessControlManagerProps {
  token: string | null;
  enabled: boolean;
}

function buildMember(userId: string): AccessMember {
  return {
    userId,
    groupIds: [],
    directPermissions: [],
    deniedPaths: [],
    isBlocked: false,
  };
}

function randomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AccessControlManager({ token, enabled }: AccessControlManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [members, setMembers] = useState<AccessMember[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [stats, setStats] = useState<AccessStats | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupPermissions, setNewGroupPermissions] = useState<string[]>(['module.home']);

  useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;

    setLoading(true);
    (async () => {
      try {
        const response = await fetch('/api/admin/access', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('failed loading access control');
        }

        const payload = await response.json();
        if (cancelled) return;

        setGroups(
          Array.isArray(payload?.config?.groups)
            ? payload.config.groups.map((group: AccessGroup) => ({ ...group, deniedPaths: [] }))
            : []
        );
        setMembers(
          Array.isArray(payload?.config?.members)
            ? payload.config.members.map((member: AccessMember) => ({ ...member, deniedPaths: [] }))
            : []
        );
        setUsers(Array.isArray(payload?.users) ? payload.users : []);
        setPermissions(Array.isArray(payload?.permissions) ? payload.permissions : []);
        setStats(payload?.stats ?? null);
      } catch {
        if (cancelled) return;
        toast({
          title: 'تعذر تحميل الصلاحيات',
          description: 'حدث خطأ أثناء جلب إعدادات مجموعات الأدمن',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, token, toast]);

  const nonAdminUsers = useMemo(() => users.filter((user) => user.role !== 'admin'), [users]);
  const modulePermissions = useMemo(() => permissions.filter((permission) => permission.kind === 'module'), [permissions]);
  const pagePermissions = useMemo(() => permissions.filter((permission) => permission.kind === 'page'), [permissions]);

  const updateGroup = (groupId: string, updater: (group: AccessGroup) => AccessGroup) => {
    setGroups((prev) => prev.map((group) => (group.id === groupId ? updater(group) : group)));
  };

  const updateMember = (userId: string, updater: (member: AccessMember) => AccessMember) => {
    setMembers((prev) => {
      const existing = prev.find((member) => member.userId === userId) || buildMember(userId);
      const updated = updater(existing);
      const rest = prev.filter((member) => member.userId !== userId);
      return [...rest, updated];
    });
  };

  const toggleListValue = (list: string[], value: string, checked: boolean): string[] => {
    if (checked) return [...new Set([...list, value])];
    return list.filter((entry) => entry !== value);
  };

  const toggleGroupPermission = (groupId: string, permissionKey: string, checked: boolean) => {
    updateGroup(groupId, (group) => {
      if (group.id === 'group-super-admin') return group;
      return {
        ...group,
        permissions: toggleListValue(group.permissions, permissionKey, checked),
      };
    });
  };

  const updateGroupField = (groupId: string, field: 'name' | 'description', value: string) => {
    updateGroup(groupId, (group) => ({
      ...group,
      [field]: value,
    }));
  };

  const toggleMemberGroup = (userId: string, groupId: string, checked: boolean) => {
    updateMember(userId, (member) => ({
      ...member,
      groupIds: toggleListValue(member.groupIds, groupId, checked),
    }));
  };

  const toggleMemberBlocked = (userId: string, blocked: boolean) => {
    updateMember(userId, (member) => ({
      ...member,
      isBlocked: blocked,
    }));
  };

  const toggleMemberPagePermission = (userId: string, permissionKey: string, checked: boolean) => {
    updateMember(userId, (member) => ({
      ...member,
      directPermissions: toggleListValue(member.directPermissions, permissionKey, checked),
    }));
  };

  const toggleNewGroupPermission = (permissionKey: string, checked: boolean) => {
    setNewGroupPermissions((prev) => {
      if (checked) return [...new Set([...prev, permissionKey])];
      return prev.filter((key) => key !== permissionKey);
    });
  };

  const addGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: 'اسم المجموعة مطلوب',
        description: 'يرجى إدخال اسم للمجموعة قبل إضافتها',
        variant: 'destructive',
      });
      return;
    }

    setGroups((prev) => [
      ...prev,
      {
        id: randomId('group-custom'),
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        permissions: [...newGroupPermissions],
        deniedPaths: [],
        isSystem: false,
      },
    ]);
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupPermissions(['module.home']);
  };

  const removeGroup = (groupId: string) => {
    if (groupId === 'group-super-admin') return;
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    setMembers((prev) =>
      prev.map((member) => ({
        ...member,
        groupIds: member.groupIds.filter((id) => id !== groupId),
      }))
    );
  };

  const saveAccessControl = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/access', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groups: groups.map((group) => ({ ...group, deniedPaths: [] })),
          members: members.map((member) => ({ ...member, deniedPaths: [] })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'failed saving access control');
      }

      const payload = await response.json();
      setGroups(
        Array.isArray(payload?.config?.groups)
          ? payload.config.groups.map((group: AccessGroup) => ({ ...group, deniedPaths: [] }))
          : groups.map((group) => ({ ...group, deniedPaths: [] }))
      );
      setMembers(
        Array.isArray(payload?.config?.members)
          ? payload.config.members.map((member: AccessMember) => ({ ...member, deniedPaths: [] }))
          : members.map((member) => ({ ...member, deniedPaths: [] }))
      );

      toast({
        title: 'تم حفظ الصلاحيات',
        description: 'تم تعديل المجموعات وصلاحيات الصفحات بنجاح',
      });
    } catch (error) {
      toast({
        title: 'فشل الحفظ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ الصلاحيات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!enabled) return null;

  return (
    <Card dir="rtl" className="text-right">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          إدارة أعضاء الأدمن والمجموعات
        </CardTitle>
        <CardDescription>تعديل أسماء المجموعات وصلاحياتها ومنح الصلاحيات على مستوى الصفحات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري تحميل إعدادات الصلاحيات...
          </div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold">{stats.usersTotal}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold">{groups.length}</p>
                  <p className="text-xs text-muted-foreground">المجموعات</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold">{stats.portfoliosTotal}</p>
                  <p className="text-xs text-muted-foreground">المحافظ</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold">{stats.alertsTotal}</p>
                  <p className="text-xs text-muted-foreground">التنبيهات</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold">المجموعات الحالية</h4>
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {group.isSystem && <Badge variant="secondary">نظام</Badge>}
                        <Badge variant="outline">{group.permissions.length} صلاحية</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGroup(group.id)}
                        title="حذف المجموعة"
                        disabled={group.id === 'group-super-admin'}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>اسم المجموعة</Label>
                        <Input
                          value={group.name}
                          onChange={(event) => updateGroupField(group.id, 'name', event.target.value)}
                          placeholder="اسم المجموعة"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الوصف</Label>
                        <Input
                          value={group.description || ''}
                          onChange={(event) => updateGroupField(group.id, 'description', event.target.value)}
                          placeholder="وصف المجموعة"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>صلاحيات الأقسام</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {modulePermissions.map((permission) => (
                          <label key={`${group.id}-${permission.key}`} className="flex items-center gap-2 rounded border p-2 text-sm">
                            <Checkbox
                              checked={group.permissions.includes(permission.key)}
                              onCheckedChange={(checked) => toggleGroupPermission(group.id, permission.key, checked === true)}
                              disabled={group.id === 'group-super-admin'}
                            />
                            <span>{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>منح صلاحية الصفحات</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pagePermissions.map((permission) => (
                          <label key={`${group.id}-grant-${permission.key}`} className="flex items-center gap-2 rounded border p-2 text-sm">
                            <Checkbox
                              checked={group.permissions.includes(permission.key)}
                              onCheckedChange={(checked) => toggleGroupPermission(group.id, permission.key, checked === true)}
                              disabled={group.id === 'group-super-admin'}
                            />
                            <span>{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed p-4 space-y-3">
                <h5 className="font-medium">إضافة مجموعة جديدة</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>اسم المجموعة</Label>
                    <Input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="مثال: فريق التحليل" />
                  </div>
                  <div className="space-y-2">
                    <Label>وصف مختصر</Label>
                    <Input value={newGroupDescription} onChange={(event) => setNewGroupDescription(event.target.value)} placeholder="وصف دور هذه المجموعة" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>صلاحيات المجموعة الجديدة</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissions.map((permission) => (
                      <label key={`new-${permission.key}`} className="flex items-center gap-2 rounded border p-2 text-sm">
                        <Checkbox
                          checked={newGroupPermissions.includes(permission.key)}
                          onCheckedChange={(checked) => toggleNewGroupPermission(permission.key, checked === true)}
                        />
                        <span>{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={addGroup} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة المجموعة
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                الأعضاء وصلاحيات الصفحات
              </h4>
              <div className="space-y-4">
                {nonAdminUsers.map((managedUser) => {
                  const member = members.find((entry) => entry.userId === managedUser.id) || buildMember(managedUser.id);
                  return (
                    <div key={managedUser.id} className="rounded-lg border p-3 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-medium">{managedUser.name || managedUser.username}</p>
                          <p className="text-xs text-muted-foreground">{managedUser.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">حظر الدخول</span>
                          <Switch checked={member.isBlocked} onCheckedChange={(checked) => toggleMemberBlocked(managedUser.id, checked)} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>المجموعات</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {groups.map((group) => (
                            <label key={`${managedUser.id}-group-${group.id}`} className="flex items-center gap-2 rounded border p-2 text-sm">
                              <Checkbox
                                checked={member.groupIds.includes(group.id)}
                                onCheckedChange={(checked) => toggleMemberGroup(managedUser.id, group.id, checked === true)}
                              />
                              <span>{group.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>منح صفحة مباشرة لهذا العضو</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {pagePermissions.map((permission) => (
                            <label key={`${managedUser.id}-page-grant-${permission.key}`} className="flex items-center gap-2 rounded border p-2 text-sm">
                              <Checkbox
                                checked={member.directPermissions.includes(permission.key)}
                                onCheckedChange={(checked) => toggleMemberPagePermission(managedUser.id, permission.key, checked === true)}
                              />
                              <span>{permission.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveAccessControl} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات والمجموعات'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
