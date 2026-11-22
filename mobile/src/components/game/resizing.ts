import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

/** How long after the window changed size (the phone turned) layout changes count as part of it. */
const SETTLE_MS = 600;

/**
 * Whether the window changed size in the last moment (the phone turned): true from the very
 * render with the new size, for `SETTLE_MS`. Cards use it to jump to their new places instead
 * of gliding there one by one (the glide made turning the phone feel slow).
 */
export function useJustResized(): boolean {
    const { width, height } = useWindowDimensions();
    const size = `${Math.round(width)}x${Math.round(height)}`;
    const [settled, setSettled] = useState(size);
    useEffect(() => {
        if (size === settled) return;
        const timer = setTimeout(() => setSettled(size), SETTLE_MS);
        return () => clearTimeout(timer);
    }, [size, settled]);
    return size !== settled;
}
