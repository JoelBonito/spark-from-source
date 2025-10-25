import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  colorClass: string;
}

export function MetricCard({ icon: Icon, label, value, colorClass }: MetricCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-3xl font-display font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
