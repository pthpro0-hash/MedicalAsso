import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("next config", () => {
  it("keeps pdfkit external on the server so bundled font data paths do not break", () => {
    expect(nextConfig.serverExternalPackages).toContain("pdfkit");
  });
});
