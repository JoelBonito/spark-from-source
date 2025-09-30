-- Create user_configs table to store user settings
CREATE TABLE public.user_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  backend_url TEXT NOT NULL,
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.4,
  top_k INTEGER NOT NULL DEFAULT 32,
  top_p DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  max_tokens INTEGER NOT NULL DEFAULT 8192,
  prompt_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own config" 
ON public.user_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config" 
ON public.user_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config" 
ON public.user_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own config" 
ON public.user_configs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_configs_updated_at
BEFORE UPDATE ON public.user_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();