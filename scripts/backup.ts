import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = process.env.BACKUP_OUTPUT_DIR || path.join(process.cwd(), 'backups');
const outputPath = path.join(outputDir, `backup-${timestamp}.json`);

const runBackup = async () => {
  try {
    await mkdir(outputDir, { recursive: true });

    const [users, settings, reports, auditLogs] = await Promise.all([
      prisma.user.findMany(),
      prisma.adminSettings.findMany(),
      prisma.report.findMany(),
      prisma.auditLog.findMany(),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      users,
      settings,
      reports,
      auditLogs,
    };

    await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`Backup saved to ${outputPath}`);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

void runBackup();
