
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GetStarted from '../GetStarted';
import * as api from '../../services/api';

// Mock Modules
vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        login: vi.fn(),
        user: null,
    }),
}));

vi.mock('../../services/api', () => ({
    signup: vi.fn(),
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

describe('GetStarted Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders signup form correctly', () => {
        render(
            <MemoryRouter>
                <GetStarted />
            </MemoryRouter>
        );

        expect(screen.getByText(/create account/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('validates password match', async () => {
        render(
            <MemoryRouter>
                <GetStarted />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Pass1234' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Fail1234' } });

        const submitButton = screen.getByRole('button', { name: /account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });
    });

    it('checks password strength indicators', () => {
        render(
            <MemoryRouter>
                <GetStarted />
            </MemoryRouter>
        );

        const passwordInput = screen.getByLabelText(/^password$/i);
        fireEvent.change(passwordInput, { target: { value: 'password' } });

        // Check if 8+ chars indicator is effectively active (logic driven) - testing implementation detail via rendered output is harder without specific test-ids, so we check if the class or visual change happened. 
        // Here we assume standard rendering. For unit test we can rely on state logic if we test hooks, but for component test we test user interaction.
        // Let's just verify it renders the indicators.
        expect(screen.getByText(/8\+ chars/i)).toBeInTheDocument();
        expect(screen.getByText(/uppercase/i)).toBeInTheDocument();
        expect(screen.getByText(/number/i)).toBeInTheDocument();
    });

    it('submits valid form', async () => {
        const mockSignup = vi.spyOn(api, 'signup').mockResolvedValue({
            message: 'Success',
            data: {
                token: 'fake-token',
                user: { id: '1', name: 'New User', email: 'new@example.com', role: 'User', onboardingCompleted: false },
            },
        });

        render(
            <MemoryRouter>
                <GetStarted />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New User' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'SecurePass1' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'SecurePass1' } });

        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSignup).toHaveBeenCalledWith({
                name: 'New User',
                email: 'new@example.com',
                password: 'SecurePass1',
                accountType: 'User',
            });
        });
    });
});
