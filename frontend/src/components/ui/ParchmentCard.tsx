import clsx from 'clsx';

interface ParchmentCardProps {
    children: React.ReactNode;
    className?: string;
}

export function ParchmentCard({ children, className }: ParchmentCardProps) {
    return (
        <div className={clsx('parchment-texture parchment-edge relative p-4', className)}>
            <div className="filigree-corner filigree-tl" />
            <div className="filigree-corner filigree-tr" />
            <div className="filigree-corner filigree-bl" />
            <div className="filigree-corner filigree-br" />
            {children}
        </div>
    );
}
