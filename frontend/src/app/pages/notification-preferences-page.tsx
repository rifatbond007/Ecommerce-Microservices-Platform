import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Settings, AlertCircle, CheckCircle2, BellRing, Mail, Smartphone, Globe } from 'lucide-react';

interface Preference {
  key: string;
  label: string;
  enabled: boolean;
  channel?: 'push' | 'email' | 'sms' | 'in-app';
}

const channelIcons: Record<string, typeof BellRing> = {
  push: BellRing,
  email: Mail,
  sms: Smartphone,
  'in-app': Globe,
};

const channelLabels: Record<string, string> = {
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
  'in-app': 'In-App',
};

export function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/notifications/preferences');
      setPreferences(r.data.preferences || []);
    } catch {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback((key: string) => {
    setPreferences(prev => prev.map(p => p.key === key ? { ...p, enabled: !p.enabled } : p));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/notifications/preferences', { preferences });
      setSuccess('Preferences saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  const enabledCount = preferences.filter(p => p.enabled).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-48 mb-8" />
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-1"
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Preferences</h1>
          <p className="text-muted-foreground mt-1">
            {enabledCount} of {preferences.length} notification types enabled
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-8"
      >
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-success mb-4 p-4 rounded-xl bg-success/10 border border-success/20 overflow-hidden"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-destructive mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 overflow-hidden"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Notification Types</CardTitle>
            <CardDescription>Choose which notifications you'd like to receive</CardDescription>
          </CardHeader>
          <CardContent>
            {preferences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BellRing className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No preferences available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {preferences.map((p, i) => {
                  const ChannelIcon = p.channel ? channelIcons[p.channel] : BellRing;
                  return (
                    <motion.div
                      key={p.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center shrink-0 group-hover:from-primary/10 group-hover:to-accent/10 transition-colors">
                            <ChannelIcon className="h-4.5 w-4.5 text-primary/60" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.label}</p>
                            {p.channel && (
                              <Badge variant="secondary" className="text-[10px] leading-none py-0 px-1.5 mt-0.5">
                                {channelLabels[p.channel] || p.channel}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={p.enabled}
                          onCheckedChange={() => toggle(p.key)}
                          className="shrink-0"
                        />
                      </div>
                      {i < preferences.length - 1 && (
                        <Separator className="last:hidden" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {preferences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-6"
          >
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="rounded-xl shadow-sm px-8"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent mr-2" />
              ) : null}
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
