import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createManualBudget } from '@/services/budgetService';
import { getConfig } from '@/utils/storage';

interface BudgetItem {
  servico: string;
  quantidade: number;
  valor_unitario: number;
  observacoes?: string;
}

interface ManualBudgetFormProps {
  patientId: string;
  patientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ManualBudgetForm({ 
  patientId, 
  patientName, 
  onSuccess, 
  onCancel 
}: ManualBudgetFormProps) {
  const [items, setItems] = useState<BudgetItem[]>([
    { servico: '', quantidade: 1, valor_unitario: 0, observacoes: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discount, setDiscount] = useState(10);

  const addItem = () => {
    setItems([...items, { servico: '', quantidade: 1, valor_unitario: 0, observacoes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Deve haver pelo menos um item no orçamento');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const total = item.quantidade * item.valor_unitario;
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    const invalidItems = items.filter(
      item => !item.servico.trim() || item.quantidade <= 0 || item.valor_unitario <= 0
    );

    if (invalidItems.length > 0) {
      toast.error('Preencha todos os campos obrigatórios (serviço, quantidade > 0, preço > 0)');
      return;
    }

    if (calculateTotal() <= 0) {
      toast.error('O valor total do orçamento deve ser maior que zero');
      return;
    }

    setIsSubmitting(true);

    try {
      await createManualBudget(patientId, items, discount);
      toast.success('Orçamento manual criado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar orçamento manual:', error);
      toast.error('Erro ao criar orçamento manual. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Buscar serviços configurados para sugestões
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  
  useState(() => {
    getConfig().then(config => {
      if (config?.servicePrices) {
        setAvailableServices(config.servicePrices.map(s => s.name));
      }
    });
  });

  const subtotal = calculateSubtotal();
  const discountAmount = subtotal * (discount / 100);
  const total = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orçamento Manual - {patientName}</CardTitle>
          <CardDescription>
            Adicione itens personalizados ao orçamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <Card key={index} className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Item {index + 1}</Label>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label htmlFor={`servico-${index}`}>Serviço *</Label>
                    {availableServices.length > 0 ? (
                      <Select
                        value={item.servico}
                        onValueChange={(value) => {
                          updateItem(index, 'servico', value);
                          // Auto-preencher preço se disponível
                          getConfig().then(config => {
                            const service = config?.servicePrices.find(s => s.name === value);
                            if (service) {
                              updateItem(index, 'valor_unitario', service.price);
                            }
                          });
                        }}
                      >
                        <SelectTrigger id={`servico-${index}`}>
                          <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableServices.map(service => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__">Outro (customizado)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`servico-${index}`}
                        value={item.servico}
                        onChange={(e) => updateItem(index, 'servico', e.target.value)}
                        placeholder="Nome do serviço"
                        required
                      />
                    )}
                  </div>

                  {item.servico === '__custom__' && (
                    <div>
                      <Label htmlFor={`servico-custom-${index}`}>Nome do Serviço *</Label>
                      <Input
                        id={`servico-custom-${index}`}
                        value={item.observacoes || ''}
                        onChange={(e) => {
                          updateItem(index, 'servico', e.target.value);
                          updateItem(index, 'observacoes', '');
                        }}
                        placeholder="Digite o nome do serviço"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`quantidade-${index}`}>Quantidade *</Label>
                      <Input
                        id={`quantidade-${index}`}
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`valor-${index}`}>Preço Unitário (R$) *</Label>
                      <Input
                        id={`valor-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`obs-${index}`}>Observações</Label>
                    <Textarea
                      id={`obs-${index}`}
                      value={item.observacoes || ''}
                      onChange={(e) => updateItem(index, 'observacoes', e.target.value)}
                      placeholder="Ex: Dentes 11, 12, 21, 22"
                      rows={2}
                    />
                  </div>

                  <div className="text-sm font-medium text-right">
                    Subtotal: R$ {(item.quantidade * item.valor_unitario).toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>

          <Card className="p-4 bg-primary/5">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal:</span>
                <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="discount" className="text-sm flex-shrink-0">Desconto (%):</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  = R$ {discountAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>TOTAL:</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Gerar Orçamento
        </Button>
      </div>
    </form>
  );
}
