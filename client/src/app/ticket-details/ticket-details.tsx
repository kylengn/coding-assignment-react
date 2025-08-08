import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ticket, User } from '@acme/shared-models';
import styles from './ticket-details.module.css';

export interface TicketDetailsProps {
  tickets: Ticket[];
  users: User[];
  onAssignTicket: (ticketId: number, userId: number) => Promise<void>;
  onUnassignTicket: (ticketId: number) => Promise<void>;
  onCompleteTicket: (ticketId: number) => Promise<void>;
  onIncompleteTicket: (ticketId: number) => Promise<void>;
}

export function TicketDetails(props: TicketDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticket = props.tickets.find(t => t.id === parseInt(id || '0'));
  const assignee = ticket?.assigneeId ? props.users.find(u => u.id === ticket.assigneeId) : null;

  useEffect(() => {
    if (!ticket) {
      setError('Ticket not found');
    } else {
      setError(null);
    }
  }, [ticket]);

  const handleAssignTicket = async (userId: number) => {
    if (!ticket) return;
    
    setLoading(true);
    try {
      await props.onAssignTicket(ticket.id, userId);
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignTicket = async () => {
    if (!ticket) return;
    
    setLoading(true);
    try {
      await props.onUnassignTicket(ticket.id);
    } catch (error) {
      console.error('Failed to unassign ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!ticket) return;
    
    setLoading(true);
    try {
      if (ticket.completed) {
        await props.onIncompleteTicket(ticket.id);
      } else {
        await props.onCompleteTicket(ticket.id);
      }
    } catch (error) {
      console.error('Failed to toggle ticket completion:', error);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className={styles['error']}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className={styles['back-btn']}>
          Back to Tickets
        </button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={styles['loading']}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles['ticket-details']}>
      <div className={styles['header']}>
        <button onClick={() => navigate('/')} className={styles['back-btn']}>
          ← Back to Tickets
        </button>
        <h1>Ticket #{ticket.id}</h1>
      </div>

      <div className={styles['content']}>
        <div className={styles['main-info']}>
          <h2>{ticket.description}</h2>
          
          <div className={styles['status']}>
            <span className={`${styles['status-badge']} ${ticket.completed ? styles['completed'] : styles['incomplete']}`}>
              {ticket.completed ? 'Completed' : 'Incomplete'}
            </span>
          </div>

          <div className={styles['assignee']}>
            <h3>Assignee</h3>
            <p>{assignee ? assignee.name : 'Unassigned'}</p>
          </div>
        </div>

        <div className={styles['actions']}>
          <div className={styles['action-group']}>
            <h3>Assign Ticket</h3>
            <select
              value={ticket.assigneeId || ''}
              onChange={(e) => {
                const userId = parseInt(e.target.value);
                if (userId) {
                  handleAssignTicket(userId);
                } else {
                  handleUnassignTicket();
                }
              }}
              disabled={loading}
              className={styles['assign-select']}
            >
              <option value="">Unassigned</option>
              {props.users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['action-group']}>
            <h3>Status</h3>
            <button
              onClick={handleToggleComplete}
              disabled={loading}
              className={`${styles['complete-btn']} ${ticket.completed ? styles['completed'] : ''}`}
            >
              {loading ? 'Updating...' : 
               ticket.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetails;
