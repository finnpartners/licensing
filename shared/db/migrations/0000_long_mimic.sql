CREATE TABLE "finn_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"email" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finn_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"github_repo" varchar(255) NOT NULL,
	"description" text,
	"latest_version" varchar(50),
	"release_date" timestamp,
	"changelog" text,
	"download_url" text,
	"requires_wp" varchar(20),
	"tested_wp" varchar(20),
	"requires_php" varchar(20),
	"last_checked" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "finn_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "finn_releases" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"version" varchar(50) NOT NULL,
	"tag_name" varchar(100) NOT NULL,
	"changelog" text,
	"download_url" text,
	"zipball_url" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "finn_releases_product_id_tag_name_unique" UNIQUE("product_id","tag_name")
);
--> statement-breakpoint
CREATE TABLE "finn_licenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"license_key" varchar(36) NOT NULL,
	"client_id" integer,
	"domain" varchar(255) NOT NULL,
	"plugin_access" varchar(20) DEFAULT 'all' NOT NULL,
	"product_ids" text,
	"status" varchar(10) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "finn_licenses_license_key_unique" UNIQUE("license_key")
);
--> statement-breakpoint
CREATE TABLE "finn_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "finn_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "finn_sessions" (
	"sid" varchar(255) PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finn_releases" ADD CONSTRAINT "finn_releases_product_id_finn_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."finn_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finn_licenses" ADD CONSTRAINT "finn_licenses_client_id_finn_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."finn_clients"("id") ON DELETE set null ON UPDATE no action;