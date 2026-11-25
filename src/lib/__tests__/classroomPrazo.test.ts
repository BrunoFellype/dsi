import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarPrazoISO } from '../classroomApi';

test('prazo do Classroom vem em UTC e vira instante exato', () => {
  assert.equal(
    formatarPrazoISO({ year: 2026, month: 10, day: 26 }, { hours: 2, minutes: 59 }),
    '2026-10-26T02:59:00.000Z'
  );
  // dueTime sem minutos = hora cheia
  assert.equal(formatarPrazoISO({ year: 2026, month: 10, day: 25 }, { hours: 17 }), '2026-10-25T17:00:00.000Z');
});

test('só data: vale até 23:59 de Brasília; sem data não há prazo', () => {
  assert.equal(formatarPrazoISO({ year: 2026, month: 10, day: 25 }), '2026-10-26T02:59:00.000Z');
  assert.equal(formatarPrazoISO(undefined, { hours: 10 }), undefined);
});
