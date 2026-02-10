
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../Login';
import * as api from '../../services/api';

// Mock Modules
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        login: vi.fn(),
        user: null,
    }),
}));

vi.mock('../../services/api', () => ({
    login: vi.fn(),
    googleAuth: vi.fn(),
}));

vi.mock('@react-oauth/google', () => ({
    GoogleLogin: () => <button>Mock Google Login</button>,
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form correctly', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            // Email error uses 'Email is required' in validation logic
            expect(screen.getByText(/email is required/i)).toBeInTheDocument();
            expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        });
    });

    it('submits form with valid data', async () => {
        vi.spyOn(api, 'login').mockResolvedValue({
            message: 'Success',
            data: {
                token: 'fake-token',
                user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'User', onboardingCompleted: true },
            },
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        });
    });

    it('handles login failure', async () => {
        vi.spyOn(api, 'login').mockRejectedValue(new Error('Invalid credentials'));

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
    });
});
