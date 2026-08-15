import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';
import { adminApi, getErrorMessage } from '@/lib/api';

const settingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  contactEmail: z.string().email('Invalid email'),
  currency: z.string().min(1),
  enableReviews: z.boolean(),
  enableWishlists: z.boolean(),
  maintenanceMode: z.boolean(),
  announcement: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: '',
      contactEmail: '',
      currency: 'USD',
      enableReviews: true,
      enableWishlists: true,
      maintenanceMode: false,
      announcement: '',
    },
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminApi.getSettings();
        if (cancelled) return;
        const data = (res.data ?? {}) as Partial<SettingsForm>;
        form.reset({
          siteName: data.siteName ?? '',
          contactEmail: data.contactEmail ?? '',
          currency: data.currency ?? 'USD',
          enableReviews: data.enableReviews ?? true,
          enableWishlists: data.enableWishlists ?? true,
          maintenanceMode: data.maintenanceMode ?? false,
          announcement: data.announcement ?? '',
        });
      } catch (err) {
        toast({
          title: 'Failed to load settings',
          description: getErrorMessage(err),
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [form, toast]);

  const onSubmit = async (values: SettingsForm) => {
    setSaving(true);
    try {
      await adminApi.updateSettings(values);
      toast({ title: 'Settings saved', variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Failed to save',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-1 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure site-wide options.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Core site identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Toggle user-facing features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enableReviews"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border p-4">
                    <div>
                      <FormLabel>Reviews</FormLabel>
                      <FormDescription>Allow customers to leave reviews.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="enableWishlists"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border p-4">
                    <div>
                      <FormLabel>Wishlists</FormLabel>
                      <FormDescription>Allow customers to save products.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-destructive/50 p-4">
                    <div>
                      <FormLabel className="text-destructive">Maintenance mode</FormLabel>
                      <FormDescription>Show a maintenance banner.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Announcement</CardTitle>
              <CardDescription>Optional site-wide banner.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="announcement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || loading}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}