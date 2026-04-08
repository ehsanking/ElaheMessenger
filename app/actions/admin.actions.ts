'use server';

import {
  addReportModeratorNote as origAddReportModeratorNote,
  applyModerationAction as origApplyModerationAction,
  exportSystemData as origExportSystemData,
  getAdminSettings as origGetAdminSettings,
  getAllReports as origGetAllReports,
  getAllUsers as origGetAllUsers,
  getAuditLogs as origGetAuditLogs,
  getManagerKpis as origGetManagerKpis,
  getReportActionHistory as origGetReportActionHistory,
  getSystemOverview as origGetSystemOverview,
  resolveReport as origResolveReport,
  toggleBanUser as origToggleBanUser,
  updateAdminSettings as origUpdateAdminSettings,
  updateUserBadges as origUpdateUserBadges,
} from './admin';

export async function getAllUsers(...args: Parameters<typeof origGetAllUsers>) {
  return origGetAllUsers(...args);
}

export async function toggleBanUser(...args: Parameters<typeof origToggleBanUser>) {
  return origToggleBanUser(...args);
}

export async function updateUserBadges(...args: Parameters<typeof origUpdateUserBadges>) {
  return origUpdateUserBadges(...args);
}

export async function getAdminSettings(...args: Parameters<typeof origGetAdminSettings>) {
  return origGetAdminSettings(...args);
}

export async function updateAdminSettings(...args: Parameters<typeof origUpdateAdminSettings>) {
  return origUpdateAdminSettings(...args);
}

export async function getAuditLogs(...args: Parameters<typeof origGetAuditLogs>) {
  return origGetAuditLogs(...args);
}

export async function exportSystemData(...args: Parameters<typeof origExportSystemData>) {
  return origExportSystemData(...args);
}

export async function getAllReports(...args: Parameters<typeof origGetAllReports>) {
  return origGetAllReports(...args);
}

export async function getReportActionHistory(...args: Parameters<typeof origGetReportActionHistory>) {
  return origGetReportActionHistory(...args);
}

export async function resolveReport(...args: Parameters<typeof origResolveReport>) {
  return origResolveReport(...args);
}

export async function addReportModeratorNote(...args: Parameters<typeof origAddReportModeratorNote>) {
  return origAddReportModeratorNote(...args);
}

export async function applyModerationAction(...args: Parameters<typeof origApplyModerationAction>) {
  return origApplyModerationAction(...args);
}

export async function getManagerKpis(...args: Parameters<typeof origGetManagerKpis>) {
  return origGetManagerKpis(...args);
}

export async function getSystemOverview(...args: Parameters<typeof origGetSystemOverview>) {
  return origGetSystemOverview(...args);
}
