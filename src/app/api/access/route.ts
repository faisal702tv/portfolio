import { NextResponse } from 'next/server';
import { createHandler } from '@/lib/api-handler';
import { getPermissionCatalog, loadAccessControlConfig, resolveUserAccess } from '@/lib/access-control';

export const GET = createHandler(
  { auth: true },
  async ({ user }) => {
    const config = await loadAccessControlConfig();
    const access = resolveUserAccess({ id: user!.id, role: user!.role }, config);

    return NextResponse.json({
      success: true,
      access: {
        isAdmin: user!.role === 'admin',
        isBlocked: access.isBlocked,
        permissions: access.permissions,
        routePrefixes: access.routePrefixes,
        deniedRoutePrefixes: access.deniedRoutePrefixes,
        assignedGroupIds: access.assignedGroupIds,
      },
      catalog: getPermissionCatalog(),
      updatedAt: config.updatedAt,
      updatedBy: config.updatedBy,
    });
  }
);
