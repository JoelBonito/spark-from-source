import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full text-center shadow-md">
        <div className="mb-6">
          <h1 className="text-9xl font-display font-bold text-primary">404</h1>
          <h2 className="text-2xl font-display font-bold mt-4">Página não encontrada</h2>
          <p className="text-muted-foreground mt-2">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <Button asChild>
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Voltar ao início
          </Link>
        </Button>
      </Card>
    </div>
  );
}
