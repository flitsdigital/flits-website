import { test } from 'node:test';
import assert from 'node:assert/strict';
import { radiusFor, arcPosition, wrapCentered, stepFor, rescaleOffset } from './radial-geometry.ts';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≈ ${b}`);

test('one step along the arc tilts exactly the requested angle', () => {
  const r = radiusFor(474, 10);
  const right = arcPosition(474, r, 'arch');
  close(right.rotation, 10);
  close(arcPosition(-474, r, 'arch').rotation, -10);
  assert.ok(right.y > 0, 'arch: neighbours sit lower than the centre');
  assert.ok(arcPosition(474, r, 'valley').y < 0, 'valley: neighbours sit higher');
  close(arcPosition(474, r, 'valley').rotation, -10);
});

test('centre item sits at the origin, untilted', () => {
  assert.deepEqual(arcPosition(0, 1000, 'arch'), { x: 0, y: 0, rotation: 0 });
});

test('wrapCentered keeps positions in [-len/2, len/2)', () => {
  assert.equal(wrapCentered(0, 100), 0);
  assert.equal(wrapCentered(60, 100), -40);
  assert.equal(wrapCentered(-60, 100), 40);
  assert.equal(wrapCentered(250, 100), -50);
});

test('angle 0 is a straight, untilted row', () => {
  const r = radiusFor(477, 0);
  assert.deepEqual(arcPosition(477, r, 'arch'), { x: 477, y: 0, rotation: 0 });
  assert.deepEqual(arcPosition(-954, r, 'valley'), { x: -954, y: 0, rotation: 0 });
});

test('stepFor keeps the same visible gap however much the neighbour tilts', () => {
  assert.equal(stepFor(400, 500, 96, 0), 496);
  // neighbour tilted 18°: its bounding box is wider, so the step grows by exactly that much
  const tilted = stepFor(400, 500, 96, 18);
  const neighbourHalf = (400 * Math.cos(Math.PI / 10) + 500 * Math.sin(Math.PI / 10)) / 2;
  close(tilted, 200 + neighbourHalf + 96);
});

test('rescaleOffset keeps the same item centred when the spacing changes', () => {
  // three steps on at 400px spacing is three steps on at 500px
  assert.deepEqual(rescaleOffset(-1200, 400, 500), { offset: -1500, target: -1500 });
  // mid-drift (2.75 steps): the offset keeps its fraction, the target snaps to the nearest item
  assert.deepEqual(rescaleOffset(-1100, 400, 500), { offset: -1375, target: -1500 });
});
