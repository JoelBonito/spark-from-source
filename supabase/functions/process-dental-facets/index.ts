const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, prompt, config } = await req.json();

    if (!imageBase64) {
      throw new Error('Imagem não fornecida');
    }

    if (!prompt) {
      throw new Error('Prompt não fornecido');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurada');
      throw new Error('API Key não configurada');
    }

    console.log('Processando imagem com Gemini 2.5 Flash Image Preview...');
    console.log('Config:', config);

    // Call Lovable AI Gateway with Gemini 2.5 Flash Image Preview
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text'],
        ...(config && {
          temperature: config.temperature,
          top_k: config.topK,
          top_p: config.topP,
          max_tokens: config.maxOutputTokens,
        })
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API do Gemini:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns instantes.');
      }
      
      if (response.status === 402) {
        throw new Error('Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.');
      }
      
      throw new Error(`Erro na API do Gemini: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Resposta recebida do Gemini');

    // Extract the generated image from the response
    const generatedImage = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error('Resposta do Gemini sem imagem:', JSON.stringify(result));
      throw new Error('Nenhuma imagem foi gerada pela API');
    }

    console.log('Imagem processada com sucesso');

    return new Response(
      JSON.stringify({ imageBase64: generatedImage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro no processamento:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar imagem';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
