import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles, CheckCircle2, XCircle, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { usePatients } from '@/hooks/usePatients';
import { usePatientForm } from '@/hooks/usePatientForm';
import { useTechnicalReport } from '@/hooks/useTechnicalReport';
import { useServices } from '@/hooks/useServices';
import { supabase } from '@/integrations/supabase/client';
import { createBudget } from '@/services/budgetService';
import { generateBudgetNumber, generateBudgetPDF, BudgetPDFData } from '@/services/pdfService';
import { formatCurrency } from '@/utils/formatters';

// Helper para converter URL de imagem para base64
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper para construir dados do orçamento
function buildBudgetData(
  budgetNumber: string,
  patientName: string,
  patientPhone: string | undefined,
  beforeImage: string,
  afterImage: string,
  treatmentType: 'facetas' | 'clareamento',
  teethCount: number
): BudgetPDFData {
  const itens = treatmentType === 'clareamento'
    ? [
        {
          servico: 'Clareamento Dental Profissional',
          quantidade: 1,
          valor_unitario: 1200,
          valor_total: 1200
        },
        {
          servico: 'Consulta de Planejamento',
          quantidade: 1,
          valor_unitario: 150,
          valor_total: 150
        }
      ]
    : [
        {
          servico: 'Facetas em Resina Composta',
          quantidade: teethCount,
          valor_unitario: 600,
          valor_total: teethCount * 600
        },
        {
          servico: 'Clareamento Complementar',
          quantidade: 1,
          valor_unitario: 800,
          valor_total: 800
        },
        {
          servico: 'Consulta de Planejamento',
          quantidade: 1,
          valor_unitario: 150,
          valor_total: 150
        }
      ];

  const subtotal = itens.reduce((sum, item) => sum + item.valor_total, 0);
  const desconto_percentual = 10;
  const desconto_valor = subtotal * (desconto_percentual / 100);
  const total = subtotal - desconto_valor;

  return {
    budgetNumber,
    patientName,
    patientPhone,
    date: new Date(),
    itens,
    opcionais: [],
    subtotal,
    desconto_percentual,
    desconto_valor,
    total,
    beforeImage,
    afterImage,
    treatment_type: treatmentType
  };
}

export default function SimulatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients, loading: loadingPatients, refresh: refreshPatients } = usePatients();
  const { createPatient, saving: savingPatient } = usePatientForm();
  const { services } = useServices();
  const { generating, generateReport } = useTechnicalReport();

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [treatmentType, setTreatmentType] = useState<'facetas' | 'clareamento'>('facetas');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const [simulationId, setSimulationId] = useState<string>('');
  const [teethCount, setTeethCount] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'result'>('upload');

  // Estados para cadastro rápido de paciente
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickPatientName, setQuickPatientName] = useState('');
  const [quickPatientPhone, setQuickPatientPhone] = useState('');

  const handleQuickAddPatient = async () => {
    if (!quickPatientName.trim() || !quickPatientPhone.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    try {
      const newPatient = await createPatient({
        name: quickPatientName.trim(),
        phone: quickPatientPhone.trim(),
      });

      toast.success('Paciente cadastrado com sucesso!');

      // Atualizar lista de pacientes e selecionar o novo
      await refreshPatients();
      setSelectedPatientId(newPatient.id);

      // Limpar e fechar modal
      setQuickPatientName('');
      setQuickPatientPhone('');
      setIsQuickAddOpen(false);
    } catch (error) {
      toast.error('Erro ao cadastrar paciente');
      console.error(error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPatientId || !selectedFile || !user) {
      toast.error('Por favor, selecione um paciente e uma imagem');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) {
      toast.error('Paciente não encontrado');
      return;
    }

    setLoading(true);
    setCurrentStep('processing');

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('original-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: originalUrl } } = supabase.storage
        .from('original-images')
        .getPublicUrl(fileName);

      setOriginalImageUrl(originalUrl);

      const { data: simulation, error: simError } = await supabase
        .from('simulations')
        .insert({
          user_id: user.id,
          patient_id: selectedPatientId,
          patient_name: patient.name,
          patient_phone: patient.phone,
          treatment_type: treatmentType,
          original_image_url: originalUrl,
          status: 'processing',
          teeth_count: teethCount
        })
        .select()
        .single();

      if (simError) throw simError;
      setSimulationId(simulation.id);

      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64 = reader.result as string;

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('process-dental-facets', {
        body: { imageBase64: base64, action: 'generate', treatment_type: treatmentType }
      });

        if (edgeError) {
          console.error('Erro da Edge Function:', edgeError);
          toast.error(`Erro ao processar imagem: ${edgeError.message || 'Erro desconhecido'}`);
          throw edgeError;
        }

        if (!edgeData.processedImageBase64) {
          console.error('Edge Function não retornou imagem processada');
          toast.error('Erro: Imagem não foi gerada pela IA');
          throw new Error('Imagem processada não foi retornada');
        }

        // Converter base64 para blob
        const processedBlob = await fetch(edgeData.processedImageBase64).then(r => r.blob());

        if (!processedBlob || processedBlob.size === 0) {
          console.error('Blob da imagem processada está vazio');
          toast.error('Erro: Imagem processada está corrompida');
          throw new Error('Blob inválido');
        }

        console.log(`Blob criado: ${processedBlob.size} bytes, tipo: ${processedBlob.type}`);

        const processedFileName = `${user.id}/${Date.now()}-processed.jpg`;

        const { error: processedUploadError } = await supabase.storage
          .from('processed-images')
          .upload(processedFileName, processedBlob, {
            contentType: 'image/jpeg'
          });

        if (processedUploadError) throw processedUploadError;

        const { data: { publicUrl: processedUrl } } = supabase.storage
          .from('processed-images')
          .getPublicUrl(processedFileName);

        setProcessedImageUrl(processedUrl);

        await supabase
          .from('simulations')
          .update({
            processed_image_url: processedUrl,
            status: 'completed',
            teeth_count: edgeData.teethCount || teethCount
          })
          .eq('id', simulation.id);

        setTeethCount(edgeData.teethCount || teethCount);
        setCurrentStep('result');
        toast.success('Simulação gerada com sucesso!');
      };
    } catch (error: any) {
      console.error('Erro ao gerar simulação:', error);
      toast.error('Erro ao gerar simulação');
      setCurrentStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!simulationId || !user) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    setLoading(true);
    toast.info('Gerando relatório técnico e orçamento...');

    try {
      const reportResult = await generateReport(
        originalImageUrl,
        patient.name,
        patient.phone,
        teethCount,
        simulationId,
        treatmentType,
        processedImageUrl
      );

      const baseServices = services.filter(s => s.active && s.base);
      const pricePerTooth = baseServices.reduce((sum, s) => sum + Number(s.price), 0) / teethCount || 600;
      const subtotal = pricePerTooth * teethCount;
      const discount = 10;
      const discountAmount = subtotal * (discount / 100);
      const finalPrice = subtotal - discountAmount;

      // Gerar PDF do orçamento
      console.log('→ Convertendo imagens para base64...');
      const beforeImageBase64 = await imageUrlToBase64(originalImageUrl);
      const afterImageBase64 = await imageUrlToBase64(processedImageUrl);

      console.log('→ Gerando PDF do orçamento...');
      const budgetNumber = generateBudgetNumber();
      const budgetData = buildBudgetData(
        budgetNumber,
        patient.name,
        patient.phone,
        beforeImageBase64,
        afterImageBase64,
        treatmentType,
        teethCount
      );

      const budgetPdfUrl = await generateBudgetPDF(budgetData);
      console.log('✓ PDF do orçamento gerado:', budgetPdfUrl);

      await createBudget({
        budget_number: budgetNumber,
        patient_id: selectedPatientId,
        simulation_id: simulationId,
        teeth_count: teethCount,
        price_per_tooth: pricePerTooth,
        subtotal,
        discount_percentage: discount,
        discount_amount: discountAmount,
        final_price: finalPrice,
        pdf_url: budgetPdfUrl,
        status: 'pending',
        budget_type: 'automatic',
        treatment_type: treatmentType
      });

      // Atualizar simulação com o PDF do orçamento
      await supabase
        .from('simulations')
        .update({ budget_pdf_url: budgetPdfUrl })
        .eq('id', simulationId);

      // Atualizar última data de simulação do paciente
      if (selectedPatientId) {
        await supabase.from('patients').update({
          last_simulation_date: new Date().toISOString()
        }).eq('id', selectedPatientId);
      }

      // Criar/atualizar lead no CRM
      console.log('→ Processando lead no CRM...');

      // Buscar lead existente para este paciente + tipo de tratamento
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id, opportunity_value')
        .eq('user_id', user.id)
        .eq('patient_id', selectedPatientId)
        .eq('treatment_type', treatmentType)
        .maybeSingle();

      let leadId: string;

      if (existingLead) {
        // Atualizar lead existente
        console.log('✓ Lead existente encontrado, atualizando...');
        const newOpportunityValue = (existingLead.opportunity_value || 0) + finalPrice;

        await supabase
          .from('leads')
          .update({
            opportunity_value: newOpportunityValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLead.id);

        leadId = existingLead.id;
        console.log(`✓ Lead atualizado: ${leadId}`);
      } else {
        // Criar novo lead
        console.log('→ Criando novo lead...');
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            patient_id: selectedPatientId,
            user_id: user.id,
            name: patient.name,
            phone: patient.phone || '',
            stage: 'novo_lead',
            opportunity_value: finalPrice,
            source: 'simulator',
            treatment_type: treatmentType
          })
          .select('id')
          .single();

        if (leadError) throw leadError;
        leadId = newLead.id;
        console.log(`✓ Novo lead criado: ${leadId}`);
      }

      // Registrar atividade da simulação
      console.log('→ Registrando atividade no lead...');
      await supabase.from('activities').insert({
        lead_id: leadId,
        type: 'simulation',
        title: 'Nova simulação realizada',
        description: `Simulação de ${treatmentType} - ${teethCount} dentes - ${formatCurrency(finalPrice)}`,
        user_id: user.id,
        metadata: {
          simulation_id: simulationId,
          teeth_count: teethCount,
          final_price: finalPrice,
          treatment_type: treatmentType,
          pdf_urls: {
            technical_report: reportResult.pdfUrl,
            budget: budgetPdfUrl
          }
        }
      });
      console.log('✓ Atividade registrada no lead');

      toast.success('Relatório e orçamento gerados!');
      navigate(`/simulations/${simulationId}`);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setCurrentStep('upload');
    setPreviewUrl('');
    setSelectedFile(null);
    toast.info('Prepare uma nova simulação');
  };

  return (
    <div className="space-y-6 fade-in-up">
      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" disabled={currentStep !== 'upload'}>1. Upload</TabsTrigger>
          <TabsTrigger value="processing" disabled={currentStep !== 'processing'}>2. Processando</TabsTrigger>
          <TabsTrigger value="result" disabled={currentStep !== 'result'}>3. Resultado</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <div className="flex gap-2">
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId} disabled={loadingPatients}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsQuickAddOpen(true)}
                    title="Adicionar paciente rapidamente"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Tratamento</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={treatmentType === 'facetas' ? 'default' : 'outline'}
                    onClick={() => setTreatmentType('facetas')}
                    className="w-full"
                  >
                    Facetas Dentárias
                  </Button>
                  <Button
                    type="button"
                    variant={treatmentType === 'clareamento' ? 'default' : 'outline'}
                    onClick={() => setTreatmentType('clareamento')}
                    className="w-full"
                  >
                    Clareamento Dental
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Imagem do Sorriso *</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleFileSelect} />
              </div>

              {previewUrl && (
                <div className="mt-4">
                  <Label>Prévia da Imagem</Label>
                  <img src={previewUrl} alt="Preview" className="mt-2 max-w-full h-auto rounded-lg border" />
                </div>
              )}

              <Button onClick={handleGenerate} disabled={loading || !selectedPatientId || !selectedFile} className="w-full" size="lg">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="h-4 w-4 mr-2" />Gerar Simulação</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Processando Imagem</h3>
              <p className="text-muted-foreground text-center">Aguarde...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Simulação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-center block mb-2">Antes</Label>
                  <img src={originalImageUrl || previewUrl} alt="Antes" className="w-full h-auto rounded-lg border" />
                </div>
                <div>
                  <Label className="text-center block mb-2">Depois</Label>
                  {processedImageUrl ? (
                    <img src={processedImageUrl} alt="Depois" className="w-full h-auto rounded-lg border" />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-center text-lg font-semibold mb-4">Gostou do resultado?</p>
                <div className="flex gap-4">
                  <Button onClick={handleApprove} disabled={loading || generating} className="flex-1" size="lg">
                    {loading || generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Sim, Gerar Documentos</>}
                  </Button>
                  <Button onClick={handleReject} disabled={loading || generating} variant="outline" className="flex-1" size="lg">
                    <XCircle className="h-4 w-4 mr-2" />Não, Nova Simulação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Cadastro Rápido de Paciente */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Paciente</DialogTitle>
            <DialogDescription>
              Cadastre um novo paciente rapidamente com apenas os dados obrigatórios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quick-name">Nome *</Label>
              <Input
                id="quick-name"
                placeholder="Nome completo do paciente"
                value={quickPatientName}
                onChange={(e) => setQuickPatientName(e.target.value)}
                disabled={savingPatient}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-phone">Telefone *</Label>
              <Input
                id="quick-phone"
                placeholder="(00) 00000-0000"
                value={quickPatientPhone}
                onChange={(e) => setQuickPatientPhone(e.target.value)}
                disabled={savingPatient}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickAddOpen(false);
                setQuickPatientName('');
                setQuickPatientPhone('');
              }}
              disabled={savingPatient}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleQuickAddPatient}
              disabled={savingPatient || !quickPatientName.trim() || !quickPatientPhone.trim()}
            >
              {savingPatient ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}