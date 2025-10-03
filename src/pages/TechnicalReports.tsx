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
  report_number: string;
  patient_name: string;
  pdf_url: string | null;
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
        .from('reports')
        .select('id, created_at, report_number, patient_name, pdf_url')
        .not('pdf_url', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setReports((data || []) as Report[]);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r =>
    r.report_number?.toLowerCase().includes(search.toLowerCase()) ||
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

        <div className="relative max-w-md">
          <Input
            placeholder="Buscar por nome do paciente ou número do relatório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Nenhum relatório técnico encontrado
          </div>
        ) : (
          <div className="bg-card rounded-lg overflow-hidden">
            <Table>
              <TableBody className="divide-y divide-border">
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/20 transition-colors border-0">
                    <TableCell className="font-semibold py-6 px-6">
                      {report.report_number}
                    </TableCell>
                    <TableCell className="py-6 px-6">
                      {report.patient_name || 'N/A'}
                    </TableCell>
                    <TableCell className="py-6 px-6 text-right">
                      {format(new Date(report.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="py-6 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          onClick={() => handleViewPdf(report.pdf_url!)}
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-muted"
                          title="Visualizar PDF"
                        >
                          <Eye className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <a
                          href={report.pdf_url!}
                          download
                          className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5 text-muted-foreground" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

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
