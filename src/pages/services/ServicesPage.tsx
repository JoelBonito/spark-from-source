import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Eye, Edit, Archive, Plus, ArchiveRestore } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { ServiceModal } from '@/components/ServiceModal';
import type { Service } from '@/hooks/useServices';
import { formatCurrency } from '@/utils/formatters';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServicesPage() {
  const { services, loading, createService, updateService, archiveService } = useServices();
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleCreate = () => {
    setSelectedService(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleView = (service: Service) => {
    setSelectedService(service);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleArchive = async (serviceId: string) => {
    await archiveService(serviceId);
  };

  const handleRestore = async (serviceId: string) => {
    await updateService(serviceId, { active: true });
  };

  const filteredServices = showArchived 
    ? services 
    : services.filter(s => s.active);

  const requiredServices = filteredServices.filter(s => s.tipo_servico === 'Serviço obrigatório');
  const optionalServices = filteredServices.filter(s => s.tipo_servico === 'Serviço opcional');

  if (loading) {
    return (
      <div className="space-y-6 fade-in-up">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowArchived(!showArchived)}
                  className={showArchived ? 'bg-primary/10' : ''}
                >
                  {showArchived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showArchived ? 'Ocultar arquivados' : 'Mostrar arquivados'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={handleCreate} className="glow-trusmile">
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
        </div>
      </div>

      {/* Serviços Obrigatórios */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">Serviços Obrigatórios</h3>
          <Badge variant="default" className="bg-primary">
            {requiredServices.length}
          </Badge>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requiredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum serviço obrigatório cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                requiredServices.map(service => (
                  <TableRow key={service.id} className={!service.active ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {service.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.tipo_servico}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(service.price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => handleView(service)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(service)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {!service.required && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => service.active ? handleArchive(service.id) : handleRestore(service.id)}
                                >
                                  {service.active ? (
                                    <Archive className="h-4 w-4" />
                                  ) : (
                                    <ArchiveRestore className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {service.active ? 'Arquivar' : 'Restaurar'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Serviços Opcionais */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">Serviços Opcionais</h3>
          <Badge variant="secondary">
            {optionalServices.length}
          </Badge>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optionalServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum serviço opcional cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                optionalServices.map(service => (
                  <TableRow key={service.id} className={!service.active ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {service.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.tipo_servico}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(service.price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => handleView(service)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(service)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => service.active ? handleArchive(service.id) : handleRestore(service.id)}
                              >
                                {service.active ? (
                                  <Archive className="h-4 w-4" />
                                ) : (
                                  <ArchiveRestore className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {service.active ? 'Arquivar' : 'Restaurar'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <ServiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        service={selectedService}
        mode={modalMode}
        onCreate={createService}
        onUpdate={updateService}
      />
    </div>
  );
}
