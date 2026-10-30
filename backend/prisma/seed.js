// Seed: apenas materiais e regiões administrativas. NÃO cria pontos de coleta.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/utils/text.js';

const prisma = new PrismaClient();

const materials = [
  { slug: 'pilhas', name: 'Pilhas', description: 'Pilhas comuns e alcalinas usadas.', icon: 'battery', color: '#8B5CF6' },
  { slug: 'baterias', name: 'Baterias', description: 'Baterias de celular, notebook e similares.', icon: 'battery-charging', color: '#8B5CF6' },
  { slug: 'oleo-vegetal', name: 'Óleo vegetal', description: 'Óleo de cozinha usado.', icon: 'droplet', color: '#00D9FF' }
];

// Lista pedida no briefing + RAs adicionais do DF (podem ser editadas/removidas).
const regions = [
  'Brasília', 'Águas Claras', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Gama', 'Guará',
  'Sobradinho', 'Planaltina', 'Recanto das Emas', 'Santa Maria', 'São Sebastião',
  'Vicente Pires', 'Riacho Fundo', 'Núcleo Bandeirante', 'Cruzeiro', 'Sudoeste/Octogonal',
  'Lago Sul', 'Lago Norte', 'Paranoá', 'Itapoã', 'Estrutural', 'Fercal', 'Varjão',
  'Candangolândia', 'Brazlândia', 'Park Way', 'Jardim Botânico', 'Arniqueira',
  'Sol Nascente/Pôr do Sol',
  // adicionais
  'Sobradinho II', 'Riacho Fundo II', 'SIA', 'Arapoanga', 'Água Quente'
];

for (const m of materials) {
  await prisma.material.upsert({ where: { slug: m.slug }, update: m, create: m });
}
for (const name of regions) {
  const slug = slugify(name);
  await prisma.region.upsert({ where: { slug }, update: { name }, create: { name, slug } });
}
console.log(`Seed ok: ${materials.length} materiais, ${regions.length} regiões.`);
await prisma.$disconnect();
