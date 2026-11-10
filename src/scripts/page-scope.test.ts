import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createScope } from './page-scope.ts';

// Node has no requestAnimationFrame: a fake that queues callbacks until flush()
const queued = new Map<number, FrameRequestCallback>();
let nextId = 1;
globalThis.requestAnimationFrame = (cb) => (queued.set(nextId, cb), nextId++);
globalThis.cancelAnimationFrame = (id) => void queued.delete(id);
const flush = () => [...queued].forEach(([id, cb]) => (queued.delete(id), cb(0)));

test('cleanups run in reverse order', () => {
  const scope = createScope();
  const order: number[] = [];
  scope.add(() => order.push(1));
  scope.add(() => order.push(2));
  scope.add(() => order.push(3));
  scope.dispose();
  assert.deepEqual(order, [3, 2, 1]);
});

test('a throwing cleanup does not stop the others', () => {
  const error = mock.method(console, 'error', () => {});
  const scope = createScope();
  const ran: string[] = [];
  scope.add(() => ran.push('a'));
  scope.add(() => {
    throw new Error('boom');
  });
  scope.add(() => ran.push('c'));
  scope.dispose();
  assert.deepEqual(ran, ['c', 'a']);
  assert.equal(error.mock.callCount(), 1);
  error.mock.restore();
});

test('dispose is idempotent', () => {
  const scope = createScope();
  let runs = 0;
  scope.add(() => runs++);
  scope.dispose();
  scope.dispose();
  assert.equal(runs, 1);
});

test('the signal aborts on dispose, and a listener on it is removed', () => {
  const scope = createScope();
  const target = new EventTarget();
  let calls = 0;
  target.addEventListener('ping', () => calls++, { signal: scope.signal });
  target.dispatchEvent(new Event('ping'));
  assert.equal(scope.signal.aborted, false);
  scope.dispose();
  assert.equal(scope.signal.aborted, true);
  target.dispatchEvent(new Event('ping'));
  assert.equal(calls, 1);
});

test('frames still pending are cancelled on dispose; none start after it', () => {
  const scope = createScope();
  let ran = 0;
  scope.frame(() => ran++);
  flush();
  assert.equal(ran, 1);
  scope.frame(() => ran++);
  scope.dispose();
  scope.frame(() => ran++);
  flush();
  assert.equal(ran, 1);
});

test('a cleanup added after dispose runs at once', () => {
  const scope = createScope();
  scope.dispose();
  let ran = false;
  scope.add(() => (ran = true));
  assert.equal(ran, true);
});
