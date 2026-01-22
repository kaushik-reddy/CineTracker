/**
 * Utility to convert watch-related statuses to book-friendly text
 */

export function getBookStatusText(status) {
  const bookStatuses = {
    'scheduled': 'Scheduled Reading',
    'in_progress': 'Currently Reading',
    'paused': 'Reading Paused',
    'completed': 'Reading Complete',
    'unwatched': 'Unread',
    'watching': 'Reading',
    'watched': 'Read'
  };

  return bookStatuses[status] || status;
}

export function getBookActionText(action) {
  const bookActions = {
    'Watch': 'Read',
    'Start Watching': 'Start Reading',
    'Resume Watching': 'Resume Reading',
    'Continue Watching': 'Continue Reading',
    'Mark as Watched': 'Mark as Read',
    'Schedule Watch': 'Schedule Reading Session',
    'Reschedule': 'Reschedule Reading',
    'Now Watching': 'Now Reading',
    'Watch Now': 'Read Now',
    'Watched': 'Read',
    'Watching': 'Reading'
  };

  return bookActions[action] || action;
}

export function getBookButtonText(isBook, defaultText) {
  if (!isBook) return defaultText;
  return getBookActionText(defaultText);
}