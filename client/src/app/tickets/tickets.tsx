import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, User } from '@acme/shared-models';
import styles from './tickets.module.css';

export interface TicketsProps {
  tickets: Ticket[];
  users: User[];
  onAddTicket: (description: string) => Promise<void>;
  onAssignTicket: (ticketId: number, userId: number) => Promise<void>;
  onUnassignTicket: (ticketId: number) => Promise<void>;
  onCompleteTicket: (ticketId: number) => Promise<void>;
  onIncompleteTicket: (ticketId: number) => Promise<void>;
}

type TicketType = 'all' | 'completed' | 'incomplete';

export function Tickets(props: TicketsProps) {
  const [filter, setFilter] = useState<TicketType>('all');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  const filteredTickets = props.tickets.filter(ticket => {
    if (filter === 'completed') return ticket.completed;
    if (filter === 'incomplete') return !ticket.completed;
    return true;
  });

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketDescription.trim()) return;

    setIsAddingTicket(true);
    try {
      await props.onAddTicket(newTicketDescription);
      setNewTicketDescription('');
    } catch (error) {
      console.error('Failed to add ticket:', error);
    } finally {
      setIsAddingTicket(false);
    }
  };

  const handleAssignTicket = async (ticketId: number, userId: number) => {
    setLoadingStates(prev => ({ ...prev, [ticketId]: 'assigning' }));
    try {
      await props.onAssignTicket(ticketId, userId);
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [ticketId]: '' }));
    }
  };

  const handleUnassignTicket = async (ticketId: number) => {
    setLoadingStates(prev => ({ ...prev, [ticketId]: 'unassigning' }));
    try {
      await props.onUnassignTicket(ticketId);
    } catch (error) {
      console.error('Failed to unassign ticket:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [ticketId]: '' }));
    }
  };

  const handleToggleComplete = async (ticketId: number) => {
    setLoadingStates(prev => ({ ...prev, [ticketId]: 'toggling' }));
    try {
      const ticket = props.tickets.find(t => t.id === ticketId);
      if (ticket?.completed) {
        await props.onIncompleteTicket(ticketId);
      } else {
        await props.onCompleteTicket(ticketId);
      }
    } catch (error) {
      console.error('Failed to toggle ticket completion:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [ticketId]: '' }));
    }
  };

  const getAssigneeName = (assigneeId: number | null) => {
    if (!assigneeId) return 'Unassigned';
    const user = props.users.find(u => u.id === assigneeId);
    return user ? user.name : 'Unknown';
  };

  return (
    <div className={styles['tickets']}>
      <div className={styles['header']}>
        <h2>Tickets ({filteredTickets.length})</h2>

        <div className={styles['filters']}>
          <button
            className={`${styles['filter-btn']} ${filter === 'all' ? styles['active'] : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles['filter-btn']} ${filter === 'incomplete' ? styles['active'] : ''}`}
            onClick={() => setFilter('incomplete')}
          >
            Incomplete
          </button>
          <button
            className={`${styles['filter-btn']} ${filter === 'completed' ? styles['active'] : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      <form onSubmit={handleAddTicket} className={styles['add-form']}>
        <input
          type="text"
          value={newTicketDescription}
          onChange={(e) => setNewTicketDescription(e.target.value)}
          placeholder="Enter ticket description..."
          className={styles['add-input']}
          disabled={isAddingTicket}
        />
        <button
          type="submit"
          className={styles['add-btn']}
          disabled={isAddingTicket || !newTicketDescription.trim()}
        >
          {isAddingTicket ? 'Adding...' : 'Add Ticket'}
        </button>
      </form>

      <div className={styles['tickets-list']}>
        {filteredTickets.length === 0 ? (
          <p className={styles['no-tickets']}>No tickets found.</p>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className={`${styles['ticket-item']} ${ticket.completed ? styles['completed'] : ''}`}>
              <div className={styles['ticket-main']}>
                <div className={styles['ticket-info']}>
                  <h3
                    className={styles['ticket-title']}
                    onClick={() => navigate(`/${ticket.id}`)}
                  >
                    #{ticket.id} - {ticket.description}
                  </h3>
                  <p className={styles['ticket-assignee']}>
                    Assigned to: {getAssigneeName(ticket.assigneeId)}
                  </p>
                </div>

                <div className={styles['ticket-actions']}>
                  <select
                    value={ticket.assigneeId || ''}
                    onChange={(e) => {
                      const userId = parseInt(e.target.value);
                      if (userId) {
                        handleAssignTicket(ticket.id, userId);
                      } else {
                        handleUnassignTicket(ticket.id);
                      }
                    }}
                    disabled={loadingStates[ticket.id] === 'assigning'}
                    className={styles['assign-select']}
                  >
                    <option value="">Unassigned</option>
                    {props.users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleToggleComplete(ticket.id)}
                    disabled={loadingStates[ticket.id] === 'toggling'}
                    className={`${styles['complete-btn']} ${ticket.completed ? styles['completed'] : ''}`}
                  >
                    {loadingStates[ticket.id] === 'toggling' ? '...' :
                      ticket.completed ? 'Completed' : 'Incomplete'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Tickets;
