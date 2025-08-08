import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Ticket, User } from '@acme/shared-models';

import styles from './app.module.css';
import Tickets from './tickets/tickets';
import TicketDetails from './ticket-details/ticket-details';

const App = () => {
  const [tickets, setTickets] = useState([] as Ticket[]);
  const [users, setUsers] = useState([] as User[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Very basic way to synchronize state with server.
  // Feel free to use any state/fetch library you want (e.g. react-query, xstate, redux, etc.).
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [ticketsData, usersData] = await Promise.all([
          fetch('/api/tickets').then(res => res.json()),
          fetch('/api/users').then(res => res.json())
        ]);
        setTickets(ticketsData);
        setUsers(usersData);
      } catch (err) {
        setError('Failed to load data');
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const addTicket = async (description: string) => {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error('Failed to add ticket');
    }

    const newTicket = await response.json();
    setTickets(prev => [...prev, newTicket]);
  };

  const assignTicket = async (ticketId: number, userId: number) => {
    const response = await fetch(`/api/tickets/${ticketId}/assign/${userId}`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to assign ticket');
    }

    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, assigneeId: userId }
        : ticket
    ));
  };

  const unassignTicket = async (ticketId: number) => {
    const response = await fetch(`/api/tickets/${ticketId}/unassign`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to unassign ticket');
    }

    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, assigneeId: null }
        : ticket
    ));
  };

  const completeTicket = async (ticketId: number) => {
    const response = await fetch(`/api/tickets/${ticketId}/complete`, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to complete ticket');
    }

    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, completed: true }
        : ticket
    ));
  };

  const incompleteTicket = async (ticketId: number) => {
    const response = await fetch(`/api/tickets/${ticketId}/complete`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to mark ticket as incomplete');
    }

    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, completed: false }
        : ticket
    ));
  };

  if (loading) {
    return (
      <div className={styles['app']}>
        <div className={styles['loading']}>
          <h1>Ticketing App</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['app']}>
        <div className={styles['error']}>
          <h1>Ticketing App</h1>
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['app']}>
      <Routes>
        <Route
          path="/"
          element={
            <Tickets
              tickets={tickets}
              users={users}
              onAddTicket={addTicket}
              onAssignTicket={assignTicket}
              onUnassignTicket={unassignTicket}
              onCompleteTicket={completeTicket}
              onIncompleteTicket={incompleteTicket}
            />
          }
        />
        <Route
          path="/:id"
          element={
            <TicketDetails
              tickets={tickets}
              users={users}
              onAssignTicket={assignTicket}
              onUnassignTicket={unassignTicket}
              onCompleteTicket={completeTicket}
              onIncompleteTicket={incompleteTicket}
            />
          }
        />
      </Routes>
    </div>
  );
};

export default App;
