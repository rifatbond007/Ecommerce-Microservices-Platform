import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sellerApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Store, AlertCircle, Building2, Phone, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export function BecomeSellerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: '', description: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await sellerApi.becomeSeller(form);
      navigate('/seller');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit seller application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 16 }}
        className="w-full max-w-lg"
      >
        <Card className="rounded-xl shadow-sm border-t-4 border-t-primary">
          <CardHeader className="pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-3"
            >
              <Store className="h-7 w-7 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl">Become a Seller</CardTitle>
            <CardDescription className="text-base">
              Fill out the form below to start selling on our platform
            </CardDescription>
          </CardHeader>
          <Separator />
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-6">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-destructive p-4 rounded-xl bg-destructive/10 border border-destructive/20 overflow-hidden"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={e => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Your business or brand name"
                  required
                  className="h-11 rounded-lg shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Description
                </Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell us about your business and what you plan to sell"
                  rows={4}
                  required
                  className="flex h-24 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  required
                  className="h-11 rounded-lg shadow-sm"
                />
              </div>

              <div className="rounded-xl bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] border border-primary/10 p-4 mt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>By applying, you agree to our <span className="text-primary underline underline-offset-2 cursor-pointer">Seller Terms</span> and <span className="text-primary underline underline-offset-2 cursor-pointer">Marketplace Policies</span>.</p>
                    <p>We'll review your application and get back to you within 2-3 business days.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3 pt-2 pb-6">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl shadow-sm text-base"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
