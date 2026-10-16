// Ported from sp-client/src/utils/AnimationUtils.ts (MIT, Erko Knoll)

/** Animation duration in ms for a frame count at a frame rate (fps). */
export function calculateAnimationDuration(frameCount: number, frameRate: number): number {
    return (frameCount / frameRate) * 1000;
}

/** Frame rate (fps) needed to play an animation within a given duration. Inverse of calculateAnimationDuration. */
export function calculateFrameRateFromDuration(frameCount: number, durationMs: number): number {
    return (frameCount * 1000) / durationMs;
}
