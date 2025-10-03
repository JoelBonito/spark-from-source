import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TECHNICAL_REPORT_PROMPT } from '@/config/technicalReportPrompt';

export interface TechnicalReportData {
  reportNumber: string;
  patientName: string;
  patientPhone?: string;
  date: Date;
  teethCount: number;
  reportContent: string;
  simulationId?: string;
  beforeImage?: string;
  afterImage?: string;
}

export function generateReportNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `REL-${year}${month}-${random}`;
}

export async function generateTechnicalReportWithGemini(
  imageBase64: string,
  geminiApiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const imagePart = {
    inlineData: {
      data: imageBase64.split(',')[1],
      mimeType: "image/jpeg",
    },
  };

  const result = await model.generateContent([TECHNICAL_REPORT_PROMPT, imagePart]);
  const response = await result.response;
  return response.text();
}

export async function generateTechnicalReportPDF(data: TechnicalReportData): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  
  // Header colorido
  doc.setFillColor(99, 102, 241); // Indigo
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Logo/Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Facet.AI', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('RELATÓRIO TÉCNICO DE FACETAS DENTÁRIAS', pageWidth / 2, 25, { align: 'center' });
  
  // Reset
  doc.setTextColor(0, 0, 0);
  
  // Informações do Relatório
  let y = 45;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES DO RELATÓRIO', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Número: ${data.reportNumber}`, margin, y);
  doc.text(`Data: ${format(data.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin + 100, y);
  
  // Dados do Paciente
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO PACIENTE', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nome: ${data.patientName}`, margin, y);
  if (data.patientPhone) {
    doc.text(`Telefone: ${data.patientPhone}`, margin + 100, y);
  }
  
  // Análise Visual Comparativa (se disponível)
  if (data.beforeImage && data.afterImage) {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ANÁLISE VISUAL COMPARATIVA', margin, y);
    y += 8;
    
    const imgWidth = 75;
    const imgHeight = 56;
    const spacing = 10;
    const startX = margin;
    
    doc.setFontSize(9);
    doc.text('CONDIÇÃO INICIAL', startX + (imgWidth / 2), y, { align: 'center' });
    y += 3;
    doc.rect(startX, y, imgWidth, imgHeight);
    doc.addImage(data.beforeImage, 'JPEG', startX, y, imgWidth, imgHeight);
    
    const afterX = startX + imgWidth + spacing;
    doc.text('SIMULAÇÃO PÓS-TRATAMENTO', afterX + (imgWidth / 2), y - 3, { align: 'center' });
    doc.rect(afterX, y, imgWidth, imgHeight);
    doc.addImage(data.afterImage, 'JPEG', afterX, y, imgWidth, imgHeight);
    
    y += imgHeight + 18;
  }
  
  // Conteúdo do Relatório
  y += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO CLÍNICO', margin, y);
  
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Processar conteúdo do relatório
  const sections = parseReportContent(data.reportContent);
  
  sections.forEach((section) => {
    // Verificar espaço na página
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    
    // Título da seção
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, margin, y);
    y += 5;
    
    // Conteúdo da seção
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(section.content, contentWidth);
    lines.forEach((line: string) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 4;
    });
    
    y += 4; // Espaço entre seções
  });
  
  // Nova página para disclaimers
  doc.addPage();
  y = 20;
  
  // Box de Observações Legais
  doc.setFillColor(254, 243, 199); // Amarelo claro
  doc.rect(margin, y, contentWidth, 40, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.rect(margin, y, contentWidth, 40);
  
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANTE - DISCLAIMER PROFISSIONAL:', margin + 3, y);
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const disclaimers = [
    '• Este relatório é baseado em análise de imagem e tem caráter orientativo',
    '• Avaliação clínica presencial é OBRIGATÓRIA antes de qualquer procedimento',
    '• Exames complementares podem ser necessários (radiografias, modelos de estudo)',
    '• O planejamento definitivo pode variar após avaliação completa do paciente',
    '• Este documento não substitui consulta odontológica presencial'
  ];
  
  disclaimers.forEach((disclaimer) => {
    const lines = doc.splitTextToSize(disclaimer, contentWidth - 6);
    lines.forEach((line: string) => {
      doc.text(line, margin + 3, y);
      y += 4;
    });
  });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Relatório gerado automaticamente por Facet.AI | Documento técnico para uso profissional',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  
  // Converter para blob
  const pdfBlob = doc.output('blob');
  
  // Get user ID for the folder structure
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  // Upload para Supabase
  const fileName = `${user.id}/technical-report-${data.reportNumber}.pdf`;
  const { error } = await supabase.storage
    .from('technical-reports')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });
  
  if (error) {
    console.error('Erro ao fazer upload do relatório:', error);
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('technical-reports')
    .getPublicUrl(fileName);
  
  return publicUrl;
}

function parseReportContent(content: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = [];
  
  // Dividir por números seguidos de ponto (1., 2., etc)
  const parts = content.split(/(?=\d+\.\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/);
  
  parts.forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    
    // Extrair título (primeira linha)
    const lines = trimmed.split('\n');
    const titleLine = lines[0].replace(/^\d+\.\s*/, '');
    const contentLines = lines.slice(1).join('\n').trim();
    
    if (titleLine && contentLines) {
      sections.push({
        title: titleLine,
        content: contentLines
      });
    }
  });
  
  // Fallback: se não conseguiu dividir, retorna tudo como uma seção
  if (sections.length === 0) {
    sections.push({
      title: 'RELATÓRIO TÉCNICO',
      content: content
    });
  }
  
  return sections;
}

export async function saveTechnicalReportToSimulation(
  simulationId: string,
  reportUrl: string,
  reportNumber: string
): Promise<void> {
  const { error } = await supabase
    .from('simulations')
    .update({
      technical_report_url: reportUrl,
      technical_notes: reportNumber
    })
    .eq('id', simulationId);
  
  if (error) {
    console.error('Erro ao salvar relatório na simulação:', error);
    throw error;
  }
}
