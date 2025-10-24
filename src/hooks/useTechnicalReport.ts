import { useState } from 'react';
import { 
  generateTechnicalReportPDF,
  generateReportNumber,
  saveTechnicalReportToSimulation
} from '@/services/technicalReportService';
import { supabase } from '@/integrations/supabase/client';

export function useTechnicalReport() {
  const [generating, setGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportPdfUrl, setReportPdfUrl] = useState<string | null>(null);

  const generateReport = async (
    imageUrl: string,
    patientName: string,
    patientPhone: string | undefined,
    teethCount: number,
    simulationId?: string,
    treatmentType: 'facetas' | 'clareamento' = 'facetas',
    processedImageUrl?: string
  ) => {
    setGenerating(true);
    
    try {
      // Converter URL para base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Remover prefixo data:image/...;base64,
      const base64Data = imageBase64.split(',')[1];

      // Converter processedImageUrl se fornecida
      let processedBase64Data;
      if (processedImageUrl) {
        const processedResponse = await fetch(processedImageUrl);
        const processedBlob = await processedResponse.blob();
        const processedReader = new FileReader();
        
        const processedImageBase64 = await new Promise<string>((resolve, reject) => {
          processedReader.onloadend = () => resolve(processedReader.result as string);
          processedReader.onerror = reject;
          processedReader.readAsDataURL(processedBlob);
        });
        processedBase64Data = processedImageBase64.split(',')[1];
      }

      // Chamar Edge Function para gerar relatório
      console.log('Gerando relatório técnico com Edge Function...');
      const { data: reportData, error: reportError } = await supabase.functions.invoke(
        'process-dental-facets',
        {
          body: {
            imageBase64: base64Data,
            processedImageBase64: processedBase64Data,
            action: 'generate-report',
            treatment_type: treatmentType
          }
        }
      );

      if (reportError) throw reportError;
      if (!reportData.reportContent) throw new Error('Relatório não foi gerado');

      const content = reportData.reportContent;
      setReportContent(content);
      
      // Gerar PDF
      console.log('Gerando PDF do relatório...');
      const reportNumber = generateReportNumber();
      const pdfUrl = await generateTechnicalReportPDF({
        reportNumber,
        patientName,
        patientPhone,
        date: new Date(),
        teethCount,
        reportContent: content,
        simulationId
      });
      
      setReportPdfUrl(pdfUrl);
      
      // Salvar na simulação se ID fornecido
      if (simulationId) {
        await saveTechnicalReportToSimulation(simulationId, pdfUrl, reportNumber);
      }
      
      return {
        content,
        pdfUrl,
        reportNumber
      };
      
    } catch (error) {
      console.error('Erro ao gerar relatório técnico:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return {
    generating,
    reportContent,
    reportPdfUrl,
    generateReport
  };
}
