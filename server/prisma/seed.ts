import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const noteTemplates = {
  high: [
    'Really energized today — great project momentum.',
    'Crushing it. Confidence is high.',
    'Strong week. Clear sense of direction.',
    'Feels like everything is clicking right now.',
    'Great energy in our 1:1 today.',
    'Excited about the new initiative.',
    'Team is rallying well around the roadmap.',
  ],
  mid: [
    'Steady. Nothing major to flag.',
    'Bit tired but managing fine.',
    'Good conversation. Some minor frustrations with process.',
    'Solid week overall.',
    'Working through some ambiguity but staying positive.',
    'Things feel stable.',
  ],
  low: [
    'Seems drained — worth checking in again next week.',
    'Mentioned feeling overwhelmed with workload.',
    'Less engaged than usual. Digging into why.',
    'Flagged some concerns about team dynamics.',
    'Visibly stressed. Put extra support measures in place.',
    'Expressed frustration with unclear priorities.',
  ],
};

function pickNote(score: number): string | null {
  if (Math.random() > 0.4) return null;
  if (score >= 8) return noteTemplates.high[Math.floor(Math.random() * noteTemplates.high.length)];
  if (score >= 5) return noteTemplates.mid[Math.floor(Math.random() * noteTemplates.mid.length)];
  return noteTemplates.low[Math.floor(Math.random() * noteTemplates.low.length)];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function baseScore(): number {
  // Weighted toward 5-8 with occasional outliers
  const roll = Math.random();
  if (roll < 0.05) return clamp(Math.round(3 + Math.random()), 1, 4);   // 5% dip
  if (roll < 0.10) return 9 + (Math.random() < 0.5 ? 1 : 0);           // 5% high
  return clamp(Math.round(5 + Math.random() * 3), 5, 8);                // 90% normal
}

interface EntrySpec {
  trend?: 'down' | 'up';
  daysOfHistory?: number;
}

function generateEntries(
  memberId: string,
  managerId: string,
  spec: EntrySpec = {}
): Array<{
  team_member_id: string;
  logged_by_user_id: string;
  score: number;
  notes: string | null;
  interaction_date: Date;
}> {
  const { trend, daysOfHistory = 90 } = spec;
  const entries = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let daysAgo = daysOfHistory; daysAgo >= 0; daysAgo--) {
    // ~65% chance of an entry on any given day
    if (Math.random() > 0.65) continue;

    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    let score: number;
    if (trend === 'down' && daysAgo <= 14) {
      // Clear downward trend: starts around 7, ends around 3
      const progress = (14 - daysAgo) / 14; // 0 → 1
      score = clamp(Math.round(7 - progress * 4 + (Math.random() * 1.5 - 0.75)), 1, 10);
    } else if (trend === 'up' && daysAgo <= 14) {
      // Clear upward trend: starts around 3, ends around 8
      const progress = (14 - daysAgo) / 14;
      score = clamp(Math.round(3 + progress * 5 + (Math.random() * 1.5 - 0.75)), 1, 10);
    } else {
      score = baseScore();
    }

    entries.push({
      team_member_id: memberId,
      logged_by_user_id: managerId,
      score,
      notes: pickNote(score),
      interaction_date: date,
    });
  }

  return entries;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean slate
  await prisma.happinessEntry.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash('password', SALT_ROUNDS);

  // Company
  const company = await prisma.company.create({
    data: { name: 'Acme Corp' },
  });

  // Executive
  await prisma.user.create({
    data: {
      company_id: company.id,
      name: 'Executive User',
      email: 'exec@acme.com',
      password_hash: passwordHash,
      role: 'executive',
    },
  });

  // Managers
  const manager1 = await prisma.user.create({
    data: {
      company_id: company.id,
      name: 'Alex Rivera',
      email: 'manager1@acme.com',
      password_hash: passwordHash,
      role: 'manager',
    },
  });
  const manager2 = await prisma.user.create({
    data: {
      company_id: company.id,
      name: 'Sam Chen',
      email: 'manager2@acme.com',
      password_hash: passwordHash,
      role: 'manager',
    },
  });
  const manager3 = await prisma.user.create({
    data: {
      company_id: company.id,
      name: 'Jordan Lee',
      email: 'manager3@acme.com',
      password_hash: passwordHash,
      role: 'manager',
    },
  });

  // Teams
  const team1 = await prisma.team.create({
    data: { company_id: company.id, manager_id: manager1.id, name: 'Product Alpha' },
  });
  const team2 = await prisma.team.create({
    data: { company_id: company.id, manager_id: manager2.id, name: 'Engineering Beta' },
  });
  const team3 = await prisma.team.create({
    data: { company_id: company.id, manager_id: manager3.id, name: 'Design & UX' },
  });

  // Team members — global index matters for trends
  // Member #1 (team1, index 0)
  const m1 = await prisma.teamMember.create({
    data: { team_id: team1.id, name: 'Alice Park', email: 'alice@acme.com' },
  });
  // Member #2 (team1, index 1) — DOWNWARD TREND
  const m2 = await prisma.teamMember.create({
    data: { team_id: team1.id, name: 'Bob Nguyen', email: 'bob@acme.com' },
  });
  // Member #3
  const m3 = await prisma.teamMember.create({
    data: { team_id: team1.id, name: 'Carol Smith' },
  });
  // Member #4
  const m4 = await prisma.teamMember.create({
    data: { team_id: team1.id, name: 'David Kim', email: 'david@acme.com' },
  });

  // Member #5 (team2, index 0)
  const m5 = await prisma.teamMember.create({
    data: { team_id: team2.id, name: 'Eve Johnson', email: 'eve@acme.com' },
  });
  // Member #6 (team2, index 1) — UPWARD TREND
  const m6 = await prisma.teamMember.create({
    data: { team_id: team2.id, name: 'Frank Torres', email: 'frank@acme.com' },
  });
  // Member #7
  const m7 = await prisma.teamMember.create({
    data: { team_id: team2.id, name: 'Grace Wu' },
  });
  // Member #8
  const m8 = await prisma.teamMember.create({
    data: { team_id: team2.id, name: 'Henry Okafor', email: 'henry@acme.com' },
  });

  // Member #9 (team3)
  const m9 = await prisma.teamMember.create({
    data: { team_id: team3.id, name: 'Iris Patel', email: 'iris@acme.com' },
  });
  // Member #10
  const m10 = await prisma.teamMember.create({
    data: { team_id: team3.id, name: 'Jake Martinez' },
  });
  // Member #11
  const m11 = await prisma.teamMember.create({
    data: { team_id: team3.id, name: 'Kate Brown', email: 'kate@acme.com' },
  });

  // Generate happiness entries
  const allEntries = [
    ...generateEntries(m1.id, manager1.id),
    ...generateEntries(m2.id, manager1.id, { trend: 'down' }),  // Member #2: downward
    ...generateEntries(m3.id, manager1.id),
    ...generateEntries(m4.id, manager1.id),
    ...generateEntries(m5.id, manager2.id),
    ...generateEntries(m6.id, manager2.id, { trend: 'up' }),   // Member #6: upward
    ...generateEntries(m7.id, manager2.id),
    ...generateEntries(m8.id, manager2.id),
    ...generateEntries(m9.id, manager3.id),
    ...generateEntries(m10.id, manager3.id),
    ...generateEntries(m11.id, manager3.id),
  ];

  await prisma.happinessEntry.createMany({ data: allEntries });

  console.log(`✅ Seeded:`);
  console.log(`   1 company: Acme Corp`);
  console.log(`   1 executive: exec@acme.com / password`);
  console.log(`   3 managers: manager1–3@acme.com / password`);
  console.log(`   11 team members across 3 teams`);
  console.log(`   ${allEntries.length} happiness entries (90 days)`);
  console.log(`   Bob Nguyen (member #2): ↓ downward trend last 14 days`);
  console.log(`   Frank Torres (member #6): ↑ upward trend last 14 days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
