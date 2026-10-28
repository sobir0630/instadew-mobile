const assert = require('node:assert/strict');
const { shouldHandleDoubleTap, shouldHandleSingleTap } = require('./tapLogic');

assert.equal(shouldHandleDoubleTap(300, 100, 280), true);
assert.equal(shouldHandleDoubleTap(300, 0, 280), false);
assert.equal(shouldHandleSingleTap(300, 0, 280), true);
assert.equal(shouldHandleSingleTap(300, 100, 280), false);

console.log('tap logic tests passed');
