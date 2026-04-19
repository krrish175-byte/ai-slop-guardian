import { render, screen } from '@testing-library/react';
import { SlopScore } from '../SlopScore';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('SlopScore', () => {
  it('renders the correct percentage', () => {
    render(<SlopScore score={0.85} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders the AI Probability label', () => {
    render(<SlopScore score={0.5} />);
    expect(screen.getByText('AI Probability')).toBeInTheDocument();
  });

  it('shows the progress bar when size is lg', () => {
    const { container } = render(<SlopScore score={0.9} size="lg" />);
    // Check for the progress bar container class
    expect(container.querySelector('.w-64')).toBeInTheDocument();
  });

  it('does not show the progress bar when size is md', () => {
    const { container } = render(<SlopScore score={0.9} size="md" />);
    expect(container.querySelector('.w-64')).not.toBeInTheDocument();
  });
});
