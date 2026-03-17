import clsx from 'clsx';

interface GlassVialProps {
    percent: number;
    className?: string;
    liquidClassName?: string;
}

export function GlassVial({ percent, className, liquidClassName }: GlassVialProps) {
    return (
        <div className={clsx('glass-vial h-3 w-full rounded-full', className)}>
            <div
                className={clsx('liquid-essence h-full rounded-full transition-all', liquidClassName)}
                style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
            />
        </div>
    );
}
