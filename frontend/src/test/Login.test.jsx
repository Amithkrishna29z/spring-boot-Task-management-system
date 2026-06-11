import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

// Hoisted spies so the mock factories below can reference them.
const { mockLogin, mockNavigate, toastSuccess, toastError } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockNavigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: toastError },
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits credentials and navigates home on success", async () => {
    mockLogin.mockResolvedValue({ username: "alice", role: "ROLE_USER" });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText(/enter your username/i), "alice");
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("alice", "Password123!"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows an error toast when login fails", async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: "Invalid username or password" } },
    });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText(/enter your username/i), "bob");
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Invalid username or password"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
