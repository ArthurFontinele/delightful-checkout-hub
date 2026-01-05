import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, ShoppingCart, LogOut, Edit, Trash2, Eye, Link, Settings, Save, DollarSign, TrendingUp, Plug, CreditCard, LayoutDashboard, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeonButton } from "@/components/ui/neon-button";
import { InteractiveMenu, InteractiveMenuItem } from "@/components/ui/modern-mobile-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  banner_url: string | null;
  slug: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Order {
  id: string;
  product_id: string | null;
  customer_email: string;
  customer_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  products?: { name: string } | null;
}

const adminMenuItems: InteractiveMenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, value: 'dashboard' },
  { label: 'Productos', icon: Package, value: 'products' },
  { label: 'Pedidos', icon: ShoppingCart, value: 'orders' },
  { label: 'Facturación', icon: DollarSign, value: 'billing' },
  { label: 'Conversión', icon: TrendingUp, value: 'conversion' },
  { label: 'Config', icon: Settings, value: 'settings' },
];

const Admin = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "EUR",
    image_url: "",
    banner_url: "",
    slug: "",
  });

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "tiktok_pixel_id")
      .single();
    
    if (data?.value) {
      setTiktokPixelId(data.value);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: "tiktok_pixel_id", value: tiktokPixelId }, { onConflict: "key" });
      
      if (error) throw error;
      toast.success("Configuración guardada");
    } catch (error: any) {
      toast.error("Error al guardar la configuración");
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, products(name)").order("created_at", { ascending: false }),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[]);
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      currency: formData.currency,
      image_url: formData.image_url || null,
      banner_url: formData.banner_url || null,
      slug: formData.slug || null,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        
        if (error) throw error;
        toast.success("Producto actualizado");
      } else {
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          "create-stripe-product",
          { body: productData }
        );

        if (stripeError) throw stripeError;

        const { error } = await supabase.from("products").insert({
          ...productData,
          stripe_product_id: stripeData.productId,
          stripe_price_id: stripeData.priceId,
        });

        if (error) throw error;
        toast.success("Producto creado");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al guardar el producto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este producto?")) return;

    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar el producto");
    } else {
      toast.success("Producto eliminado");
      fetchData();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      currency: product.currency,
      image_url: product.image_url || "",
      banner_url: product.banner_url || "",
      slug: product.slug || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      currency: "EUR",
      image_url: "",
      banner_url: "",
      slug: "",
    });
  };

  const copyCheckoutLink = (product: Product) => {
    const slug = product.slug || product.id;
    const url = `${window.location.origin}/checkout/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground">Pagado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate conversion rate
  const paidOrders = orders.filter((o) => o.status === "paid").length;
  const conversionRate = orders.length > 0 ? ((paidOrders / orders.length) * 100).toFixed(1) : "0";

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{products.filter((p) => p.is_active).length}</div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{orders.length}</div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Pagadas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatPrice(orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amount, 0), "EUR")}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Estado de Integraciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Stripe API</p>
                <p className="text-sm text-muted-foreground">Procesamiento de pagos</p>
              </div>
            </div>
            <Badge className="bg-success text-success-foreground">Conectado</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">TikTok Pixel</p>
                <p className="text-sm text-muted-foreground">Tracking de conversiones</p>
              </div>
            </div>
            {tiktokPixelId ? (
              <Badge className="bg-success text-success-foreground">Configurado</Badge>
            ) : (
              <Badge variant="secondary">No configurado</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Productos</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <NeonButton variant="solid" size="lg" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </NeonButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Input id="currency" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL del producto)</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} placeholder="mi-producto" />
                <p className="text-xs text-muted-foreground">URL: /checkout/{formData.slug || 'mi-producto'}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL de Imagen del Producto</Label>
                <Input id="image_url" type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner_url">URL del Banner</Label>
                <Input id="banner_url" type="url" value={formData.banner_url} onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })} placeholder="https://..." />
              </div>
              <NeonButton type="submit" variant="solid" size="lg" className="w-full">
                {editingProduct ? "Guardar Cambios" : "Crear Producto"}
              </NeonButton>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">📦</div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatPrice(product.price, product.currency)}</TableCell>
                <TableCell>
                  {product.is_active ? (
                    <Badge className="bg-success text-success-foreground">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(product.created_at)}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{product.slug || product.id}</code>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => copyCheckoutLink(product)} title="Copiar enlace de checkout">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => window.open(`/checkout/${product.slug || product.id}`, "_blank")} title="Ver checkout">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay productos. Crea tu primer producto.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Pedidos</h2>

      <Card className="card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{(order.products as any)?.name || "—"}</TableCell>
                <TableCell className="font-medium">{formatPrice(order.amount, order.currency)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(order.created_at)}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay pedidos aún.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Facturación</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumen de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Pagado</span>
              <span className="text-2xl font-bold text-success">
                {formatPrice(orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amount, 0), "EUR")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pendiente</span>
              <span className="text-xl font-semibold text-warning">
                {formatPrice(orders.filter((o) => o.status === "pending").reduce((sum, o) => sum + o.amount, 0), "EUR")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fallido</span>
              <span className="text-xl font-semibold text-destructive">
                {formatPrice(orders.filter((o) => o.status === "failed").reduce((sum, o) => sum + o.amount, 0), "EUR")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Estadísticas de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Pedidos</span>
              <span className="text-2xl font-bold">{orders.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pagados</span>
              <span className="text-xl font-semibold text-success">{paidOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pendientes</span>
              <span className="text-xl font-semibold text-warning">{orders.filter((o) => o.status === "pending").length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderConversion = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Tasa de Conversión</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Conversión General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{conversionRate}%</div>
            <p className="text-sm text-muted-foreground mt-2">{paidOrders} de {orders.length} pedidos completados</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pagados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-success">{paidOrders}</div>
            <p className="text-sm text-muted-foreground mt-2">Transacciones exitosas</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Fallidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-destructive">{orders.filter((o) => o.status === "failed").length}</div>
            <p className="text-sm text-muted-foreground mt-2">Transacciones fallidas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Consejos para Mejorar la Conversión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-2">
            <li>Optimiza la página de checkout para reducir fricciones</li>
            <li>Usa ofertas de tiempo limitado para crear urgencia</li>
            <li>Implementa el back redirect para recuperar usuarios que abandonan</li>
            <li>Asegúrate de que el TikTok Pixel está configurado correctamente</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Configuración</h2>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            TikTok Pixel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tiktok_pixel">ID del Pixel de TikTok</Label>
            <Input
              id="tiktok_pixel"
              value={tiktokPixelId}
              onChange={(e) => setTiktokPixelId(e.target.value)}
              placeholder="Ej: XXXXXXXXXXXXXXXXXX"
            />
            <p className="text-sm text-muted-foreground">Encuentra tu Pixel ID en TikTok Ads Manager → Herramientas → Eventos</p>
          </div>
          <NeonButton onClick={saveSettings} disabled={savingSettings} variant="solid" size="lg" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {savingSettings ? "Guardando..." : "Guardar Configuración"}
          </NeonButton>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Integración con Stripe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Eventos automáticos:</strong> El pixel rastrea automáticamente:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code className="bg-muted px-1 rounded">PageView</code> - Cuando el usuario visita la página</li>
            <li><code className="bg-muted px-1 rounded">InitiateCheckout</code> - Cuando el usuario inicia el checkout</li>
            <li><code className="bg-muted px-1 rounded">CompletePayment</code> - Cuando se completa el pago</li>
          </ul>
          <p className="pt-2">
            <strong className="text-foreground">Para tracking server-side con Stripe:</strong> Configura un webhook de Stripe 
            que envíe eventos a la API de TikTok Events cuando se complete un pago. Esto es más preciso 
            que el tracking del navegador.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-header py-4 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-foreground">Panel de Administración</h1>
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
          <LogOut className="h-4 w-4 mr-2" />
          Salir
        </Button>
      </header>

      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border py-3 px-4">
        <InteractiveMenu 
          items={adminMenuItems} 
          activeValue={activeSection}
          onItemClick={setActiveSection}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeSection === "dashboard" && renderDashboard()}
        {activeSection === "products" && renderProducts()}
        {activeSection === "orders" && renderOrders()}
        {activeSection === "billing" && renderBilling()}
        {activeSection === "conversion" && renderConversion()}
        {activeSection === "settings" && renderSettings()}
      </div>
    </div>
  );
};

export default Admin;
