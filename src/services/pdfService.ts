import { jsPDF } from 'jspdf';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetPDFData {
  budgetNumber: string;
  patientName: string;
  patientPhone?: string;
  date: Date;
  itens: Array<{
    servico: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    dentes?: string[];
  }>;
  opcionais?: Array<{
    servico: string;
    valor: number;
    justificativa: string;
  }>;
  subtotal: number;
  desconto_percentual: number;
  desconto_valor: number;
  total: number;
  beforeImage?: string;
  afterImage?: string;
  treatment_type?: 'facetas' | 'clareamento';
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
  const titulo = data.treatment_type === 'clareamento'
    ? 'ORÇAMENTO - CLAREAMENTO DENTAL'
    : 'ORÇAMENTO DE FACETAS DENTÁRIAS';
  doc.text(titulo, 105, 30, { align: 'center' });
  
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
  
  // Simulação Visual do Tratamento (se disponível)
  if (data.beforeImage && data.afterImage) {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SIMULAÇÃO VISUAL DO TRATAMENTO', 20, y);
    y += 8;
    
    const imgWidth = 75;
    const spacing = 10;
    const startX = 20;
    
    // FASE 3: Calcular altura proporcional para evitar distorção
    const beforeImgProps = doc.getImageProperties(data.beforeImage);
    const beforeImgHeight = (imgWidth * beforeImgProps.height) / beforeImgProps.width;
    
    doc.setFontSize(10);
    doc.text('ANTES', startX + (imgWidth / 2), y, { align: 'center' });
    y += 3;
    doc.rect(startX, y, imgWidth, beforeImgHeight);
    doc.addImage(data.beforeImage, 'JPEG', startX, y, imgWidth, beforeImgHeight);
    
    const afterX = startX + imgWidth + spacing;
    const afterImgProps = doc.getImageProperties(data.afterImage);
    const afterImgHeight = (imgWidth * afterImgProps.height) / afterImgProps.width;
    
    doc.text('DEPOIS', afterX + (imgWidth / 2), y - 3, { align: 'center' });
    doc.rect(afterX, y, imgWidth, afterImgHeight);
    doc.addImage(data.afterImage, 'JPEG', afterX, y, imgWidth, afterImgHeight);
    
    // Usar a maior altura para ajustar y
    const maxHeight = Math.max(beforeImgHeight, afterImgHeight);
    y += maxHeight + 10;
  }
  
  // Procedimentos Propostos
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Procedimentos Propostos', 20, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  data.itens.forEach((item) => {
    const linha = `• ${item.servico} (${item.quantidade}x) - R$ ${item.valor_unitario.toFixed(2)}`;
    doc.text(linha, 25, y);
    y += 5;
    doc.text(`  Subtotal: R$ ${item.valor_total.toFixed(2)}`, 30, y);
    y += 6;
  });

  // Opcionais
  if (data.opcionais && data.opcionais.length > 0) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('⭐ PROCEDIMENTO OPCIONAL:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    
    data.opcionais.forEach((opt) => {
      doc.text(`□ ${opt.servico} - R$ ${opt.valor.toFixed(2)}`, 25, y);
      y += 5;
      doc.text(`  Recomendado para: ${opt.justificativa}`, 30, y);
      y += 6;
    });
  }

  // Box de Valores
  y += 12;
  doc.setFillColor(245, 247, 250);
  doc.rect(20, y, 170, 30, 'F');

  y += 8;
  doc.setFontSize(10);
  doc.text(`Subtotal: R$ ${data.subtotal.toFixed(2)}`, 25, y);
  y += 5;
  doc.text(`Desconto (${data.desconto_percentual}%): -R$ ${data.desconto_valor.toFixed(2)}`, 25, y);

  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR TOTAL:', 25, y);
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(16);
  doc.text(`R$ ${data.total.toFixed(2)}`, 160, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  
  // Rodapé comercial
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('✅ INCLUSO SEM CUSTO ADICIONAL:', 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('• Consulta de avaliação', 25, y);
  y += 5;
  doc.text('• Ajustes pós-tratamento', 25, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('💳 FORMAS DE PAGAMENTO:', 20, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('• À vista: 10% desconto (aplicado)', 25, y);
  y += 5;
  doc.text('• Até 12x sem juros', 25, y);

  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('📌 Orçamento baseado em análise fotográfica.', 20, y);
  y += 4;
  doc.text('   Valores ajustáveis após consulta presencial.', 20, y);
  
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

// FASE 4: Gerar PDF de orçamento manual (sem imagens de simulação)
export interface ManualBudgetPDFData {
  budgetNumber: string;
  patientName: string;
  patientPhone?: string;
  date: Date;
  items: Array<{
    servico: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    observacoes?: string;
  }>;
  subtotal: number;
  desconto_percentual: number;
  desconto_valor: number;
  total: number;
}

export async function generateManualBudgetPDF(data: ManualBudgetPDFData): Promise<string> {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text('Facet.AI', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('ORÇAMENTO PERSONALIZADO', 105, 30, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  
  // Info do orçamento
  let y = 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Orçamento', 20, y);
  
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${data.budgetNumber}`, 20, y);
  doc.text(`Data: ${format(data.date, 'dd/MM/yyyy', { locale: ptBR })}`, 120, y);
  
  y += 5;
  doc.text(`Validade: ${format(addDays(data.date, 30), 'dd/MM/yyyy', { locale: ptBR })}`, 120, y);
  
  // Dados do paciente
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
  
  // Aviso de orçamento manual
  y += 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y - 5, 170, 10, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Orçamento criado manualmente pelo profissional', 105, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Tabela de itens
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ITENS DO ORÇAMENTO', 20, y);
  
  y += 10;
  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 5, 170, 8, 'F');
  doc.text('Serviço', 22, y);
  doc.text('Qtd', 110, y, { align: 'center' });
  doc.text('Valor Unit.', 135, y, { align: 'right' });
  doc.text('Total', 185, y, { align: 'right' });
  
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  data.items.forEach((item, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(item.servico, 22, y);
    doc.text(item.quantidade.toString(), 110, y, { align: 'center' });
    doc.text(`R$ ${item.valor_unitario.toFixed(2)}`, 135, y, { align: 'right' });
    doc.text(`R$ ${item.valor_total.toFixed(2)}`, 185, y, { align: 'right' });
    
    if (item.observacoes) {
      y += 4;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${item.observacoes}`, 22, y);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
    }
    
    y += 7;
    
    if (index < data.items.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(20, y - 2, 190, y - 2);
    }
  });
  
  // Resumo financeiro
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  
  doc.text('Subtotal:', 140, y);
  doc.text(`R$ ${data.subtotal.toFixed(2)}`, 185, y, { align: 'right' });
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Desconto (${data.desconto_percentual}%):`, 140, y);
  doc.text(`- R$ ${data.desconto_valor.toFixed(2)}`, 185, y, { align: 'right' });
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setFillColor(37, 99, 235);
  doc.rect(20, y - 6, 170, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('VALOR TOTAL:', 22, y);
  doc.text(`R$ ${data.total.toFixed(2)}`, 185, y, { align: 'right' });
  
  // Footer
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Este orçamento é válido por 30 dias a partir da data de emissão.', 105, 280, { align: 'center' });
  doc.text('Gerado automaticamente por Facet.AI', 105, 285, { align: 'center' });
  
  // Upload para storage
  const pdfBlob = doc.output('blob');
  const fileName = `budget-manual-${data.budgetNumber}.pdf`;
  
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
  
  const { data: { publicUrl } } = supabase.storage
    .from('budgets')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
