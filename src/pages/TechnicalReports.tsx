import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Report {
  id: string;
  created_at: string;
  technical_report_url: string;
  technical_notes: string;
  patient_name: string;
  patient_phone?: string;
}

export default function TechnicalReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('id, created_at, technical_report_url, technical_notes, patient_name, patient_phone')
        .not('technical_report_url', 'is', null)
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
    r.technical_notes?.toLowerCase().includes(search.toLowerCase()) ||
    r.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Relatórios Técnicos</h2>
            <p className="text-muted-foreground">Todos os relatórios gerados pelo sistema</p>
          </div>
        </div>

        {/* Busca */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número ou paciente..."
              className="pl-10"
            />
          </div>
        </Card>

        {/* Grid de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum relatório encontrado
            </div>
          ) : (
            filteredReports.map((report) => (
              <Card
                key={report.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(report.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>

                <h3 className="font-bold mb-2">
                  {report.technical_notes || 'Relatório Técnico'}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Paciente: {report.patient_name || 'N/A'}
                </p>

                <div className="flex gap-2">
                  <Button
                    asChild
                    className="flex-1"
                    size="sm"
                  >
                    <a
                      href={report.technical_report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <a
                      href={report.technical_report_url}
                      download
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
