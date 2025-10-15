// /src/hooks/useHorizontalScroll.ts
import { useRef, useEffect } from 'react';

export function useHorizontalScroll() {
    const elRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollTo({
                left: el.scrollLeft + e.deltaY,
                behavior: 'auto', // Use 'auto' for instant scroll, 'smooth' for animated
            });
        };

        el.addEventListener('wheel', onWheel);
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    return elRef;
}