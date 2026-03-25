import { createContext, useContext, useCallback } from 'react';
import Toast from 'react-native-toast-message';

var ToastContext = createContext(null);

export function useToast() {
  var ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }) {
  var showToast = useCallback(function (message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 3000;

    // Map our types to react-native-toast-message types
    var toastType = 'info';
    if (type === 'success') toastType = 'success';
    else if (type === 'error' || type === 'warning') toastType = 'error';

    Toast.show({
      type: toastType,
      text1: message,
      visibilityTime: duration,
      position: 'top',
      topOffset: 60,
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: showToast }}>
      {children}
      <Toast />
    </ToastContext.Provider>
  );
}
