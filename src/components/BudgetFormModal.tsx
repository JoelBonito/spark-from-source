import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Budget } from '@/services/budgetService';
import { useServices } from '@/hooks/useServices';
import { PatientSelector } from './PatientSelector';
import { QuickPatientForm } from './QuickPatientForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BudgetItem {
  servico: string;
  categoria?: string;
  quantidade: number;
  valor_unitario: number;
  observacoes?: string;
}

interface BudgetFormData {
  patient_id: string;
  items: BudgetItem[];
  discount: number;
  treatment_type: 'facetas' | 'clareamento';
}

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: Budget | null;
  onSave: (data: BudgetFormData) => Promise<void>;
}

export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  isOpen,
  onClose,
  budget,
  onSave
}) => {
  const { services } = useServices();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [discount, setDiscount] = useState(10);
  const [treatmentType, setTreatmentType] = useState<'facetas' | 'clareamento'>('facetas');
  const [loading, setLoading] = useState(false);
  
  // Quick service form
  const [showQuickService, setShowQuickService] = useState(false);
  const [quickService, setQuickService] = useState({
    servico: '',
    categoria: '',
    quantidade: 1,
    valor_unitario: 0
  });

  // Service selector
  const [openServiceSelector, setOpenServiceSelector] = useState(false);
  
  // Quick patient form
  const [showQuickPatient, setShowQuickPatient] = useState(false);

  // Initialize form when budget changes
  useEffect(() => {
    if (budget) {
      setSelectedPatientId(budget.patient_id);
      setItems(budget.items || []);
      setDiscount(budget.discount_percentage);
      setTreatmentType(budget.treatment_type);
    } else {
      setSelectedPatientId(null);
      setItems([]);
      setDiscount(10);
      setTreatmentType('facetas');
    }
  }, [budget]);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const handleAddService = (service: any) => {
    setItems([...items, {
      servico: service.name,
      categoria: service.category,
      quantidade: 1,
      valor_unitario: service.price
    }]);
    setOpenServiceSelector(false);
  };

  const handleAddQuickService = () => {
    if (!quickService.servico || quickService.valor_unitario <= 0) return;
    
    setItems([...items, { ...quickService }]);
    setQuickService({
      servico: '',
      categoria: '',
      quantidade: 1,
      valor_unitario: 0
    });
    setShowQuickService(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof BudgetItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    if (!selectedPatientId || items.length === 0) return;

    setLoading(true);
    try {
      await onSave({
        patient_id: selectedPatientId,
        items,
        discount,
        treatment_type: treatmentType
      });
      onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCreated = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowQuickPatient(false);
  };

  const activeServices = services.filter(s => s.active);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {budget ? `Editar Orçamento #${budget.budget_number}` : 'Novo Orçamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Patient Selector */}
            {!budget && (
              <div className="space-y-2">
                <Label>Paciente</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <PatientSelector
                      value={selectedPatientId}
                      onChange={setSelectedPatientId}
                      onCreateNew={() => setShowQuickPatient(true)}
                    />
                  </div>
                </div>
              </div>
            )}

            {budget && (
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Input value={budget.patient?.name || ''} disabled />
              </div>
            )}

            {/* Treatment Type */}
            <div className="space-y-2">
              <Label>Tipo de Tratamento</Label>
              <Select value={treatmentType} onValueChange={(v: any) => setTreatmentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facetas">Facetas</SelectItem>
                  <SelectItem value="clareamento">Clareamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens do Orçamento</Label>
                <div className="flex gap-2">
                  <Popover open={openServiceSelector} onOpenChange={setOpenServiceSelector}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Da Lista
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar serviço..." />
                        <CommandEmpty>Nenhum serviço encontrado</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {activeServices.map((service) => (
                            <CommandItem
                              key={service.id}
                              onSelect={() => handleAddService(service)}
                              className="cursor-pointer"
                            >
                              <div className="flex-1">
                                <div className="font-medium">{service.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {service.category} - {formatCurrency(service.price)}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickService(!showQuickService)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Serviço Rápido
                  </Button>
                </div>
              </div>

              {/* Quick Service Form */}
              {showQuickService && (
                <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={quickService.servico}
                        onChange={(e) => setQuickService({ ...quickService, servico: e.target.value })}
                        placeholder="Nome do serviço"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Categoria</Label>
                      <Input
                        value={quickService.categoria}
                        onChange={(e) => setQuickService({ ...quickService, categoria: e.target.value })}
                        placeholder="Categoria"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Valor</Label>
                      <Input
                        type="number"
                        value={quickService.valor_unitario}
                        onChange={(e) => setQuickService({ ...quickService, valor_unitario: parseFloat(e.target.value) || 0 })}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddQuickService}>Adicionar</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowQuickService(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Items List */}
              {items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium">Descrição</th>
                        <th className="px-4 py-2 text-left text-xs font-medium w-24">Qtd</th>
                        <th className="px-4 py-2 text-left text-xs font-medium w-32">Valor Unit.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium w-32">Total</th>
                        <th className="px-4 py-2 text-center text-xs font-medium w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <div className="text-sm font-medium">{item.servico}</div>
                            {item.categoria && (
                              <div className="text-xs text-muted-foreground">{item.categoria}</div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => handleUpdateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                              className="h-8 w-20"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.valor_unitario}
                              onChange={(e) => handleUpdateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold">
                            {formatCurrency(item.quantidade * item.valor_unitario)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
                  Nenhum item adicionado. Use os botões acima para adicionar serviços.
                </div>
              )}
            </div>

            {/* Discount and Total */}
            {items.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Desconto (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Desconto ({discount}%):</span>
                  <span>- {formatCurrency(calculateSubtotal() * (discount / 100))}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedPatientId || items.length === 0 || loading}
              >
                {loading ? 'Salvando...' : 'Salvar Orçamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Patient Modal */}
      {showQuickPatient && (
        <Dialog open={showQuickPatient} onOpenChange={setShowQuickPatient}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastro Rápido de Paciente</DialogTitle>
            </DialogHeader>
            <QuickPatientForm
              onSuccess={handlePatientCreated}
              onCancel={() => setShowQuickPatient(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
