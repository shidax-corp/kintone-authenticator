import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showToast: (type: NotificationType, message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const showToast = useCallback(
    (type: NotificationType, message: string) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification: Notification = {
        id,
        type,
        message,
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, notification]);

      // 自動で3秒後に削除
      setTimeout(() => {
        removeNotification(id);
      }, 3000);
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, showToast, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
}) => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-center ${className || ''}`}>
      <style jsx>{`
        .notification-center {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
        }

        .notification {
          padding: 12px 24px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          max-width: 300px;
          word-wrap: break-word;
          color: white;
          pointer-events: auto;
          cursor: pointer;
          transition:
            opacity 0.3s ease,
            transform 0.3s ease;
        }

        .notification:hover {
          opacity: 0.9;
        }

        .notification.success {
          background: #4caf50;
        }

        .notification.error {
          background: #f44336;
        }

        .notification.info {
          background: #2196f3;
        }
      `}</style>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification ${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

// Utility function for use outside of React components
let globalShowToast:
  | ((type: NotificationType, message: string) => void)
  | null = null;

export const setGlobalShowToast = (
  showToastFn: (type: NotificationType, message: string) => void
) => {
  globalShowToast = showToastFn;
};

export const showToast = (type: NotificationType, message: string) => {
  if (globalShowToast) {
    globalShowToast(type, message);
  } else {
    console.warn('showToast called before NotificationProvider is ready');
  }
};

export default NotificationCenter;
