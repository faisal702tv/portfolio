import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const ACCESS_CONTROL_SETTING_KEY = 'admin_access_control_v1';

type PermissionKind = 'module' | 'page';

export interface PermissionDefinition {
  key: string;
  kind: PermissionKind;
  label: string;
  description: string;
  routePrefixes: string[];
}

const MODULE_PERMISSION_DEFINITIONS = [
  {
    key: 'module.home',
    kind: 'module',
    label: 'الرئيسية والحساب',
    description: 'لوحة المعلومات وإعدادات الحساب الأساسية',
    routePrefixes: ['/', '/profile', '/settings'],
  },
  {
    key: 'module.database',
    kind: 'module',
    label: 'قاعدة البيانات',
    description: 'الوصول لصفحات قواعد البيانات المركزية',
    routePrefixes: ['/stocks-database', '/database'],
  },
  {
    key: 'module.markets',
    kind: 'module',
    label: 'الأسواق',
    description: 'الأسواق، الفلترة، المقارنات، العملات، السلع',
    routePrefixes: ['/markets', '/market', '/screener', '/heatmap', '/compare', '/forex', '/commodities', '/crypto', '/us-market'],
  },
  {
    key: 'module.portfolio',
    kind: 'module',
    label: 'المحفظة',
    description: 'المحافظ، المراكز، الأداء، سجل البيع',
    routePrefixes: ['/portfolios', '/consolidated-portfolio', '/stocks', '/bonds', '/funds', '/watchlist', '/dividends', '/performance', '/sell-history'],
  },
  {
    key: 'module.analysis',
    kind: 'module',
    label: 'التحليل الذكي',
    description: 'تحليلات AI، الفني، الأساسي، المخاطر',
    routePrefixes: ['/ai-analysis', '/technical-analysis', '/technical-schools', '/risk-analysis', '/calculator', '/candlestick', '/fundamental-analysis', '/ai-assistant', '/ai-chatbot', '/portfolio-ai'],
  },
  {
    key: 'module.news',
    kind: 'module',
    label: 'الأخبار والمعلومات',
    description: 'الأخبار، الإجراءات المؤسسية، القاموس، المصادر',
    routePrefixes: ['/news', '/corporate-actions', '/earnings', '/dictionary', '/resources', '/market-actions'],
  },
  {
    key: 'module.learning',
    kind: 'module',
    label: 'التعلم',
    description: 'التأهيل وخريطة التداول',
    routePrefixes: ['/onboarding', '/trading-roadmap'],
  },
  {
    key: 'module.admin',
    kind: 'module',
    label: 'الإدارة',
    description: 'لوحة الإدارة والتنبيهات والنسخ الاحتياطي',
    routePrefixes: ['/admin', '/alerts', '/backup'],
  },
] as const satisfies readonly PermissionDefinition[];

const PAGE_PERMISSION_DEFINITIONS = [
  { key: 'page.home', kind: 'page', label: 'لوحة المعلومات', description: 'الصفحة الرئيسية', routePrefixes: ['/'] },
  { key: 'page.profile', kind: 'page', label: 'الملف الشخصي', description: 'صفحة الملف الشخصي', routePrefixes: ['/profile'] },
  { key: 'page.settings', kind: 'page', label: 'الإعدادات', description: 'صفحة الإعدادات', routePrefixes: ['/settings'] },
  { key: 'page.stocks-database', kind: 'page', label: 'قاعدة الأسهم والصناديق', description: 'صفحة قاعدة الأسهم والصناديق', routePrefixes: ['/stocks-database'] },
  { key: 'page.database', kind: 'page', label: 'قاعدة البيانات', description: 'صفحة قاعدة البيانات', routePrefixes: ['/database'] },
  { key: 'page.markets', kind: 'page', label: 'جميع الأسواق', description: 'صفحة جميع الأسواق', routePrefixes: ['/markets'] },
  { key: 'page.screener', kind: 'page', label: 'فلتر الأسهم', description: 'صفحة فلترة الأسهم', routePrefixes: ['/screener'] },
  { key: 'page.heatmap', kind: 'page', label: 'الخريطة الحرارية', description: 'صفحة الخريطة الحرارية', routePrefixes: ['/heatmap'] },
  { key: 'page.compare', kind: 'page', label: 'مقارنة الأسهم', description: 'صفحة مقارنة الأسهم', routePrefixes: ['/compare'] },
  { key: 'page.forex', kind: 'page', label: 'سوق العملات', description: 'صفحة سوق العملات', routePrefixes: ['/forex'] },
  { key: 'page.commodities', kind: 'page', label: 'السلع والمعادن', description: 'صفحة السلع والمعادن', routePrefixes: ['/commodities'] },
  { key: 'page.crypto', kind: 'page', label: 'العملات المشفرة', description: 'صفحة العملات المشفرة', routePrefixes: ['/crypto'] },
  { key: 'page.portfolios', kind: 'page', label: 'إدارة المحافظ', description: 'صفحة إدارة المحافظ', routePrefixes: ['/portfolios'] },
  { key: 'page.consolidated-portfolio', kind: 'page', label: 'تجميع المحافظ', description: 'صفحة تجميع المحافظ', routePrefixes: ['/consolidated-portfolio'] },
  { key: 'page.stocks', kind: 'page', label: 'الأسهم', description: 'صفحة الأسهم', routePrefixes: ['/stocks'] },
  { key: 'page.bonds', kind: 'page', label: 'السندات والصكوك', description: 'صفحة السندات والصكوك', routePrefixes: ['/bonds'] },
  { key: 'page.funds', kind: 'page', label: 'الصناديق', description: 'صفحة الصناديق', routePrefixes: ['/funds'] },
  { key: 'page.watchlist', kind: 'page', label: 'قائمة المتابعة', description: 'صفحة قائمة المتابعة', routePrefixes: ['/watchlist'] },
  { key: 'page.dividends', kind: 'page', label: 'التوزيعات', description: 'صفحة التوزيعات', routePrefixes: ['/dividends'] },
  { key: 'page.performance', kind: 'page', label: 'الأداء', description: 'صفحة أداء المحفظة', routePrefixes: ['/performance'] },
  { key: 'page.sell-history', kind: 'page', label: 'سجل البيع', description: 'صفحة سجل البيع', routePrefixes: ['/sell-history'] },
  { key: 'page.ai-analysis', kind: 'page', label: 'تحليل AI', description: 'صفحة التحليل بالذكاء الاصطناعي', routePrefixes: ['/ai-analysis'] },
  { key: 'page.technical-analysis', kind: 'page', label: 'التحليل الفني', description: 'صفحة التحليل الفني', routePrefixes: ['/technical-analysis'] },
  { key: 'page.technical-schools', kind: 'page', label: 'المدارس الفنية', description: 'صفحة استراتيجية المدارس الفنية الذكية', routePrefixes: ['/technical-schools'] },
  { key: 'page.risk-analysis', kind: 'page', label: 'تحليل المخاطر', description: 'صفحة تحليل المخاطر', routePrefixes: ['/risk-analysis'] },
  { key: 'page.calculator', kind: 'page', label: 'الحاسبة', description: 'صفحة الحاسبة', routePrefixes: ['/calculator'] },
  { key: 'page.candlestick', kind: 'page', label: 'الشموع اليابانية', description: 'صفحة الشموع اليابانية', routePrefixes: ['/candlestick'] },
  { key: 'page.fundamental-analysis', kind: 'page', label: 'التحليل الأساسي', description: 'صفحة التحليل الأساسي', routePrefixes: ['/fundamental-analysis'] },
  { key: 'page.news', kind: 'page', label: 'أخبار الأسواق', description: 'صفحة الأخبار', routePrefixes: ['/news'] },
  { key: 'page.corporate-actions', kind: 'page', label: 'الإجراءات المؤسسية', description: 'صفحة الإجراءات المؤسسية والأرباح', routePrefixes: ['/corporate-actions'] },
  { key: 'page.dictionary', kind: 'page', label: 'القاموس المالي', description: 'صفحة القاموس المالي', routePrefixes: ['/dictionary'] },
  { key: 'page.resources', kind: 'page', label: 'المصادر والروابط', description: 'صفحة المصادر والروابط', routePrefixes: ['/resources'] },
  { key: 'page.onboarding', kind: 'page', label: 'معالج البداية', description: 'صفحة معالج البداية', routePrefixes: ['/onboarding'] },
  { key: 'page.trading-roadmap', kind: 'page', label: 'خريطة المضاربة', description: 'صفحة خريطة المضاربة', routePrefixes: ['/trading-roadmap'] },
  { key: 'page.alerts', kind: 'page', label: 'التنبيهات', description: 'صفحة التنبيهات', routePrefixes: ['/alerts'] },
  { key: 'page.backup', kind: 'page', label: 'النسخ الاحتياطي', description: 'صفحة النسخ الاحتياطي', routePrefixes: ['/backup'] },
  { key: 'page.admin', kind: 'page', label: 'لوحة الإدارة', description: 'صفحة لوحة الإدارة', routePrefixes: ['/admin'] },
] as const satisfies readonly PermissionDefinition[];

export const PROJECT_PERMISSION_DEFINITIONS = [
  ...MODULE_PERMISSION_DEFINITIONS,
  ...PAGE_PERMISSION_DEFINITIONS,
] as const satisfies readonly PermissionDefinition[];

const PERMISSION_KEYS = PROJECT_PERMISSION_DEFINITIONS.map((definition) => definition.key) as readonly string[];
const PERMISSION_KEY_SET = new Set<string>(PERMISSION_KEYS);
const PERMISSION_DEFINITION_MAP = new Map<string, PermissionDefinition>(
  PROJECT_PERMISSION_DEFINITIONS.map((definition) => [definition.key, definition])
);

export type ProjectPermission = (typeof PERMISSION_KEYS)[number];

export interface AccessGroup {
  id: string;
  name: string;
  description: string;
  permissions: ProjectPermission[];
  deniedPaths: string[];
  isSystem?: boolean;
}

export interface AccessMember {
  userId: string;
  groupIds: string[];
  directPermissions: ProjectPermission[];
  deniedPaths: string[];
  isBlocked: boolean;
}

export interface AccessControlConfig {
  version: number;
  groups: AccessGroup[];
  members: AccessMember[];
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface AccessResolution {
  permissions: ProjectPermission[];
  routePrefixes: string[];
  deniedRoutePrefixes: string[];
  assignedGroupIds: string[];
  isBlocked: boolean;
}

const ALL_PERMISSION_KEYS: ProjectPermission[] = [...PERMISSION_KEYS] as ProjectPermission[];
const DEFAULT_USER_PERMISSIONS: ProjectPermission[] = ([
  'module.home',
  'module.markets',
  'module.portfolio',
  'module.analysis',
  'module.news',
  'module.learning',
] as const).filter((permission) => PERMISSION_KEY_SET.has(permission)) as ProjectPermission[];

const SYSTEM_GROUP_IDS = new Set(['group-super-admin', 'group-portfolio-manager', 'group-analyst', 'group-viewer']);
const SUPER_ADMIN_GROUP_ID = 'group-super-admin';

export const DEFAULT_ACCESS_GROUPS: AccessGroup[] = [
  {
    id: SUPER_ADMIN_GROUP_ID,
    name: 'مدير عام',
    description: 'صلاحيات كاملة على كل أقسام المشروع',
    permissions: [...ALL_PERMISSION_KEYS],
    deniedPaths: [],
    isSystem: true,
  },
  {
    id: 'group-portfolio-manager',
    name: 'مدير محافظ',
    description: 'يدير المحافظ والتحليلات بدون إعدادات الإدارة العليا',
    permissions: ['module.home', 'module.portfolio', 'module.analysis', 'module.news'],
    deniedPaths: [],
    isSystem: true,
  },
  {
    id: 'group-analyst',
    name: 'محلل سوق',
    description: 'يصل للأسواق، التحليل، الأخبار',
    permissions: ['module.home', 'module.markets', 'module.analysis', 'module.news'],
    deniedPaths: [],
    isSystem: true,
  },
  {
    id: 'group-viewer',
    name: 'مشاهد',
    description: 'صلاحيات قراءة أساسية',
    permissions: ['module.home', 'module.news'],
    deniedPaths: [],
    isSystem: true,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean))];
}

function normalizePath(path: string): string {
  if (!path) return '/';
  const stripped = path.split('?')[0].split('#')[0] || '/';
  if (stripped === '/') return '/';
  return stripped.endsWith('/') ? stripped.slice(0, -1) : stripped;
}

function matchPrefix(path: string, prefix: string): boolean {
  if (prefix === '/') return path === '/';
  return path === prefix || path.startsWith(`${prefix}/`);
}

function toPermissionArray(value: unknown): ProjectPermission[] {
  return toStringArray(value).filter(isProjectPermission) as ProjectPermission[];
}

function toDeniedPathArray(value: unknown): string[] {
  return toStringArray(value).map(normalizePath);
}

function ensureSuperAdminGroup(groups: AccessGroup[]): AccessGroup[] {
  const exists = groups.some((group) => group.id === SUPER_ADMIN_GROUP_ID);
  if (exists) {
    return groups.map((group) =>
      group.id === SUPER_ADMIN_GROUP_ID
        ? {
            ...group,
            permissions: [...ALL_PERMISSION_KEYS],
            deniedPaths: [],
            isSystem: true,
          }
        : group
    );
  }

  return [
    ...groups,
    {
      ...DEFAULT_ACCESS_GROUPS.find((group) => group.id === SUPER_ADMIN_GROUP_ID)!,
      permissions: [...ALL_PERMISSION_KEYS],
      deniedPaths: [],
      isSystem: true,
    },
  ];
}

function buildPathDeniedList(paths: readonly string[]): string[] {
  return [...new Set(paths.map(normalizePath))];
}

export function isProjectPermission(value: string): value is ProjectPermission {
  return PERMISSION_KEY_SET.has(value);
}

export function createDefaultAccessControlConfig(): AccessControlConfig {
  return {
    version: 1,
    groups: [...DEFAULT_ACCESS_GROUPS.map((group) => ({ ...group, permissions: [...group.permissions], deniedPaths: [...group.deniedPaths] }))],
    members: [],
    updatedAt: null,
    updatedBy: null,
  };
}

export function normalizeAccessControlConfig(raw: unknown): AccessControlConfig {
  const base = isRecord(raw) ? raw : {};
  const incomingGroups = Array.isArray(base.groups) ? base.groups : [];
  const incomingMembers = Array.isArray(base.members) ? base.members : [];

  const normalizedGroups: AccessGroup[] = [];
  const seenGroupIds = new Set<string>();

  for (let index = 0; index < incomingGroups.length; index += 1) {
    const row = incomingGroups[index];
    if (!isRecord(row)) continue;

    const id = normalizeString(row.id);
    if (!id || seenGroupIds.has(id)) continue;

    const isSystem = SYSTEM_GROUP_IDS.has(id) || Boolean(row.isSystem);
    const name = normalizeString(row.name, `مجموعة ${index + 1}`);
    const description = normalizeString(row.description, '');
    const permissions = toPermissionArray(row.permissions);
    const deniedPaths = toDeniedPathArray(row.deniedPaths);

    const normalized: AccessGroup = {
      id,
      name,
      description,
      permissions: permissions.length > 0 ? permissions : ['module.home'],
      deniedPaths,
      isSystem,
    };

    if (id === SUPER_ADMIN_GROUP_ID) {
      normalized.permissions = [...ALL_PERMISSION_KEYS];
      normalized.deniedPaths = [];
      normalized.isSystem = true;
    }

    normalizedGroups.push(normalized);
    seenGroupIds.add(id);
  }

  const groupsWithSuperAdmin = ensureSuperAdminGroup(normalizedGroups);
  const validGroupIds = new Set(groupsWithSuperAdmin.map((group) => group.id));
  const normalizedMembers: AccessMember[] = [];
  const seenMemberIds = new Set<string>();

  for (const row of incomingMembers) {
    if (!isRecord(row)) continue;
    const userId = normalizeString(row.userId);
    if (!userId || seenMemberIds.has(userId)) continue;

    const groupIds = toStringArray(row.groupIds).filter((groupId) => validGroupIds.has(groupId));
    const directPermissions = toPermissionArray(row.directPermissions);
    const deniedPaths = toDeniedPathArray(row.deniedPaths);
    const isBlocked = Boolean(row.isBlocked);

    normalizedMembers.push({
      userId,
      groupIds,
      directPermissions,
      deniedPaths,
      isBlocked,
    });
    seenMemberIds.add(userId);
  }

  return {
    version: 1,
    groups: groupsWithSuperAdmin,
    members: normalizedMembers,
    updatedAt: typeof base.updatedAt === 'string' ? base.updatedAt : null,
    updatedBy: typeof base.updatedBy === 'string' ? base.updatedBy : null,
  };
}

export async function loadAccessControlConfig(): Promise<AccessControlConfig> {
  const setting = await db.setting.findUnique({ where: { key: ACCESS_CONTROL_SETTING_KEY } });
  if (!setting) return createDefaultAccessControlConfig();
  return normalizeAccessControlConfig(setting.value);
}

export async function saveAccessControlConfig(input: Pick<AccessControlConfig, 'groups' | 'members'>, updatedBy: string): Promise<AccessControlConfig> {
  const normalized = normalizeAccessControlConfig({
    version: 1,
    groups: input.groups,
    members: input.members,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });

  await db.setting.upsert({
    where: { key: ACCESS_CONTROL_SETTING_KEY },
    create: {
      key: ACCESS_CONTROL_SETTING_KEY,
      value: normalized as unknown as Prisma.InputJsonValue,
      description: 'Admin access control groups and members',
    },
    update: {
      value: normalized as unknown as Prisma.InputJsonValue,
      description: 'Admin access control groups and members',
    },
  });

  return normalized;
}

export function buildAllowedRoutePrefixes(permissions: readonly ProjectPermission[]): string[] {
  const prefixes = new Set<string>(['/profile', '/settings']);

  for (const permission of permissions) {
    const definition = PERMISSION_DEFINITION_MAP.get(permission);
    if (!definition) continue;
    for (const route of definition.routePrefixes) {
      prefixes.add(normalizePath(route));
    }
  }

  return [...prefixes];
}

export function isPathAllowed(path: string, routePrefixes: readonly string[], deniedRoutePrefixes: readonly string[] = []): boolean {
  const normalizedPath = normalizePath(path);
  const allowed = routePrefixes.some((prefix) => matchPrefix(normalizedPath, normalizePath(prefix)));
  if (!allowed) return false;
  const denied = deniedRoutePrefixes.some((prefix) => matchPrefix(normalizedPath, normalizePath(prefix)));
  return !denied;
}

export function resolveUserAccess(
  user: { id: string; role: string },
  config: AccessControlConfig
): AccessResolution {
  if (user.role === 'admin') {
    const permissions = [...ALL_PERMISSION_KEYS];
    return {
      permissions,
      routePrefixes: buildAllowedRoutePrefixes(permissions),
      deniedRoutePrefixes: [],
      assignedGroupIds: [SUPER_ADMIN_GROUP_ID],
      isBlocked: false,
    };
  }

  const member = config.members.find((entry) => entry.userId === user.id);
  if (member?.isBlocked) {
    const minimal: ProjectPermission[] = ['module.home'];
    return {
      permissions: minimal,
      routePrefixes: buildAllowedRoutePrefixes(minimal),
      deniedRoutePrefixes: [],
      assignedGroupIds: [],
      isBlocked: true,
    };
  }

  const groupMap = new Map<string, AccessGroup>(config.groups.map((group) => [group.id, group]));
  const assignedGroupIds = member?.groupIds ?? [];
  const groupPermissions = assignedGroupIds.flatMap((groupId) => groupMap.get(groupId)?.permissions ?? []);
  const groupDeniedPaths = assignedGroupIds.flatMap((groupId) => groupMap.get(groupId)?.deniedPaths ?? []);
  const directPermissions = member?.directPermissions ?? [];
  const directDeniedPaths = member?.deniedPaths ?? [];

  const mergedPermissions = [...new Set<ProjectPermission>([...groupPermissions, ...directPermissions])];
  const permissions = mergedPermissions.length > 0 ? mergedPermissions : [...DEFAULT_USER_PERMISSIONS];
  const deniedRoutePrefixes = buildPathDeniedList([...groupDeniedPaths, ...directDeniedPaths]);

  return {
    permissions,
    routePrefixes: buildAllowedRoutePrefixes(permissions),
    deniedRoutePrefixes,
    assignedGroupIds,
    isBlocked: false,
  };
}

export function getPermissionCatalog() {
  return PROJECT_PERMISSION_DEFINITIONS.map((item) => ({
    key: item.key,
    kind: item.kind,
    label: item.label,
    description: item.description,
    routePrefixes: [...item.routePrefixes],
  }));
}

export function getPageRouteOptions() {
  return PAGE_PERMISSION_DEFINITIONS.map((item) => ({
    key: item.key,
    label: item.label,
    path: item.routePrefixes[0] || '/',
  }));
}
