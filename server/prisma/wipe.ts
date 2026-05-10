import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipe() {
  console.log('Wiping database...');

  const entries = await prisma.happinessEntry.deleteMany();
  console.log(`Deleted ${entries.count} happiness entries`);

  const tokens = await prisma.refreshToken.deleteMany();
  console.log(`Deleted ${tokens.count} refresh tokens`);

  const invites = await prisma.invite.deleteMany();
  console.log(`Deleted ${invites.count} invites`);

  const members = await prisma.teamMember.deleteMany();
  console.log(`Deleted ${members.count} team members`);

  const teams = await prisma.team.deleteMany();
  console.log(`Deleted ${teams.count} teams`);

  // Break circular FK: Company.created_by_user_id → User
  await prisma.company.updateMany({ data: { created_by_user_id: null } });

  const users = await prisma.user.deleteMany();
  console.log(`Deleted ${users.count} users`);

  const companies = await prisma.company.deleteMany();
  console.log(`Deleted ${companies.count} companies`);

  console.log('Done. Database is empty.');
}

wipe()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
