import * as signalR from '@microsoft/signalr';
import type {
  DisplayCartState,
  DisplayPaymentState,
  DisplaySaleComplete,
  CustomerDisplayMessage,
} from '../types/customerDisplay';

const CHANNEL_NAME = 'novamart_cfd_channel';
const STORAGE_KEY = 'novamart_cfd_state';
const API_ROOT = 'http://localhost:5026';
const HUB_URL = `${API_ROOT}/hubs/customer-display`;

class CustomerDisplayService {
  private channel: BroadcastChannel | null = null;
  private hubConnection: signalR.HubConnection | null = null;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
    }
  }

  private async getHubConnection(): Promise<signalR.HubConnection> {
    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();
    }

    if (
      this.hubConnection.state === signalR.HubConnectionState.Disconnected &&
      !this.isConnecting
    ) {
      this.isConnecting = true;
      try {
        await this.hubConnection.start();
      } catch {
        // Fall back gracefully to local BroadcastChannel and localStorage
      } finally {
        this.isConnecting = false;
      }
    }

    return this.hubConnection;
  }

  getSavedState(): CustomerDisplayMessage | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  // --- Broadcast methods (Called by PosPage) ---

  async sendCartUpdate(state: DisplayCartState) {
    const registerId = state.registerId || 'default-register';
    const message: CustomerDisplayMessage = { type: 'CART_UPDATE', payload: state };

    // 1. Save synchronously to localStorage (works across tabs on same origin instantly)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
    } catch {}

    // 2. BroadcastChannel (instant in-memory notification across open tabs)
    this.channel?.postMessage(message);

    // 3. SignalR Hub (Wireless tablet sync)
    try {
      const conn = await this.getHubConnection();
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('BroadcastCartUpdate', registerId, state);
      }
    } catch {}
  }

  async sendPaymentUpdate(state: DisplayPaymentState) {
    const registerId = state.registerId || 'default-register';
    const message: CustomerDisplayMessage = { type: 'PAYMENT_UPDATE', payload: state };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
    } catch {}

    this.channel?.postMessage(message);

    try {
      const conn = await this.getHubConnection();
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('BroadcastPaymentUpdate', registerId, state);
      }
    } catch {}
  }

  async sendSaleComplete(state: DisplaySaleComplete) {
    const registerId = state.registerId || 'default-register';
    const message: CustomerDisplayMessage = { type: 'SALE_COMPLETE', payload: state };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
    } catch {}

    this.channel?.postMessage(message);

    try {
      const conn = await this.getHubConnection();
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('BroadcastSaleCompleted', registerId, state);
      }
    } catch {}
  }

  async sendIdle(registerId = 'default-register') {
    const message: CustomerDisplayMessage = { type: 'IDLE', payload: { registerId } };

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    this.channel?.postMessage(message);

    try {
      const conn = await this.getHubConnection();
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('BroadcastIdle', registerId);
      }
    } catch {}
  }

  requestCurrentState(registerId = 'default-register') {
    // Ask POS via BroadcastChannel
    this.channel?.postMessage({ type: 'REQUEST_STATE', payload: { registerId } });

    // Ask SignalR hub
    this.getHubConnection()
      .then((conn) => {
        if (conn.state === signalR.HubConnectionState.Connected) {
          conn.invoke('RequestCurrentState', registerId).catch(() => {});
        }
      })
      .catch(() => {});
  }

  // Listen for REQUEST_STATE from newly opened tabs (called by PosPage)
  onRequestState(callback: () => void): () => void {
    const handleMsg = (event: MessageEvent<CustomerDisplayMessage>) => {
      if (event.data?.type === 'REQUEST_STATE') {
        callback();
      }
    };
    this.channel?.addEventListener('message', handleMsg);
    return () => this.channel?.removeEventListener('message', handleMsg);
  }

  // --- Listener method (Called by CustomerDisplayPage) ---

  subscribe(
    registerId = 'default-register',
    onMessage: (msg: CustomerDisplayMessage) => void
  ): () => void {
    // 1. Local BroadcastChannel listener
    const handleChannelMessage = (event: MessageEvent<CustomerDisplayMessage>) => {
      if (event.data) {
        onMessage(event.data);
      }
    };

    this.channel?.addEventListener('message', handleChannelMessage);

    // 2. SignalR listeners
    let conn: signalR.HubConnection | null = null;
    let isActive = true;

    this.getHubConnection()
      .then((c) => {
        if (!isActive) return;
        conn = c;

        conn.on('CartUpdated', (state: DisplayCartState) => {
          onMessage({ type: 'CART_UPDATE', payload: state });
        });

        conn.on('PaymentUpdated', (state: DisplayPaymentState) => {
          onMessage({ type: 'PAYMENT_UPDATE', payload: state });
        });

        conn.on('SaleCompleted', (state: DisplaySaleComplete) => {
          onMessage({ type: 'SALE_COMPLETE', payload: state });
        });

        conn.on('DisplayIdle', () => {
          onMessage({ type: 'IDLE', payload: { registerId } });
        });

        if (conn.state === signalR.HubConnectionState.Connected) {
          conn.invoke('JoinRegister', registerId).catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
      this.channel?.removeEventListener('message', handleChannelMessage);
      if (conn) {
        conn.off('CartUpdated');
        conn.off('PaymentUpdated');
        conn.off('SaleCompleted');
        conn.off('DisplayIdle');
        if (conn.state === signalR.HubConnectionState.Connected) {
          conn.invoke('LeaveRegister', registerId).catch(() => {});
        }
      }
    };
  }
}

export const customerDisplayService = new CustomerDisplayService();
