import * as signalR from '@microsoft/signalr';

// The API's base URL includes '/api' for REST calls, but the SignalR hub is
// mapped at the root of the API host — strip it off here.
const API_ROOT = 'http://localhost:5026';
const HUB_URL = `${API_ROOT}/hubs/dashboard`;

let connection: signalR.HubConnection | null = null;

function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return connection;
}

export interface DashboardHubHandlers {
  onSaleCompleted?: (sale: unknown) => void;
  onConnectionStateChange?: (connected: boolean) => void;
}

/**
 * Starts (or reuses) the dashboard hub connection and wires up handlers.
 * Returns a cleanup function to remove this component's handlers.
 */
export function subscribeToDashboardHub(handlers: DashboardHubHandlers): () => void {
  const conn = getConnection();

  const saleHandler = (sale: unknown) => handlers.onSaleCompleted?.(sale);
  conn.on('SaleCompleted', saleHandler);

  const notifyState = () => handlers.onConnectionStateChange?.(conn.state === signalR.HubConnectionState.Connected);

  conn.onreconnected(notifyState);
  conn.onreconnecting(notifyState);
  conn.onclose(notifyState);

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    conn
      .start()
      .then(notifyState)
      .catch(() => notifyState());
  } else {
    notifyState();
  }

  return () => {
    conn.off('SaleCompleted', saleHandler);
  };
}