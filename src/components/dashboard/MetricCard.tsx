import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  colorClass: string;
  change?: number;
  delay?: number;
}

export function MetricCard({ icon: Icon, label, value, colorClass, change, delay = 0 }: MetricCardProps) {
  const changeColor = change && change > 0 ? 'text-success' : change && change < 0 ? 'text-destructive' : 'text-muted-foreground';
  
  return (
    <Card 
      className="shadow-md hover:shadow-interactive transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/20 group relative overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Ripple Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 rounded-full bg-primary/10 group-hover:w-full group-hover:h-full group-hover:animate-ripple" />
      </div>

      <CardContent className="pt-7 pb-6 px-7 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </h3>
        </div>
        <div className="space-y-2">
          <p className="text-4xl font-display font-bold gradient-text">{value}</p>
          {change !== undefined && (
            <p className={`text-xs font-medium ${changeColor} flex items-center gap-1`}>
              {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}% vs. mês anterior
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
