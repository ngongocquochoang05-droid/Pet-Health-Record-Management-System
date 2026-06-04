import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { AuthResponseDto } from '../models/auth';

export interface RealtimeChange {
  topic: RealtimeTopic;
  resource: string;
  method: string;
  changedAt: string;
}

export type RealtimeTopic =
  | 'admin'
  | 'billing'
  | 'bookings'
  | 'clinical'
  | 'notifications'
  | 'pets'
  | 'profile'
  | 'promotions'
  | 'reminders'
  | 'reviews'
  | 'services'
  | 'shifts'
  | 'system';

export function connectRealtime(session: AuthResponseDto, onChange: (change: RealtimeChange) => void) {
  const connection = new HubConnectionBuilder()
    .withUrl('/hubs/pethealth', { accessTokenFactory: () => session.accessToken })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on('DataChanged', onChange);
  void connection.start().catch(() => {
    // Automatic reconnect will retry when the backend becomes available.
  });

  return async () => {
    connection.off('DataChanged', onChange);
    if (connection.state !== HubConnectionState.Disconnected) {
      await connection.stop();
    }
  };
}
