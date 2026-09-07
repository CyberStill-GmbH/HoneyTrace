import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeverityBadge } from "./SeverityBadge";

describe("SeverityBadge", () => {
  it("comunica severidad con texto además de color", () => {
    render(<SeverityBadge severity="admin-access" />);
    expect(screen.getByText("Acceso administrador")).toHaveClass("severity-admin-access");
  });
});
