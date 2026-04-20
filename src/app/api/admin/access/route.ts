import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import {
  getPermissionCatalog,
  isProjectPermission,
  loadAccessControlConfig,
  saveAccessControlConfig,
} from '@/lib/access-control';

const groupSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(80),
  description: z.string().max(250).optional().default(''),
  permissions: z.array(z.string()).max(300).default([]),
  deniedPaths: z.array(z.string()).max(300).optional().default([]),
  isSystem: z.boolean().optional(),
});

const memberSchema = z.object({
  userId: z.string().min(1).max(120),
  groupIds: z.array(z.string()).max(20).default([]),
  directPermissions: z.array(z.string()).max(300).default([]),
  deniedPaths: z.array(z.string()).max(300).optional().default([]),
  isBlocked: z.boolean().optional().default(false),
});

const updateAccessSchema = z.object({
  groups: z.array(groupSchema).max(100),
  members: z.array(memberSchema).max(500),
});

export const GET = createHandler(
  { auth: true, roles: ['admin'] },
  async () => {
    const [config, users, usersTotal, portfoliosTotal, watchlistsTotal, alertsTotal] = await Promise.all([
      loadAccessControlConfig(),
      db.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      }),
      db.user.count(),
      db.portfolio.count(),
      db.watchlist.count(),
      db.alert.count(),
    ]);

    const memberMap = new Map(config.members.map((member) => [member.userId, member]));
    const members = users.map((user) => {
      const existing = memberMap.get(user.id);
      return existing ?? { userId: user.id, groupIds: [], directPermissions: [], deniedPaths: [], isBlocked: false };
    });

    return NextResponse.json({
      success: true,
      config: {
        groups: config.groups,
        members,
        updatedAt: config.updatedAt,
        updatedBy: config.updatedBy,
      },
      permissions: getPermissionCatalog(),
      users,
      stats: {
        usersTotal,
        adminsTotal: users.filter((user) => user.role === 'admin').length,
        groupsTotal: config.groups.length,
        membersConfigured: config.members.length,
        blockedMembers: config.members.filter((member) => member.isBlocked).length,
        portfoliosTotal,
        watchlistsTotal,
        alertsTotal,
      },
    });
  }
);

export const PUT = createHandler(
  { auth: true, roles: ['admin'] },
  async ({ request, user }) => {
    const body = await request.json();
    const parsed = updateAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) },
        { status: 400 }
      );
    }

    const groups = parsed.data.groups.map((group) => ({
      ...group,
      permissions: group.permissions.filter(isProjectPermission),
      description: group.description || '',
      deniedPaths: group.deniedPaths,
    }));

    const members = parsed.data.members.map((member) => ({
      userId: member.userId,
      groupIds: member.groupIds,
      directPermissions: member.directPermissions.filter(isProjectPermission),
      deniedPaths: member.deniedPaths,
      isBlocked: member.isBlocked,
    }));

    const saved = await saveAccessControlConfig(
      {
        groups,
        members,
      },
      user!.id
    );

    return NextResponse.json({
      success: true,
      config: saved,
    });
  }
);
