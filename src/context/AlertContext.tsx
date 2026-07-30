import { createContext, ReactNode, useState } from 'react';
import { AlertStatus } from 'types';

export type AlertContextValue = {
  message: string;
  status: AlertStatus | '';
  isVisible: boolean;
  showAlert: (
    alertMessage: string,
    alertStatus: AlertStatus,
    persist?: boolean
  ) => void;
};

export const AlertContext = createContext<AlertContextValue | undefined>(
  undefined
);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<AlertStatus | ''>('');
  const [isVisible, setIsVisible] = useState(false);

  const showAlert = (
    alertMessage: string,
    alertStatus: AlertStatus,
    persist?: boolean
  ) => {
    setMessage(alertMessage);
    setStatus(alertStatus);
    setIsVisible(true);

    if (!persist) setTimeout(() => setIsVisible(false), 2000);
  };

  return (
    <AlertContext.Provider value={{ message, status, isVisible, showAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
