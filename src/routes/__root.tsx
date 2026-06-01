import { createRootRoute } from "@tanstack/react-router";
import { AppShell } from "../components/proofline/AppShell";

export const rootRoute = createRootRoute({
  component: AppShell,
});
