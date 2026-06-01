import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
  http.get("http://127.0.0.1:8080/v1/account", () =>
    HttpResponse.json({
      id: "acct_test",
      username: "test-user",
      role: "user",
    }),
  ),
);

window.scrollTo = () => undefined;

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
