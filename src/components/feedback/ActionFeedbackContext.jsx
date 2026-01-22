import React, { createContext, useContext, useState } from 'react';

const ActionFeedbackContext = createContext(null);

export function ActionFeedbackProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    status: 'loading', // 'loading' | 'success' | 'error'
    action: '', // 'Deleting', 'Scheduling', 'Processing', etc.
    title: '',
    subtitle: ''
  });

  const showAction = (action, title = '') => {
    setState({
      isOpen: true,
      status: 'loading',
      action,
      title,
      subtitle: 'Please wait, do not close this window'
    });
  };

  const showSuccess = (title = '', subtitle = 'Your action has been completed') => {
    setState(prev => ({
      ...prev,
      status: 'success',
      title,
      subtitle
    }));
  };

  const showError = (title = '', subtitle = '') => {
    setState(prev => ({
      ...prev,
      status: 'error',
      title,
      subtitle
    }));
  };

  const dismiss = () => {
    setState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return (
    <ActionFeedbackContext.Provider value={{ state, showAction, showSuccess, showError, dismiss }}>
      {children}
    </ActionFeedbackContext.Provider>
  );
}

export function useActionFeedback() {
  const context = useContext(ActionFeedbackContext);
  if (!context) {
    throw new Error('useActionFeedback must be used within ActionFeedbackProvider');
  }
  return context;
}