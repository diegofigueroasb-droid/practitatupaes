import { NextResponse } from "next/server";

export async function GET() {
  const questions = {
    'Matematica M1': [
      { id: 'm1-1', subject: 'Matematica M1', prompt: 'Si 3x + 7 = 22, ¿cuál es el valor de x?', alternatives: [{ key: 'A', text: '3' }, { key: 'B', text: '5' }, { key: 'C', text: '7' }, { key: 'D', text: '15' }, { key: 'E', text: '29' }], correctAlternative: 'B', explanationsByAlternative: { A: 'Incorrecto', B: 'Correcto', C: 'Incorrecto' } },
    ],
    'Matematica M2': [],
    'Historia': [],
    'Ciencias': [],
  };
  
  return NextResponse.json(questions);
}