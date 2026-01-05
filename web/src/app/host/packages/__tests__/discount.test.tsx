import { render, screen, fireEvent } from '@testing-library/react';
import DiscountSettingsStep from '../discount';

describe('DiscountSettingsStep', () => {
  it('shows error for invalid percentage', () => {
    render(<DiscountSettingsStep />);
    fireEvent.click(screen.getByLabelText('Enable Discount'));
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Save Discount Settings'));
    expect(screen.getByText(/Discount must be between 5% and 70%/)).toBeInTheDocument();
  });

  it('shows error for invalid date range', () => {
    render(<DiscountSettingsStep />);
    fireEvent.click(screen.getByLabelText('Enable Discount'));
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-01-10' } });
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-01-01' } });
    fireEvent.click(screen.getByText('Save Discount Settings'));
    expect(screen.getByText(/End date must be after start date/)).toBeInTheDocument();
  });

  it('saves valid discount settings', () => {
    render(<DiscountSettingsStep />);
    fireEvent.click(screen.getByLabelText('Enable Discount'));
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-01-10' } });
    fireEvent.click(screen.getByText('Save Discount Settings'));
    expect(screen.queryByText(/Discount must be between 5% and 70%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/End date must be after start date/)).not.toBeInTheDocument();
  });
});
