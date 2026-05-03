import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@track.art';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Admin déjà existant : ${email}`);
  } else {
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, password: hash } });
    console.log(`✓ Admin créé : ${email}`);
    console.log(`  Mot de passe : ${password}`);
    console.log(`\n  ⚠️  Changez ce mot de passe après la première connexion.\n`);
  }

  const settings = await prisma.settings.findFirst();
  if (!settings) {
    await prisma.settings.create({ data: {} });
    console.log('✓ Settings par défaut créés (extension: 5€/7j, photo extra: 2€)');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
