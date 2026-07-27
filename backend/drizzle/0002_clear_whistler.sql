CREATE TABLE "key_backups" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"encrypted_private_key" text NOT NULL,
	"salt" text NOT NULL,
	"iv" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "key_backups" ADD CONSTRAINT "key_backups_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;