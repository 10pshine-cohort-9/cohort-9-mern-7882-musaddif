// src/pages/calminityLanding.test.jsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalminityLanding from './calminityLanding';

const renderPage = () => render(<CalminityLanding />);

describe('CalminityLanding', () => {
  beforeEach(() => {
    // jsdom does not implement scrollIntoView, so stub it before clicking CTAs.
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    delete Element.prototype.scrollIntoView;
  });

  it('renders the hero content and trust signals', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /5 Hidden Benefits of Frequency Healing/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Last updated: April 2024/i)).toBeInTheDocument();
    expect(screen.getAllByText(/4\.6\/5/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/£59\.95/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Only 37 units left in stock/i)).toBeInTheDocument();
  });

  it('opens the first benefit by default and expands another on click', async () => {
    const user = userEvent.setup();
    renderPage();

    const first = screen.getByRole('button', { name: /Entrainment Effect/i });
    expect(first).toHaveAttribute('aria-expanded', 'true');

    const second = screen.getByRole('button', { name: /Every Cell in Your Body/i });
    expect(second).toHaveAttribute('aria-expanded', 'false');

    await user.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/living tissue vibrates/i)).toBeInTheDocument();
  });

  it('shows the frequency ladder and solfeggio list inside the matching panels', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Supporting Research & Biological Effects/i }));
    expect(screen.getByText('Enlightenment')).toBeInTheDocument();
    expect(screen.getByText('Neutrality')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Solfeggio & Schumann: The Most Potent Healing Frequencies/i })
    );
    expect(screen.getByText('174 Hz')).toBeInTheDocument();
    expect(screen.getByText('7.83 Hz')).toBeInTheDocument();
  });

  it('scrolls to the buy card when availability is checked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: /Check Availability/i })[0]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('confirms the order and cart actions inside the buy card', async () => {
    const user = userEvent.setup();
    renderPage();

    const buyCard = document.getElementById('cal-buy');
    await user.click(within(buyCard).getByRole('button', { name: /Buy Now — £59\.95/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/Order started/i);

    await user.click(within(buyCard).getByRole('button', { name: /Add to Cart/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/Added to cart/i);
  });

  it('toggles the faq answers', async () => {
    const user = userEvent.setup();
    renderPage();

    const question = screen.getByRole('button', { name: /How long does the battery last/i });
    expect(question).toHaveAttribute('aria-expanded', 'false');

    await user.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Around 20 hours of playback/i)).toBeInTheDocument();
  });

  it('opens and closes the mobile navigation', async () => {
    const user = userEvent.setup();
    renderPage();

    const toggle = screen.getByRole('button', { name: /Toggle navigation/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
