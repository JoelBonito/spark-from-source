import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PDFViewerModal } from '@/components/PDFViewerModal';

interface Report {
  id: string;
  created_at: string;
  technical_report_url: string;
  technical_notes: string;
  patient_name: string;
  patient?: { name: string } | null;
}

export default function TechnicalReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select(`
          id, created_at, technical_report_url, technical_notes, patient_name,
          patient:patients(name)
        `)
        .not('technical_report_url', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = (data || []).map(r => ({
        ...r,
        // Usar o nome do paciente da tabela patients se disponível, ou o nome salvo na simulação
        patient_name: (r.patient as any)?.name || r.patient_name || 'N/A'
      }));
      
      setReports(formattedData as Report[]);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r =>
    r.technical_notes?.toLowerCase().includes(search.toLowerCase()) ||
    r.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewPdf = (pdfUrl: string) => {
    setSelectedPdfUrl(pdfUrl);
    setShowPdfModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Relatórios Técnicos</h1>
        </header>

        <div className="relative">
          <Input
            placeholder="Buscar por nome do paciente ou número do relatório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Tabela de Relatórios (List View) */}
        <Card className="rounded-lg border overflow-hidden">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhum relatório técnico encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/50 border-b">
                  <TableRow>
                    <TableHead className="w-[150px]">Número</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="w-[150px]">Data Geração</TableHead>
                    <TableHead className="w-[150px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{report.technical_notes || report.id.slice(0, 8)}</TableCell>
                      <TableCell>{report.patient_name}</TableCell>
                      <TableCell>{format(new Date(report.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleViewPdf(report.technical_report_url)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Visualizar PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <a
                            href={report.technical_report_url}
                            download
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {selectedPdfUrl && (
          <PDFViewerModal
            isOpen={showPdfModal}
            onClose={() => setShowPdfModal(false)}
            pdfUrl={selectedPdfUrl}
            title="Relatório Técnico"
          />
        )}
      </div>
    </Layout>
  );
}
