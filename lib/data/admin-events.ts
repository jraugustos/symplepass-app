import { createClient } from "@/lib/supabase/server";
import {
  Event,
  EventStatus,
  SportType,
  EventFormat,
  EventType,
} from "@/types/database.types";
import { slugify } from "@/lib/utils";

/**
 * Filters for admin events list
 */
export interface AdminEventFilters {
  status?: EventStatus;
  sport_type?: SportType;
  search?: string;
  organizer_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Get all events for admin with filters and pagination
 * Includes drafts and all statuses
 */
export async function getAllEventsForAdmin(filters: AdminEventFilters = {}) {
  try {
    const supabase = await createClient();
    const {
      status,
      sport_type,
      search,
      organizer_id,
      start_date,
      end_date,
      page = 1,
      pageSize = 20,
    } = filters;

    let query = supabase
      .from("events")
      .select("*, profiles!events_organizer_id_fkey(id, full_name, email)", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (sport_type) {
      query = query.eq("sport_type", sport_type);
    }

    if (organizer_id) {
      query = query.eq("organizer_id", organizer_id);
    }

    if (start_date) {
      query = query.gte("start_date", start_date);
    }

    if (end_date) {
      query = query.lte("start_date", end_date);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching admin events:", error);
      return { events: [], total: 0, page, pageSize };
    }

    return {
      events: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Error in getAllEventsForAdmin:", error);
    return { events: [], total: 0, page: 1, pageSize: 20 };
  }
}

/**
 * Get event by ID with all relations for admin editing
 */
export async function getEventByIdForAdmin(eventId: string) {
  try {
    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from("events")
      .select(
        `
        *,
        event_categories(*),
        event_kit_items(*),
        event_course_info(*),
        event_faqs(*),
        event_regulations(*),
        profiles!events_organizer_id_fkey(id, full_name, email)
      `,
      )
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event by ID:", error);
      return null;
    }

    return event;
  } catch (error) {
    console.error("Error in getEventByIdForAdmin:", error);
    return null;
  }
}

/**
 * Create a new event
 */
export async function createEvent(eventData: {
  title: string;
  description: string;
  location: {
    city: string;
    state: string;
    venue?: string;
    address?: string;
  };
  start_date: string;
  sport_type: SportType;
  event_type: EventType;
  event_format: EventFormat;
  organizer_id: string;
  banner_url?: string | null;
  end_date?: string | null;
  max_participants?: number | null;
  registration_start?: string | null;
  registration_end?: string | null;
  solidarity_message?: string | null;
  allows_pair_registration?: boolean;
  shirt_sizes?: string[];
  shirt_sizes_config?: any;
  status?: EventStatus;
  is_featured?: boolean;
  has_organizer?: boolean;
}) {
  try {
    const supabase = await createClient();

    // Generate unique slug
    const baseSlug = slugify(eventData.title);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists
    while (true) {
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Prepare data for insertion, removing shirt_sizes field
    const { shirt_sizes, ...dataWithoutShirtSizes } = eventData;

    const { data, error } = await supabase
      .from("events")
      .insert({
        ...dataWithoutShirtSizes,
        slug,
        status: eventData.status || "draft",
        is_featured: eventData.is_featured || false,
        has_organizer:
          eventData.has_organizer !== undefined
            ? eventData.has_organizer
            : true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in createEvent:", error);
    return { data: null, error: "Failed to create event" };
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  eventData: Partial<Event>,
  userId: string,
  userRole: string,
) {
  try {
    const supabase = await createClient();

    // Verify permissions
    if (userRole !== "admin") {
      const { data: event } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", eventId)
        .single();

      if (!event || event.organizer_id !== userId) {
        return { data: null, error: "Unauthorized" };
      }
    }

    // Remove shirt_sizes field if present (we only use shirt_sizes_config now)
    const { shirt_sizes, ...dataWithoutShirtSizes } = eventData as any;

    console.log(`[updateEvent] Updating event ${eventId}`);

    // Update without using .single() to avoid "cannot coerce" error
    const { data: updatedData, error } = await supabase
      .from("events")
      .update(dataWithoutShirtSizes)
      .eq("id", eventId)
      .select();

    if (error) {
      console.error("[updateEvent] Error updating event:", error);
      return { data: null, error: error.message };
    }

    // Check if update affected any rows
    if (!updatedData || updatedData.length === 0) {
      console.error("[updateEvent] Event not found or not updated");
      return { data: null, error: "Event not found" };
    }

    if (updatedData.length > 1) {
      console.warn(`[updateEvent] WARNING: Updated ${updatedData.length} events with same ID!`);
    }

    const data = updatedData[0];
    console.log(`[updateEvent] Successfully updated event ${eventId}`);
    return { data, error: null };
  } catch (error) {
    console.error("Error in updateEvent:", error);
    return { data: null, error: "Failed to update event" };
  }
}

/**
 * Delete an event (soft delete by setting status to cancelled)
 */
export async function deleteEvent(
  eventId: string,
  userId: string,
  userRole: string,
  hardDelete = false,
) {
  try {
    const supabase = await createClient();

    console.log(`[deleteEvent] Attempting to delete event ${eventId} by user ${userId} with role ${userRole}, hardDelete: ${hardDelete}`);

    // Verify permissions
    if (userRole !== "admin") {
      const { data: event, error: permError } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", eventId)
        .single();

      if (permError) {
        console.error("[deleteEvent] Permission check error:", permError);
        return { data: null, error: `Permission check failed: ${permError.message}` };
      }

      if (!event || event.organizer_id !== userId) {
        console.log("[deleteEvent] Unauthorized: user is not the organizer");
        return { data: null, error: "Unauthorized" };
      }
    }

    if (hardDelete) {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("[deleteEvent] Error hard deleting event:", error);
        return { data: null, error: error.message };
      }
      console.log(`[deleteEvent] Successfully hard deleted event ${eventId}`);
    } else {
      // Soft delete
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", eventId);

      if (error) {
        console.error("[deleteEvent] Error soft deleting event:", error);
        return { data: null, error: error.message };
      }
      console.log(`[deleteEvent] Successfully soft deleted (cancelled) event ${eventId}`);
    }

    return { data: true, error: null };
  } catch (error) {
    console.error("[deleteEvent] Error in deleteEvent:", error);
    return { data: null, error: "Failed to delete event" };
  }
}

/**
 * Update event status
 */
export async function updateEventStatus(
  eventId: string,
  status: EventStatus,
  userId: string,
  userRole: string,
) {
  try {
    const supabase = await createClient();

    console.log(`[updateEventStatus] Updating event ${eventId} to status ${status} by user ${userId} with role ${userRole}`);

    // Verify permissions
    if (userRole !== "admin") {
      const { data: event, error: permError } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", eventId)
        .single();

      if (permError) {
        console.error("[updateEventStatus] Permission check error:", permError);
        return { data: null, error: `Permission check failed: ${permError.message}` };
      }

      if (!event || event.organizer_id !== userId) {
        return { data: null, error: "Unauthorized" };
      }
    }

    // Update without .single() to avoid "cannot coerce" error
    const { data: updatedData, error } = await supabase
      .from("events")
      .update({ status })
      .eq("id", eventId)
      .select();

    if (error) {
      console.error("[updateEventStatus] Error updating event status:", error);
      return { data: null, error: error.message };
    }

    if (!updatedData || updatedData.length === 0) {
      console.error("[updateEventStatus] Event not found");
      return { data: null, error: "Event not found" };
    }

    const data = updatedData[0];
    console.log(`[updateEventStatus] Successfully updated event ${eventId} to status ${status}`);
    return { data, error: null };
  } catch (error) {
    console.error("[updateEventStatus] Error in updateEventStatus:", error);
    return { data: null, error: "Failed to update event status" };
  }
}

/**
 * Get event statistics
 */
export async function getEventStats(eventId: string) {
  try {
    const supabase = await createClient();

    // Get total registrations and revenue
    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select("payment_status, amount_paid")
      .eq("event_id", eventId);

    if (regError) {
      console.error("Error fetching registrations for stats:", regError);
      return null;
    }

    const totalRegistrations = registrations?.length || 0;
    const confirmedRegistrations =
      registrations?.filter((r) => r.payment_status === "paid").length || 0;
    const totalRevenue =
      registrations?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
    const confirmedRevenue =
      registrations
        ?.filter((r) => r.payment_status === "paid")
        .reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;

    // Get category stats
    const { data: categories, error: catError } = await supabase
      .from("event_categories")
      .select("id, name, max_participants, current_participants")
      .eq("event_id", eventId);

    if (catError) {
      console.error("Error fetching categories for stats:", catError);
    }

    const categoriesStats =
      categories?.map((cat) => ({
        category_id: cat.id,
        category_name: cat.name,
        registrations: cat.current_participants || 0,
        available_spots: cat.max_participants
          ? cat.max_participants - (cat.current_participants || 0)
          : null,
      })) || [];

    return {
      totalRegistrations,
      confirmedRegistrations,
      totalRevenue,
      confirmedRevenue,
      categoriesStats,
    };
  } catch (error) {
    console.error("Error in getEventStats:", error);
    return null;
  }
}
