export function shouldHandleDoubleTap(currentTime, lastTapTime, thresholdMs = 280) {
  return currentTime - lastTapTime < thresholdMs;
}

export function shouldHandleSingleTap(currentTime, lastTapTime, thresholdMs = 280) {
  return currentTime - lastTapTime >= thresholdMs;
}
