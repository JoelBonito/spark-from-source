import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Service } from '@/hooks/useServices';
import { Switch } from '@/components/ui/switch';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  mode: 'create' | 'edit' | 'view';
  onCreate: (data: Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onUpdate: (id: string, data: Partial<Service>) => Promise<void>;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  mode,
  onCreate,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Opcional' as Service['category'],
    price: 0,
    active: true,
    required: false,
    base: false
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category,
        price: service.price,
        active: service.active,
        required: service.required,
        base: service.base
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'Opcional',
        price: 0,
        active: true,
        required: false,
        base: false
      });
    }
  }, [service, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      await onCreate(formData);
    } else if (mode === 'edit' && service) {
      await onUpdate(service.id, formData);
    }
    
    onClose();
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Novo Serviço'}
            {mode === 'edit' && 'Editar Serviço'}
            {mode === 'view' && 'Detalhes do Serviço'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && 'Preencha os dados do novo serviço'}
            {mode === 'edit' && 'Atualize as informações do serviço'}
            {mode === 'view' && 'Visualize os detalhes do serviço'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Serviço *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isReadOnly}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as Service['category'] })}
              disabled={isReadOnly || service?.required}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Facetas dentárias">Facetas dentárias</SelectItem>
                <SelectItem value="Clareamento">Clareamento</SelectItem>
                <SelectItem value="Consulta">Consulta</SelectItem>
                <SelectItem value="Gengivoplastia">Gengivoplastia</SelectItem>
                <SelectItem value="Opcional">Opcional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Serviço Ativo</Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              disabled={isReadOnly}
            />
          </div>

          {!isReadOnly && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Criar' : 'Salvar'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
