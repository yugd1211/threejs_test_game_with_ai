import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadRecords, saveRecord } from '../src/storage';
afterEach(() => vi.unstubAllGlobals());
function storage(initial = '{}') {
  let value = initial;
  vi.stubGlobal('localStorage', {
    getItem: () => value,
    setItem: (_: string, next: string) => {
      value = next;
    },
  });
}
describe('best records', () => {
  it('recovers from invalid JSON and filters malformed records', () => {
    storage('not json');
    expect(loadRecords()).toEqual({});
    storage('{"broken":{"time":-4},"v2-moonlight-run":{"time":25,"crystals":7,"falls":0}}');
    expect(Object.keys(loadRecords())).toEqual(['v2-moonlight-run']);
  });
  it('retains a faster previous run and updates a new best', () => {
    storage();
    saveRecord('v2-moonlight-run', { time: 35, crystals: 7, falls: 0 });
    expect(saveRecord('v2-moonlight-run', { time: 50, crystals: 4, falls: 2 }).isBest).toBe(false);
    expect(loadRecords()['v2-moonlight-run'].time).toBe(35);
    expect(saveRecord('v2-moonlight-run', { time: 30, crystals: 6, falls: 0 }).isBest).toBe(true);
    expect(loadRecords()['v2-moonlight-run'].time).toBe(30);
  });
  it('reports blocked storage without interrupting completion', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    });
    expect(loadRecords()).toEqual({});
    expect(saveRecord('v2-moonlight-run', { time: 35, crystals: 7, falls: 0 }).saved).toBe(false);
  });
});

describe('expanded course records', () => {
  it('persists more than seven crystals in the final course', () => {
    storage();
    saveRecord('v2-summit-trial', { time: 80, crystals: 17, falls: 3 });
    expect(loadRecords()['v2-summit-trial'].crystals).toBe(17);
  });
  it('rejects crystal counts outside the selected course and unknown level ids', () => {
    storage(
      '{"v2-moonlight-run":{"time":20,"crystals":8,"falls":0},"missing":{"time":20,"crystals":2,"falls":0}}',
    );
    expect(loadRecords()).toEqual({});
  });
});
