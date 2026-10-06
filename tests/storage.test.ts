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
    storage('{"broken":{"time":-4},"valid":{"time":25,"crystals":7,"falls":0}}');
    expect(Object.keys(loadRecords())).toEqual(['valid']);
  });
  it('retains a faster previous run and updates a new best', () => {
    storage();
    saveRecord('cloud-gardens', { time: 35, crystals: 7, falls: 0 });
    expect(saveRecord('cloud-gardens', { time: 50, crystals: 4, falls: 2 }).isBest).toBe(false);
    expect(loadRecords()['cloud-gardens'].time).toBe(35);
    expect(saveRecord('cloud-gardens', { time: 30, crystals: 6, falls: 0 }).isBest).toBe(true);
    expect(loadRecords()['cloud-gardens'].time).toBe(30);
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
    expect(saveRecord('cloud-gardens', { time: 35, crystals: 7, falls: 0 }).saved).toBe(false);
  });
});
