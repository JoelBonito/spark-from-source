import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useServices, Service } from '@/hooks/useServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Archive, DollarSign } from 'lucide-react';
import { ServiceModal } from '@/components/ServiceModal';
import { formatCurrency } from '@/utils/formatters';

export const Services = () => {
  const { services, loading, createService, updateService, archiveService } = useServices();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  const handleCreate = () => {
    setSelectedService(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleView = (service: Service) => {
    setSelectedService(service);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const requiredServices = services.filter(s => s.required && s.active);
  const optionalServices = services.filter(s => !s.required && s.active);
  const archivedServices = services.filter(s => !s.active);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Serviços</h2>
            <p className="text-muted-foreground mt-1">
              Gerencie os serviços oferecidos pela clínica
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Serviços Obrigatórios */}
            {requiredServices.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Serviços Obrigatórios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requiredServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onView={() => handleView(service)}
                      onEdit={() => handleEdit(service)}
                      onArchive={() => archiveService(service.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Serviços Opcionais */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Serviços Opcionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {optionalServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onView={() => handleView(service)}
                    onEdit={() => handleEdit(service)}
                    onArchive={() => archiveService(service.id)}
                  />
                ))}
              </div>
              {optionalServices.length === 0 && (
                <Card className="p-8">
                  <p className="text-center text-muted-foreground">
                    Nenhum serviço opcional cadastrado
                  </p>
                </Card>
              )}
            </div>

            {/* Serviços Arquivados */}
            {archivedServices.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Serviços Arquivados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onView={() => handleView(service)}
                      onEdit={() => handleEdit(service)}
                      onArchive={() => archiveService(service.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        <ServiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          service={selectedService}
          mode={modalMode}
          onCreate={createService}
          onUpdate={updateService}
        />
      </div>
    </Layout>
  );
};

// ServiceCard Component
interface ServiceCardProps {
  service: Service;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onView, onEdit, onArchive }) => {
  return (
    <Card className={!service.active ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            {service.description && (
              <CardDescription className="mt-1">{service.description}</CardDescription>
            )}
          </div>
          <Badge variant={service.active ? 'default' : 'secondary'}>
            {service.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-semibold">{formatCurrency(service.price)}</span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            {!service.required && (
              <Button size="sm" variant="outline" onClick={onArchive}>
                <Archive className="w-4 h-4 mr-1" />
                Arquivar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
