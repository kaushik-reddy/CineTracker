import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function WatchParties() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Home with watchparty view
    navigate(createPageUrl('Home'), { replace: true });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: { view: 'watchparty' } }));
    }, 100);
  }, [navigate]);

  return null;
}