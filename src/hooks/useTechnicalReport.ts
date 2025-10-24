import { useState } from 'react';
import { 
  generateTechnicalReportWithGemini,
  generateTechnicalReportPDF,
  generateReportNumber,
  saveTechnicalReportToSimulation
} from '@/services/technicalReportService';

export function useTechnicalReport() {
  const [generating, setGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportPdfUrl, setReportPdfUrl] = useState<string | null>(null);

  const generateReport = async (
    imageBase64: string,
    patientName: string,
    patientPhone: string | undefined,
    teethCount: number,
    simulationId?: string,
    treatmentType: 'facetas' | 'clareamento' = 'facetas'
  ) => {
    setGenerating(true);

    try {
      // Gerar conteúdo do relatório com Gemini via Edge Function
      console.log('Gerando relatório técnico via Edge Function...');
      const content = await generateTechnicalReportWithGemini(imageBase64, treatmentType);
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
