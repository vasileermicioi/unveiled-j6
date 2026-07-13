import type { AppSession } from "@unveiled/auth";
import type {
  Booking,
  Event,
  MemberDetail,
  MemberListItem,
  Partner,
  UserBehavior,
  UserProfile,
  WaitlistEntry,
} from "@unveiled/db";
import type { EventCardItem } from "@unveiled/ui";

import type { DiscoverPartnerTile } from "../../lib/catalog-mappers";
import type { AdminMetrics } from "../admin/AdminKpiGrid";

/**
 * Story image URLs resolve via IMAGE_PUBLIC_BASE_URL.
 * Ladle vite configs define a fallback when the env var is unset (see `.ladle/vite.config.ts`).
 */
export const mockImageId = "00000000-0000-4000-8000-000000000001";
export const mockEventId = "00000000-0000-4000-8000-000000000002";
export const mockPartnerId = "00000000-0000-4000-8000-000000000003";

const storyNow = new Date("2026-08-15T19:00:00+02:00");

export const mockProfile: UserProfile = {
  first_name: "Alex",
  last_name: "Berlin",
  age_group: "26-35",
  interests: ["music", "theatre"],
  moods: ["curious"],
  districts: ["kreuzberg", "neukolln"],
  timing: ["evening"],
  preferred_days: ["fri", "sat"],
  preferred_languages: ["DE", "EN"],
  max_distance: 10,
  accessibility: false,
  language: "DE",
  onboarding_complete: true,
};

export const mockBehavior: UserBehavior = {
  session_count: 3,
  booking_count: 1,
};

export const mockUserSession: AppSession = {
  user: {
    id: "story-user-001",
    email: "member@example.com",
    role: "USER",
    partnerId: null,
    credits: 12,
    onboardingComplete: true,
    profile: mockProfile,
    behavior: mockBehavior,
  },
};

export const mockAdminSession: AppSession = {
  user: {
    id: "story-admin-001",
    email: "admin@example.com",
    role: "ADMIN",
    partnerId: null,
    credits: 0,
    onboardingComplete: true,
    profile: { first_name: "Admin", last_name: "User" },
    behavior: {},
  },
};

export const mockEvent: Event = {
  id: mockEventId,
  partnerId: mockPartnerId,
  partnerName: "Literaturhaus Berlin",
  title: "Poetry & Jazz Night",
  description: "An evening of spoken word and live jazz in Charlottenburg.",
  address: "Fasanenstraße 23, 10719 Berlin",
  neighborhood: "Charlottenburg",
  imageId: mockImageId,
  category: "Music",
  eventType: "Live",
  tags: ["jazz", "poetry"],
  dateTime: storyNow,
  timingMode: "TIME_SLOT",
  startTimeMinutes: 1140,
  weekday: 5,
  creditPrice: 2,
  totalCapacity: 40,
  remainingCapacity: 12,
  ticketType: "SECRET_CODE",
  secretCodeMode: "MANUAL",
  secretCode: null,
  promoCode: null,
  eventWebsiteUrl: null,
  barrierFree: true,
  languages: ["DE", "EN"],
  targetAgeGroups: ["18-25", "26-35"],
  lat: "52.5025",
  lng: "13.3275",
  mapZoom: 14,
  createdAt: storyNow,
  updatedAt: storyNow,
};

export const mockSoldOutEvent: Event = {
  ...mockEvent,
  id: "00000000-0000-4000-8000-000000000004",
  remainingCapacity: 0,
};

export const mockPartner: Partner = {
  id: mockPartnerId,
  name: "Literaturhaus Berlin",
  address: "Fasanenstraße 23, 10719 Berlin",
  contactEmail: "team@literaturhaus.de",
  logoImageId: mockImageId,
  venueCheckInToken: null,
  portalUserId: null,
  portalUserEmail: null,
  createdAt: storyNow,
  updatedAt: storyNow,
};

export const mockEventCardItem: EventCardItem = {
  id: mockEvent.id,
  title: mockEvent.title,
  partnerName: mockEvent.partnerName,
  dateTime: mockEvent.dateTime,
  neighborhood: mockEvent.neighborhood,
  creditPrice: mockEvent.creditPrice,
  remainingCapacity: mockEvent.remainingCapacity,
  ticketType: mockEvent.ticketType,
  category: mockEvent.category,
  imageId: mockEvent.imageId,
};

export const mockDiscoverPartner: DiscoverPartnerTile = {
  id: mockPartner.id,
  name: mockPartner.name,
  address: mockPartner.address,
  initial: "L",
};

export const mockAdminMetrics: AdminMetrics = {
  partnerCount: 8,
  eventCount: 24,
  upcomingEventCount: 14,
  remainingCapacity: 186,
};

export const mockAdminListQuery = {
  q: "",
  page: 1,
  limit: 10,
};

export const mockMemberId = "00000000-0000-4000-8000-000000000020";

export const mockMemberListItem: MemberListItem = {
  id: mockMemberId,
  email: "member@example.com",
  role: "USER",
  credits: 12,
  subscriptionStatus: "ACTIVE",
  bookingCount: 2,
  eventOpenCount: 5,
  profile: mockProfile,
  behavior: mockBehavior,
};

export const mockMemberDetail: MemberDetail = {
  user: {
    id: mockMemberId,
    email: "member@example.com",
    emailVerified: true,
    role: "USER",
    credits: 12,
    partnerId: null,
    profile: mockProfile,
    behavior: {
      ...mockBehavior,
      event_open_count: 5,
      filter_apply_count: 2,
      saved_count: 1,
      unsaved_count: 0,
      last_view: "2026-08-14T18:00:00+02:00",
      last_seen_at: "2026-08-15T10:00:00+02:00",
      last_booked_event_id: mockEventId,
      recent_event_ids: [mockEventId],
    },
    createdAt: storyNow,
    updatedAt: storyNow,
    deletedAt: null,
  },
  subscription: {
    userId: mockMemberId,
    status: "ACTIVE",
    periodEnd: storyNow,
    plan: "basic_berlin",
    stripeCustomerId: "cus_story",
    stripeSubscriptionId: "sub_story",
    paymentMethod: "CARD",
    billingAddress: null,
    createdAt: storyNow,
    updatedAt: storyNow,
  },
  counts: {
    bookings: 2,
    waitlistEntries: 1,
    savedEvents: 3,
  },
};

export const mockEventImageUrls: Record<string, string | undefined> = {
  [mockEvent.id]: undefined,
};

export const mockPartnerLogoUrls: Record<string, string | undefined> = {
  [mockPartner.id]: undefined,
};

export const mockBookingId = "00000000-0000-4000-8000-000000000010";

export const mockBooking: Booking = {
  id: mockBookingId,
  userId: mockUserSession.user.id,
  eventId: mockEvent.id,
  partnerId: mockPartnerId,
  ticketsCount: 2,
  totalCredits: 4,
  status: "CONFIRMED",
  redemptionType: "SECRET_CODE",
  redemptionInfo: "UV-DEMO42",
  redemptionUrl: null,
  idempotencyKey: "story-idempotency-key",
  checkedInAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: storyNow,
  updatedAt: storyNow,
};

export const mockVoucherBooking: Booking = {
  ...mockBooking,
  id: "00000000-0000-4000-8000-000000000011",
  redemptionType: "VOUCHER",
  redemptionInfo: "PARTNER10",
  redemptionUrl: "https://example.com/voucher",
};

export const mockWaitlistEntryId = "00000000-0000-4000-8000-000000000030";

export const mockWaitlistEntry: WaitlistEntry = {
  id: mockWaitlistEntryId,
  eventId: mockEventId,
  userId: mockMemberId,
  requestedQty: 1,
  status: "WAITING",
  skippedOnce: false,
  createdAt: storyNow,
  updatedAt: storyNow,
};

export const storyLocale = "de" as const;
export const storyPathname = "/de";
