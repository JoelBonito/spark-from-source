import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smile, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SimulatorPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    setLoading(true);
    toast.info('Gerando simulação...');
    setTimeout(() => {
      setLoading(false);
      toast.success('Simulação gerada com sucesso!');
    }, 2000);
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Simulador de Sorriso</h1>
        <p className="text-muted-foreground mt-1">
          Carregue uma foto e gere simulações com IA
        </p>
      </div>

      <Tabs defaultValue="input" className="w-full">
        <TabsList>
          <TabsTrigger value="input">Entrada</TabsTrigger>
          <TabsTrigger value="result" disabled={!selectedImage}>
            Resultado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-display">Configurar Simulação</CardTitle>
              <CardDescription>
                Selecione o paciente, tipo de tratamento e faça upload da imagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Maria Silva</SelectItem>
                    <SelectItem value="2">João Santos</SelectItem>
                    <SelectItem value="3">Ana Costa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Tratamento</Label>
                <Select defaultValue="facetas">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facetas">Facetas</SelectItem>
                    <SelectItem value="clareamento">Clareamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Imagem do Sorriso</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Clique para fazer upload ou arraste uma imagem
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedImage || loading}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? 'Gerando...' : 'Gerar Simulação'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-display">Resultado da Simulação</CardTitle>
              <CardDescription>Visualize o antes e depois</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Antes</h3>
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Antes"
                      className="rounded-lg w-full"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Depois</h3>
                  <div className="bg-muted rounded-lg aspect-square flex items-center justify-center">
                    <Smile className="h-16 w-16 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Salvar Simulação</Button>
                <Button variant="outline" className="flex-1">
                  Gerar Orçamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
