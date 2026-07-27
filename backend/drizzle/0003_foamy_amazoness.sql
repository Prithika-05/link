ALTER TABLE "key_backups" RENAME TO "keyBackups";--> statement-breakpoint
ALTER TABLE "keyBackups" DROP CONSTRAINT "key_backups_user_id_User_id_fk";
--> statement-breakpoint
ALTER TABLE "keyBackups" ADD CONSTRAINT "keyBackups_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;