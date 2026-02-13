import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PromoSettings } from "@/types";

export default function AdminSettings() {
  const { getSetting, updateSetting } = useAdmin();
  const [chatId, setChatId] = useState("");
  const [botToken, setBotToken] = useState("");
  const [promoSettings, setPromoSettings] = useState<PromoSettings>({
    isActionActive: false,
    actionTitle: "",
    requiredQuantity: 4,
    totalPrice: 7000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const id = await getSetting('telegram_chat_id');
    if (id) setChatId(id);

    const token = await getSetting('telegram_bot_token');
    if (token) setBotToken(token);

    const promoData = await getSetting('promo_settings');
    if (promoData) {
      try {
        setPromoSettings(JSON.parse(promoData));
      } catch (e) {
        console.error("Error parsing promo settings:", e);
      }
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    
    // Save Telegram settings
    const { error: idError } = await updateSetting('telegram_chat_id', chatId);
    const { error: tokenError } = await updateSetting('telegram_bot_token', botToken);
    
    setSaving(false);
    
    if (idError || tokenError) {
      toast.error("Greška pri čuvanju podešavanja.");
    } else {
      toast.success("Podešavanja uspešno sačuvana.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Podešavanja</h1>
        <Button variant="outline" onClick={() => navigate("/admin")}>
          Nazad
        </Button>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Telegram Obaveštenja</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botToken">Telegram Bot Token</Label>
              <Input
                id="botToken"
                placeholder="Unesite Telegram Bot Token"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                disabled={loading}
                type="password"
              />
              <p className="text-sm text-muted-foreground">
                Token vašeg Telegram bota (dobija se od @BotFather).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chatId">Telegram Chat ID</Label>
              <Input
                id="chatId"
                placeholder="Unesite Telegram Chat ID"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                ID na koji će stizati obaveštenja o novim porudžbinama.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || loading} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Čuvanje...
            </>
          ) : (
            "Sačuvaj sva podešavanja"
          )}
        </Button>
      </div>
    </div>
  );
}
