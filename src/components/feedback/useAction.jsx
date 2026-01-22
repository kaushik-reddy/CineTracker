import { useActionFeedback } from './ActionFeedbackContext';

export function useAction() {
  const { showAction, showSuccess, showError, dismiss } = useActionFeedback();

  const executeAction = async (actionName, actionFn, options = {}) => {
    const {
      successTitle,
      successSubtitle,
      errorTitle,
      errorSubtitle,
      onSuccess,
      onError
    } = options;

    try {
      showAction(actionName);
      const result = await actionFn();
      
      showSuccess(
        successTitle || `${actionName} Successfully`,
        successSubtitle || 'Your action has been completed'
      );

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result);
        }, 1800);
      }

      return result;
    } catch (error) {
      showError(
        errorTitle || `${actionName} Failed`,
        errorSubtitle || error.message || 'Something went wrong'
      );

      if (onError) {
        setTimeout(() => {
          onError(error);
          dismiss();
        }, 2000);
      } else {
        setTimeout(dismiss, 2000);
      }

      throw error;
    }
  };

  return { executeAction };
}