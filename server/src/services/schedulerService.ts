import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { calculateTrend } from './trendService.js';
import { sendWeeklyDigest } from './emailService.js';

const prisma = new PrismaClient();

async function runWeeklyDigest() {
  console.log('[Scheduler] Running weekly digest...');

  const managers = await prisma.user.findMany({
    where: { role: 'manager' },
    include: {
      teams: {
        include: {
          members: {
            where: { archived_at: null },
            include: {
              entries: {
                where: {
                  interaction_date: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
                },
              },
            },
          },
        },
      },
    },
  });

  for (const manager of managers) {
    for (const team of manager.teams) {
      const allScores = team.members.flatMap((m) => m.entries.map((e) => e.score));
      const teamAvg =
        allScores.length > 0 ? allScores.reduce((s, v) => s + v, 0) / allScores.length : 0;

      const membersAtRisk = team.members
        .map((m) => {
          const trend = calculateTrend(m.id, m.entries);
          const recent = trend.recentAvg ?? 0;
          return { name: m.name, avg: recent, trend: trend.trend };
        })
        .filter((m) => m.trend === 'down' || m.avg < 5);

      const now = new Date();
      const period = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      await sendWeeklyDigest({
        managerName: manager.name,
        managerEmail: manager.email,
        teamName: team.name,
        period,
        teamAvg,
        membersAtRisk,
      });
    }
  }

  console.log('[Scheduler] Weekly digest complete.');
}

export function startScheduler() {
  // Every Monday at 7am
  cron.schedule('0 7 * * 1', runWeeklyDigest, { timezone: 'America/New_York' });
  console.log('[Scheduler] Weekly digest scheduled for Mondays at 7am ET');
}
