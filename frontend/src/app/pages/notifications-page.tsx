import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, Trash2, AlertCircle, BellOff, Info, ShoppingBag, AlertTriangle, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  order: { icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
  alert: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  promo: { icon: Megaphone, color: 'text-accent', bg: 'bg-accent/10' },
  info: { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const notificationItem = {
  hidden: { opacity: 0, x: -16, height: 0 },
  show: { opacity: 1, x: 0, height: 'auto', transition: { type: 'spring' as const, stiffness: 120, damping: 16 } },
  exit: { opacity: 0, x: 16, height: 0, transition: { duration: 0.2 } },
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data.notifications || []);
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // silently fail
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      // silently fail
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="rounded-xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : notifications.length > 0
                ? 'All caught up'
                : 'No notifications yet'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="rounded-full shadow-sm h-9"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </motion.div>

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

      {notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6">
            {unreadCount > 0 ? (
              <Bell className="h-10 w-10 text-primary/60" />
            ) : (
              <BellOff className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {unreadCount > 0 ? 'No notifications' : 'All caught up!'}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {unreadCount > 0
              ? 'Notifications about orders, promotions, and updates will appear here.'
              : 'You have no unread notifications. We\'ll notify you when something new arrives.'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {notifications.map(n => {
              const config = typeConfig[n.type] || typeConfig.info;
              const Icon = config.icon;
              return (
                <motion.div
                  key={n.id}
                  layout
                  variants={notificationItem}
                  exit="exit"
                >
                  <Card
                    className={cn(
                      'rounded-xl shadow-sm transition-all duration-200',
                      !n.read
                        ? 'border-primary/20 bg-gradient-to-r from-primary/[0.03] to-transparent'
                        : 'hover:bg-muted/30',
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                            config.bg,
                          )}
                        >
                          <Icon className={cn('h-4.5 w-4.5', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-0.5" />
                              )}
                              <p
                                className={cn(
                                  'text-sm font-medium truncate',
                                  !n.read && 'text-foreground',
                                  n.read && 'text-muted-foreground',
                                )}
                              >
                                {n.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!n.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                                  onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                                >
                                  <CheckCheck className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-destructive/10"
                                onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                              </Button>
                            </div>
                          </div>
                          <p className={cn('text-sm mt-1 leading-relaxed', n.read ? 'text-muted-foreground/70' : 'text-muted-foreground')}>
                            {n.message}
                          </p>
                          <p className="text-xs text-muted-foreground/50 mt-2">
                            {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' '}
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
