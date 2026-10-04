'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  Bell,
  Route,
  CheckCircle2,
  Leaf,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import styles from './notifications.module.css';

const ICON_MAP = {
  match: Route,
  booking: CheckCircle2,
  eco: Leaf,
  alert: AlertCircle,
};

const COLOR_MAP = {
  match: 'var(--accent-400)',
  booking: 'var(--primary-400)',
  eco: 'var(--primary-400)',
  alert: 'var(--warm-400)',
};

function NotificationsContent() {
  const { notifications, markNotificationRead } = useApp();

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <h1 className="heading-lg">Notifications</h1>

          <div className={styles.list}>
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const Icon = ICON_MAP[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    className={`${styles.notif} ${!n.read ? styles.unread : ''}`}
                    onClick={() => markNotificationRead(n.id)}
                    id={`notif-${n.id}`}
                  >
                    <div
                      className={styles.notifIcon}
                      style={{ color: COLOR_MAP[n.type] }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className={styles.notifBody}>
                      <p className={styles.notifMsg}>{n.message}</p>
                      <span className={styles.notifTime}>{n.time}</span>
                    </div>
                    {!n.read && <div className={styles.dot} />}
                  </button>
                );
              })
            ) : (
              <div className={styles.empty}>
                <Bell size={48} className={styles.emptyIcon} />
                <h3 className="heading-md">All caught up!</h3>
                <p className="text-base">No new notifications right now.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function NotificationsPage() {
  return (
    <AppProvider>
      <NotificationsContent />
    </AppProvider>
  );
}
