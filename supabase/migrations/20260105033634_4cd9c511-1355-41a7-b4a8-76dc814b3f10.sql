-- Add slug and banner_url columns to products table
ALTER TABLE public.products 
ADD COLUMN slug TEXT UNIQUE,
ADD COLUMN banner_url TEXT;

-- Create index for slug lookups
CREATE INDEX idx_products_slug ON public.products(slug);