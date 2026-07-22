CREATE TABLE "event_gallery_images" (
	"event_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_gallery_images_event_id_image_id_pk" PRIMARY KEY("event_id","image_id")
);
--> statement-breakpoint
ALTER TABLE "event_gallery_images" ADD CONSTRAINT "event_gallery_images_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_gallery_images" ADD CONSTRAINT "event_gallery_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_gallery_images_event_id_sort_order_idx" ON "event_gallery_images" USING btree ("event_id","sort_order");