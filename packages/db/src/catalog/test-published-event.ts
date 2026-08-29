import type { Db } from "../index";
import type { Event } from "../schema/events";
import { type CreateEventInput, createEvent, setEventPublished } from "./events";

/** Test helper: create then publish so public/member/booking readers see the row. */
export async function createPublishedEvent(db: Db, input: CreateEventInput): Promise<Event> {
  const event = await createEvent(db, input);
  return setEventPublished(db, event.id, true);
}
