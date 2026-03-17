import clsx from 'clsx';

interface LeatherCardProps {
    children: React.ReactNode;
    className?: string;
}

export function LeatherCard({ children, className }: LeatherCardProps) {
    return (
        <div className={clsx('leather-card relative rounded-lg p-4', className)}>
            <div className="filigree-corner filigree-tl" />
            <div className="filigree-corner filigree-tr" />
            <div className="filigree-corner filigree-bl" />
            <div className="filigree-corner filigree-br" />
            {children}
        </div>
    );
}
