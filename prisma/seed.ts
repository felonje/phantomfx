import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { INSTRUMENTS } from "../src/lib/instruments";
import { createDefaultAccounts } from "../src/server/accounts";

const prisma = new PrismaClient();

async function main() {
  for (const [i, inst] of INSTRUMENTS.entries()) {
    await prisma.instrument.upsert({
      where: { symbol: inst.symbol },
      update: {},
      create: {
        symbol: inst.symbol,
        description: inst.description,
        digits: inst.digits,
        pipSize: inst.pipSize,
        spreadPips: inst.spreadPips,
        sort: i,
      },
    });
  }
  console.log(`Seeded ${INSTRUMENTS.length} instruments`);

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin user");
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    console.log(`Admin ${email} already exists`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, name: "Administrator", passwordHash, role: "ADMIN", emailVerifiedAt: new Date(), termsAcceptedAt: new Date() } });
    await createDefaultAccounts(tx, user.id);
  });
  console.log(`Created admin ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
