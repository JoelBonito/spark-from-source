import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { usePatients } from '@/hooks/usePatients';
import { useTechnicalReport } from '@/hooks/useTechnicalReport';
import { useServices } from '@/hooks/useServices';
import { supabase } from '@/integrations/supabase/client';
import { createBudget } from '@/services/budgetService';
import { generateBudgetNumber } from '@/services/pdfService';

export default function SimulatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients, loading: loadingPatients } = usePatients();
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

        // Validar se a Edge Function retornou a imagem
        if (!edgeData.processedImageBase64) {
          console.error('Edge Function não retornou imagem processada');
          toast.error('Erro: Imagem não foi gerada pela IA');
          throw new Error('Imagem processada não foi retornada');
        }

        // Converter base64 (pode vir em PNG) para JPEG real via canvas
        const processedBlob: Blob = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas não suportado'));
              return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Falha ao converter para JPEG'));
            }, 'image/jpeg', 0.92);
          };
          img.onerror = () => reject(new Error('Falha ao carregar imagem base64'));
          img.src = edgeData.processedImageBase64;
        });

        // Validar se o blob foi criado corretamente
        if (!processedBlob || processedBlob.size === 0) {
          console.error('Blob da imagem processada está vazio');
          toast.error('Erro: Imagem processada está corrompida');
          throw new Error('Blob inválido');
        }

        console.log(`✅ Blob criado: ${processedBlob.size} bytes, tipo: ${processedBlob.type}`);

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
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) throw new Error('GEMINI_API_KEY não configurada');

      await generateReport(originalImageUrl, patient.name, patient.phone, teethCount, geminiKey, simulationId, treatmentType);

      const baseServices = services.filter(s => s.active && s.base);
      const pricePerTooth = baseServices.reduce((sum, s) => sum + Number(s.price), 0) / teethCount || 600;
      const subtotal = pricePerTooth * teethCount;
      const discount = 10;
      const discountAmount = subtotal * (discount / 100);
      const finalPrice = subtotal - discountAmount;

      await createBudget({
        budget_number: generateBudgetNumber(),
        patient_id: selectedPatientId,
        simulation_id: simulationId,
        teeth_count: teethCount,
        price_per_tooth: pricePerTooth,
        subtotal,
        discount_percentage: discount,
        discount_amount: discountAmount,
        final_price: finalPrice,
        status: 'draft',
        budget_type: 'automatic'
      });

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
      <div>
        <h1 className="text-3xl font-display font-bold">Simulador de Sorriso</h1>
        <p className="text-muted-foreground mt-1">Faça upload de uma foto e veja o resultado</p>
      </div>

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
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId} disabled={loadingPatients}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Tratamento</Label>
                <Select value={treatmentType} onValueChange={(v: any) => setTreatmentType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facetas">Facetas Dentárias</SelectItem>
                    <SelectItem value="clareamento">Clareamento Dental</SelectItem>
                  </SelectContent>
                </Select>
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
    </div>
  );
}