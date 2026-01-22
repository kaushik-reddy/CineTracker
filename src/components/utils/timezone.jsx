// IST timezone utilities

// Convert any date to IST display format
export const toIST = (date) => {
  if (!date) return '';
  const d = new Date(date);
  // Add 5:30 hours for IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);
  return istDate;
};

// Format date in IST
export const formatIST = (date, formatStr = 'PPp') => {
  if (!date) return '';
  const istDate = toIST(date);
  
  // Simple formatters
  if (formatStr === 'PPp') {
    return istDate.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  
  if (formatStr === 'PPP') {
    return istDate.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (formatStr === 'PP') {
    return istDate.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  if (formatStr === 'MMM dd') {
    return istDate.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  }
  
  if (formatStr === 'MMM dd, yyyy') {
    return istDate.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Default
  return istDate.toLocaleString('en-IN');
};

// Get current IST date
export const nowIST = () => {
  return toIST(new Date());
};