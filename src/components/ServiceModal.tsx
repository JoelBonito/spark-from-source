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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServiceCategories } from '@/hooks/useServiceCategories';

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
  const { categories, createCategory } = useServiceCategories();
  const [openCategoryCombo, setOpenCategoryCombo] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tipo_servico: 'Serviço opcional' as Service['tipo_servico'],
    categoria: null as string | null,
    price: 0,
    observacoes: '',
    active: true,
    required: false,
    base: false
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        tipo_servico: service.tipo_servico,
        categoria: service.categoria || null,
        price: service.price,
        observacoes: service.observacoes || '',
        active: service.active,
        required: service.required,
        base: service.base
      });
    } else {
      setFormData({
        name: '',
        description: '',
        tipo_servico: 'Serviço opcional',
        categoria: null,
        price: 0,
        observacoes: '',
        active: true,
        required: false,
        base: false
      });
    }
    setNewCategoryName('');
    setCreatingCategory(false);
  }, [service, isOpen]);

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setCreatingCategory(true);
    const newCategory = await createCategory(newCategoryName.trim());
    
    if (newCategory) {
      setFormData({ ...formData, categoria: newCategory.name });
      setNewCategoryName('');
      setOpenCategoryCombo(false);
    }
    
    setCreatingCategory(false);
  };

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_servico">Tipo de Serviço *</Label>
              <Select
                value={formData.tipo_servico}
                onValueChange={(value) => setFormData({ ...formData, tipo_servico: value as Service['tipo_servico'] })}
                disabled={isReadOnly || service?.required}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Serviço obrigatório">Serviço obrigatório</SelectItem>
                  <SelectItem value="Serviço opcional">Serviço opcional</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Obrigatório ou opcional
              </p>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Popover open={openCategoryCombo} onOpenChange={setOpenCategoryCombo}>
                <PopoverTrigger asChild disabled={isReadOnly}>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCategoryCombo}
                    className="w-full justify-between"
                  >
                    {formData.categoria || "Selecione..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar categoria..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 space-y-2">
                          <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nova categoria"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateNewCategory();
                                }
                              }}
                            />
                            <Button 
                              size="sm"
                              onClick={handleCreateNewCategory}
                              disabled={creatingCategory || !newCategoryName.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setFormData({ ...formData, categoria: null });
                            setOpenCategoryCombo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.categoria ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Sem categoria
                        </CommandItem>
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name}
                            onSelect={(currentValue) => {
                              setFormData({ 
                                ...formData, 
                                categoria: currentValue === formData.categoria ? null : currentValue 
                              });
                              setOpenCategoryCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.categoria === category.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    {categories.length > 0 && (
                      <div className="border-t p-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nova categoria"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateNewCategory();
                              }
                            }}
                          />
                          <Button 
                            size="sm"
                            onClick={handleCreateNewCategory}
                            disabled={creatingCategory || !newCategoryName.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Opcional (Ex: Estética, Preventivo)
              </p>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              disabled={isReadOnly}
              rows={2}
              placeholder="Informações adicionais sobre o serviço"
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
