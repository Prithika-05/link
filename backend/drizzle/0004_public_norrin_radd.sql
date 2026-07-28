CREATE TYPE "public"."ContactRequestStatus" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "ContactRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"senderId" text NOT NULL,
	"receiverId" text NOT NULL,
	"status" "ContactRequestStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_receiverId_User_id_fk" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ContactRequest_senderId_idx" ON "ContactRequest" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "ContactRequest_receiverId_idx" ON "ContactRequest" USING btree ("receiverId");--> statement-breakpoint
CREATE INDEX "ContactRequest_unique_pair" ON "ContactRequest" USING btree ("senderId","receiverId");