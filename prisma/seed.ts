import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding questions...');

  await prisma.question.deleteMany();

  const questions = [
    {
      subject: 'Comprension Lectora',
      prompt: '¿Cuál es la idea principal del texto sobre el cambio climático?',
      alternatives: [
        { key: 'A', text: 'El cambio climático solo afecta a los polos' },
        { key: 'B', text: 'Las actividades humanas son la causa principal del calentamiento global' },
        { key: 'C', text: 'El clima siempre ha cambiado naturalmente' },
        { key: 'D', text: 'Los animales son los más afectados' },
        { key: 'E', text: 'No hay consenso científico sobre el tema' },
      ],
      correctAlternative: 'B',
      explanationsByAlternative: {
        A: 'Incorrecto. El cambio climático afecta a todo el planeta.',
        B: 'Correcto. Las emisiones de gases de efecto invernadero son la causa principal.',
        C: 'Incorrecto. La rapidez actual es antropogénica.',
        D: 'Incorrecto. El impacto es global.',
        E: 'Incorrecto. Hay amplio consenso científico.',
      },
    },
    {
      subject: 'Matematica M1',
      prompt: 'Si 3x + 7 = 22, ¿cuál es el valor de x?',
      alternatives: [
        { key: 'A', text: '3' },
        { key: 'B', text: '5' },
        { key: 'C', text: '7' },
        { key: 'D', text: '15' },
        { key: 'E', text: '29' },
      ],
      correctAlternative: 'B',
      explanationsByAlternative: {
        A: 'Incorrecto. 3(3) + 7 = 16 ≠ 22',
        B: 'Correcto. 3(5) + 7 = 15 + 7 = 22',
        C: 'Incorrecto. 3(7) + 7 = 28 ≠ 22',
        D: 'Incorrecto. 3(15) + 7 = 52 ≠ 22',
        E: 'Incorrecto. 3(29) + 7 = 94 ≠ 22',
      },
    },
    {
      subject: 'Matematica M2',
      prompt: '¿Cuál es el valor de log₂(8)?',
      alternatives: [
        { key: 'A', text: '1' },
        { key: 'B', text: '2' },
        { key: 'C', text: '3' },
        { key: 'D', text: '8' },
        { key: 'E', text: '16' },
      ],
      correctAlternative: 'C',
      explanationsByAlternative: {
        A: 'Incorrecto. log₂(2) = 1',
        B: 'Incorrecto. log₂(4) = 2',
        C: 'Correcto. 2³ = 8',
        D: 'Incorrecto. log₂(8) = 3, no 8',
        E: 'Incorrecto. log₂(16) = 4',
      },
    },
    {
      subject: 'Historia',
      prompt: '¿En qué año occurred el golpe de Estado en Chile?',
      alternatives: [
        { key: 'A', text: '1970' },
        { key: 'B', text: '1971' },
        { key: 'C', text: '1972' },
        { key: 'D', text: '1973' },
        { key: 'E', text: '1974' },
      ],
      correctAlternative: 'D',
      explanationsByAlternative: {
        A: 'Incorrecto. 1970 fue la elección de Allende.',
        B: 'Incorrecto. 1971 fue el primer año del gobierno de Allende.',
        C: 'Incorrecto.',
        D: 'Correcto. El golpe fue el 11 de septiembre de 1973.',
        E: 'Incorrecto.',
      },
    },
    {
      subject: 'Ciencias',
      prompt: '¿Cuál es la fórmula química del agua?',
      alternatives: [
        { key: 'A', text: 'CO₂' },
        { key: 'B', text: 'H₂O' },
        { key: 'C', text: 'NaCl' },
        { key: 'D', text: 'O₂' },
        { key: 'E', text: 'H₂' },
      ],
      correctAlternative: 'B',
      explanationsByAlternative: {
        A: 'Incorrecto. CO₂ es dióxido de carbono.',
        B: 'Correcto. H₂O es la fórmula del agua.',
        C: 'Incorrecto. NaCl es cloruro de sodio (sal).',
        D: 'Incorrecto. O₂ es oxígeno molecular.',
        E: 'Incorrecto. H₂ es hidrógeno molecular.',
      },
    },
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log(`Seeded ${questions.length} questions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
