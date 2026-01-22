import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Creates schedule entries for all viewers when someone schedules with multiple people
 */
export async function createViewerSchedules(mainSchedule, media, viewersData) {
  if (!viewersData || viewersData.length === 0) return;

  try {
    // Just ensure the main schedule has all viewers listed
    // The updated query in Home.js will now fetch schedules where user is in viewers array
    console.log(`Shared schedule created with ${viewersData.length} viewers`);
    
    // Optionally send notifications to invited viewers
    for (const viewer of viewersData) {
      try {
        await base44.integrations.Core.SendEmail({
          to: viewer.email,
          subject: 'You\'re invited to a Watch Party!',
          body: `${mainSchedule.viewers?.[0]?.name || 'Someone'} has invited you to watch ${media.title} together. Check your schedule to join!`
        });
      } catch (emailError) {
        console.warn('Failed to send invite email:', emailError);
      }
    }
  } catch (error) {
    console.error('Failed to notify viewers:', error);
  }
}

/**
 * Marks a schedule as complete for all viewers when one person completes it
 */
export async function completeForAllViewers(scheduleId, rating = null) {
  try {
    const schedule = await base44.entities.WatchSchedule.filter({ id: scheduleId });
    if (!schedule || schedule.length === 0) return;

    const mainSchedule = schedule[0];
    const currentTime = new Date().toISOString();

    // Find all related schedules (same media, season, episode, time)
    const relatedSchedules = await base44.entities.WatchSchedule.filter({
      media_id: mainSchedule.media_id,
      scheduled_date: mainSchedule.scheduled_date,
      season_number: mainSchedule.season_number || null,
      episode_number: mainSchedule.episode_number || null,
      status: { $ne: 'completed' }
    });

    // Update all related schedules
    for (const relSchedule of relatedSchedules) {
      await base44.entities.WatchSchedule.update(relSchedule.id, {
        status: 'completed',
        rating: rating,
        rating_submitted_at: currentTime,
        completed_by: (await base44.auth.me()).email
      });
    }

    return relatedSchedules.length;
  } catch (error) {
    console.error('Failed to complete for all viewers:', error);
    return 0;
  }
}

/**
 * Checks if user has pending reviews for shared watches
 */
export async function checkPendingReviews() {
  try {
    const user = await base44.auth.me();
    
    // Find completed shared watches without user's rating
    const pendingReviews = await base44.entities.WatchSchedule.filter({
      created_by: { $ne: user.email },
      status: 'completed',
      shared_watch: true,
      viewers: { $elemMatch: { user_id: user.id } }
    });

    return pendingReviews.filter(s => !s.rating || s.completed_by !== user.email);
  } catch (error) {
    console.error('Failed to check pending reviews:', error);
    return [];
  }
}

/**
 * Adds media to user's library if not already present
 */
export async function ensureMediaInLibrary(mediaId, userEmail) {
  try {
    const media = await base44.entities.Media.filter({ id: mediaId });
    if (!media || media.length === 0) return false;

    const existingMedia = media[0];
    
    // Check if this media was created by someone else
    if (existingMedia.created_by !== userEmail) {
      // Create a copy in user's library
      const newMedia = { ...existingMedia };
      delete newMedia.id;
      delete newMedia.created_date;
      delete newMedia.updated_date;
      delete newMedia.created_by;
      
      await base44.entities.Media.create(newMedia);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to add media to library:', error);
    return false;
  }
}