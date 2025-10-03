import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetPDFData {
  budgetNumber: string;
  patientName: string;
  patientPhone?: string;
  date: Date;
  teethCount: number;
  pricePerTooth: number;
  subtotal: number;
  paymentOptions: Array<{
    name: string;
    installments: number;
    value: number;
    installmentValue: number;
    discount: number;
  }>;
  beforeImage?: string;
  afterImage?: string;
}

export function generateBudgetNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `ORCAM-${year}${month}-${random}`;
}

export async function generateBudgetPDF(data: BudgetPDFData): Promise<string> {
  const doc = new jsPDF();
  
  // Configurar fonte
  doc.setFont('helvetica');
  
  // Header com cor
  doc.setFillColor(37, 99, 235); // Azul
  doc.rect(0, 0, 210, 40, 'F');
  
  // Logo/Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text('Facet.AI', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('ORÇAMENTO DE FACETAS DENTÁRIAS', 105, 30, { align: 'center' });
  
  // Reset cor
  doc.setTextColor(0, 0, 0);
  
  // Informações do Orçamento
  let y = 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Orçamento', 20, y);
  
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${data.budgetNumber}`, 20, y);
  doc.text(`Data: ${format(data.date, 'dd/MM/yyyy', { locale: ptBR })}`, 120, y);
  
  y += 5;
  doc.text(`Validade: ${format(new Date(data.date.getTime() + 30 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy', { locale: ptBR })}`, 120, y);
  
  // Dados do Paciente
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Dados do Paciente', 20, y);
  
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${data.patientName}`, 20, y);
  if (data.patientPhone) {
    y += 5;
    doc.text(`Telefone: ${data.patientPhone}`, 20, y);
  }
  
  // Simulação Visual (se disponível)
  if (data.beforeImage && data.afterImage) {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SIMULAÇÃO VISUAL DO TRATAMENTO', 20, y);
    y += 8;
    
    const imgWidth = 75;
    const imgHeight = 56;
    const spacing = 10;
    const startX = 20;
    
    doc.setFontSize(10);
    doc.text('ANTES', startX + (imgWidth / 2), y, { align: 'center' });
    y += 3;
    doc.rect(startX, y, imgWidth, imgHeight);
    doc.addImage(data.beforeImage, 'JPEG', startX, y, imgWidth, imgHeight);
    
    const afterX = startX + imgWidth + spacing;
    doc.text('DEPOIS', afterX + (imgWidth / 2), y - 3, { align: 'center' });
    doc.rect(afterX, y, imgWidth, imgHeight);
    doc.addImage(data.afterImage, 'JPEG', afterX, y, imgWidth, imgHeight);
    
    y += imgHeight + 10;
  }
  
  // Descrição do Procedimento
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Procedimento Proposto', 20, y);
  
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Facetas Dentárias em Cerâmica Feldspática', 20, y);
  
  y += 6;
  doc.text(`• Quantidade: ${data.teethCount} facetas`, 25, y);
  y += 5;
  doc.text(`• Valor unitário: R$ ${data.pricePerTooth.toFixed(2)}`, 25, y);
  y += 5;
  doc.text('• Material: Cerâmica de alta translucidez', 25, y);
  y += 5;
  doc.text('• Técnica: Estratificada em camadas', 25, y);
  
  // Box de Valores
  y += 12;
  doc.setFillColor(245, 247, 250);
  doc.rect(20, y, 170, 20, 'F');
  
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR TOTAL:', 25, y);
  doc.setTextColor(34, 197, 94); // Verde
  doc.setFontSize(16);
  doc.text(`R$ ${data.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 160, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  
  // Opções de Pagamento
  y += 18;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Opções de Pagamento', 20, y);
  
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  data.paymentOptions.forEach((option) => {
    const line = `• ${option.name}: ${option.installments}x de R$ ${option.installmentValue.toFixed(2)}`;
    const extra = option.discount > 0 ? ` (${option.discount}% desconto)` : '';
    doc.text(line + extra, 25, y);
    y += 5;
  });
  
  // Incluso
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Incluso no Tratamento:', 20, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  const included = [
    'Planejamento digital 3D do sorriso',
    'Mock-up para teste prévio do resultado',
    'Acompanhamento pós-tratamento',
    'Todas as consultas de ajuste necessárias'
  ];
  
  included.forEach((item) => {
    doc.text(`✓ ${item}`, 25, y);
    y += 5;
  });
  
  // Termos
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Termos e Condições:', 20, y);
  y += 4;
  doc.text('• Orçamento válido por 30 dias a partir da data de emissão', 20, y);
  y += 3;
  doc.text('• Valores sujeitos a alteração após avaliação clínica presencial', 20, y);
  y += 3;
  doc.text('• Parcelamento disponível no cartão de crédito', 20, y);
  
  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('Documento gerado automaticamente por Facet.AI', 105, 285, { align: 'center' });
  
  // Converter para blob
  const pdfBlob = doc.output('blob');
  
  // Get user ID for the folder structure
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  // Upload para Supabase
  const fileName = `${user.id}/budget-${data.budgetNumber}.pdf`;
  const { error } = await supabase.storage
    .from('budgets')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });
  
  if (error) {
    console.error('Erro ao fazer upload do PDF:', error);
    throw error;
  }
  
  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('budgets')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
