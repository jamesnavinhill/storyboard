#!/usr/bin/env node
import { db } from "../db";
import { runMigrations } from "../migrations/runMigrations";

runMigrations(db);

// eslint-disable-next-line no-console
console.log("Migrations applied successfully.");
