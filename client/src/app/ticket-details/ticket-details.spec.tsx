import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Ticket, User } from '@acme/shared-models';
import TicketDetails from './ticket-details';

const mockOnAssignTicket = jest.fn();
const mockOnUnassignTicket = jest.fn();
const mockOnCompleteTicket = jest.fn();
const mockOnIncompleteTicket = jest.fn();

const mockTickets: Ticket[] = [
  {
    id: 1,
    description: 'Install a monitor arm',
    assigneeId: 1,
    completed: false
  },
  {
    id: 2,
    description: 'Move the desk to the new location',
    assigneeId: null,
    completed: true
  }
];

const mockUsers: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock useParams and useNavigate
const mockUseParams = jest.fn();
const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockUseNavigate()
}));

describe('TicketDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
    mockUseNavigate.mockReturnValue(jest.fn());
  });

  it('should render ticket details successfully', () => {
    renderWithRouter(
      <TicketDetails
        tickets={mockTickets}
        users={mockUsers}
        onAssignTicket={mockOnAssignTicket}
        onUnassignTicket={mockOnUnassignTicket}
        onCompleteTicket={mockOnCompleteTicket}
        onIncompleteTicket={mockOnIncompleteTicket}
      />
    );

    expect(screen.getByText('Ticket #1')).toBeInTheDocument();
    expect(screen.getByText(/Install a monitor arm/)).toBeInTheDocument();
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    const assigneeSection = screen.getByText('Assignee').closest('div');
    expect(assigneeSection).toHaveTextContent('Alice');
  });

  it('should assign a user to a ticket', async () => {
    renderWithRouter(
      <TicketDetails
        tickets={mockTickets}
        users={mockUsers}
        onAssignTicket={mockOnAssignTicket}
        onUnassignTicket={mockOnUnassignTicket}
        onCompleteTicket={mockOnCompleteTicket}
        onIncompleteTicket={mockOnIncompleteTicket}
      />
    );

    const assignSelect = screen.getByRole('combobox');
    fireEvent.change(assignSelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(mockOnAssignTicket).toHaveBeenCalledWith(1, 2);
    });
  });

  it('should unassign a user from a ticket', async () => {
    renderWithRouter(
      <TicketDetails
        tickets={mockTickets}
        users={mockUsers}
        onAssignTicket={mockOnAssignTicket}
        onUnassignTicket={mockOnUnassignTicket}
        onCompleteTicket={mockOnCompleteTicket}
        onIncompleteTicket={mockOnIncompleteTicket}
      />
    );

    const assignSelect = screen.getByRole('combobox');
    fireEvent.change(assignSelect, { target: { value: '' } });

    await waitFor(() => {
      expect(mockOnUnassignTicket).toHaveBeenCalledWith(1);
    });
  });

  it('should toggle ticket completion', async () => {
    renderWithRouter(
      <TicketDetails
        tickets={mockTickets}
        users={mockUsers}
        onAssignTicket={mockOnAssignTicket}
        onUnassignTicket={mockOnUnassignTicket}
        onCompleteTicket={mockOnCompleteTicket}
        onIncompleteTicket={mockOnIncompleteTicket}
      />
    );

    const completeButton = screen.getByText('Mark as Complete');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockOnCompleteTicket).toHaveBeenCalledWith(1);
    });
  });

  it('should show error for non-existent ticket', () => {
    mockUseParams.mockReturnValue({ id: '999' });

    renderWithRouter(
      <TicketDetails
        tickets={mockTickets}
        users={mockUsers}
        onAssignTicket={mockOnAssignTicket}
        onUnassignTicket={mockOnUnassignTicket}
        onCompleteTicket={mockOnCompleteTicket}
        onIncompleteTicket={mockOnIncompleteTicket}
      />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Ticket not found')).toBeInTheDocument();
  });
});
