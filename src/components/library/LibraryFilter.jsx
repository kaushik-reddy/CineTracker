import { base44 } from "@/api/base44Client";

export async function getFilteredLibrary(userEmail) {
  try {
    const [allMedia, preferences, schedules, allUsers] = await Promise.all([
      base44.entities.Media.list(),
      base44.entities.UserPreferences.filter({ user_email: userEmail }),
      base44.entities.WatchSchedule.filter({ created_by: userEmail }),
      base44.entities.User.list()
    ]);

    const userPrefs = preferences.length > 0 ? preferences[0] : { include_global_library: true };
    const adminEmails = allUsers.filter(u => u.role === 'admin').map(u => u.email);
    
    const userInteractedMediaIds = new Set(schedules.map(s => s.media_id));

    const filteredMedia = allMedia.filter(media => {
      const isGlobal = adminEmails.includes(media.created_by);
      const isUserOwned = media.created_by === userEmail;
      const hasInteracted = userInteractedMediaIds.has(media.id);

      if (isUserOwned) return true;

      if (isGlobal) {
        if (userPrefs.include_global_library) return true;
        if (hasInteracted) return true;
        return false;
      }

      return false;
    });

    return filteredMedia;
  } catch (error) {
    console.error('Failed to filter library:', error);
    return [];
  }
}

export async function getGlobalLibraryStats(userEmail) {
  try {
    const [allMedia, allUsers] = await Promise.all([
      base44.entities.Media.list(),
      base44.entities.User.list()
    ]);

    const adminEmails = allUsers.filter(u => u.role === 'admin').map(u => u.email);
    const globalCount = allMedia.filter(m => adminEmails.includes(m.created_by)).length;
    const userCount = allMedia.filter(m => m.created_by === userEmail).length;

    return { globalCount, userCount, totalCount: allMedia.length };
  } catch (error) {
    console.error('Failed to get library stats:', error);
    return { globalCount: 0, userCount: 0, totalCount: 0 };
  }
}