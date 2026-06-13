import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Preference {
  key: string;
  label: string;
  enabled: boolean;
}

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
    } catch {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-green-600 mb-4 p-3 rounded-md bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-destructive mb-4 p-3 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No preferences available</p>
          ) : (
            preferences.map(p => (
              <div key={p.key} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">{p.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.enabled}
                  onClick={() => toggle(p.key)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    p.enabled ? 'bg-primary' : 'bg-input'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform',
                      p.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                    )}
                  />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {preferences.length > 0 && (
        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      )}
    </div>
  );
}
