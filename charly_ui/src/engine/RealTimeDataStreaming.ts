/**
 * CHARLY 2.0 - Real-Time Data Streaming Engine
 * WebSocket connections, live data updates, and real-time analytics streaming
 */

interface StreamingConnection {
  id: string;
  endpoint: string;
  protocol: 'websocket' | 'sse' | 'polling';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastHeartbeat: number;
  retryCount: number;
  maxRetries: number;
  retryDelay: number;
}

interface DataStream {
  id: string;
  name: string;
  type: 'analytics' | 'metrics' | 'user_activity' | 'system_health' | 'market_data';
  frequency: number; // milliseconds
  isActive: boolean;
  lastUpdate: number;
  subscribers: Set<string>;
  dataBuffer: unknown[];
  bufferSize: number;
}

interface StreamMessage {
  id: string;
  streamId: string;
  timestamp: number;
  type: string;
  data: unknown;
  metadata?: Record<string, unknown>;
}

interface StreamSubscription {
  id: string;
  streamId: string;
  callback: (message: StreamMessage) => void;
  filter?: (message: StreamMessage) => boolean;
  isActive: boolean;
  createdAt: number;
}

class RealTimeDataStreaming {
  private connections: Map<string, StreamingConnection> = new Map();
  private streams: Map<string, DataStream> = new Map();
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeStreams();
    this.startHeartbeat();
    this.startCleanupProcess();
  }

  private initializeStreams(): void {
    // Analytics Stream
    this.createStream({
      id: 'analytics-stream',
      name: 'Real-time Analytics',
      type: 'analytics',
      frequency: 5000, // 5 seconds
      isActive: true,
      lastUpdate: Date.now(),
      subscribers: new Set(),
      dataBuffer: [],
      bufferSize: 100
    });

    // System Metrics Stream
    this.createStream({
      id: 'metrics-stream',
      name: 'Performance Metrics',
      type: 'metrics',
      frequency: 2000, // 2 seconds
      isActive: true,
      lastUpdate: Date.now(),
      subscribers: new Set(),
      dataBuffer: [],
      bufferSize: 50
    });

    // User Activity Stream
    this.createStream({
      id: 'user-activity-stream',
      name: 'User Activity Feed',
      type: 'user_activity',
      frequency: 1000, // 1 second
      isActive: true,
      lastUpdate: Date.now(),
      subscribers: new Set(),
      dataBuffer: [],
      bufferSize: 200
    });

    // System Health Stream
    this.createStream({
      id: 'system-health-stream',
      name: 'System Health Monitor',
      type: 'system_health',
      frequency: 10000, // 10 seconds
      isActive: true,
      lastUpdate: Date.now(),
      subscribers: new Set(),
      dataBuffer: [],
      bufferSize: 30
    });

    // Market Data Stream
    this.createStream({
      id: 'market-data-stream',
      name: 'Market Intelligence Feed',
      type: 'market_data',
      frequency: 30000, // 30 seconds
      isActive: true,
      lastUpdate: Date.now(),
      subscribers: new Set(),
      dataBuffer: [],
      bufferSize: 20
    });

    this.isInitialized = true;
  }

  public async createConnection(endpoint: string, protocol: 'websocket' | 'sse' | 'polling' = 'websocket'): Promise<string> {
    const connectionId = this.generateId('conn');
    
    const connection: StreamingConnection = {
      id: connectionId,
      endpoint,
      protocol,
      status: 'connecting',
      lastHeartbeat: Date.now(),
      retryCount: 0,
      maxRetries: 5,
      retryDelay: 1000
    };

    this.connections.set(connectionId, connection);

    try {
      await this.establishConnection(connection);
      connection.status = 'connected';
      console.log(`Connected to ${endpoint} via ${protocol}`);
    } catch (error) {
      connection.status = 'error';
      console.error(`Failed to connect to ${endpoint}:`, error);
      throw error;
    }

    return connectionId;
  }

  private async establishConnection(connection: StreamingConnection): Promise<void> {
    switch (connection.protocol) {
      case 'websocket':
        return this.establishWebSocketConnection(connection);
      case 'sse':
        return this.establishSSEConnection(connection);
      case 'polling':
        return this.establishPollingConnection(connection);
      default:
        throw new Error(`Unsupported protocol: ${connection.protocol}`);
    }
  }

  private async establishWebSocketConnection(connection: StreamingConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, this would create an actual WebSocket
        // For demo purposes, we'll simulate the connection
        setTimeout(() => {
          console.log(`WebSocket connection established to ${connection.endpoint}`);
          this.simulateWebSocketData(connection);
          resolve();
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async establishSSEConnection(connection: StreamingConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Simulate SSE connection
        setTimeout(() => {
          console.log(`SSE connection established to ${connection.endpoint}`);
          this.simulateSSEData(connection);
          resolve();
        }, 300);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async establishPollingConnection(connection: StreamingConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Simulate polling connection
        setTimeout(() => {
          console.log(`Polling connection established to ${connection.endpoint}`);
          this.simulatePollingData(connection);
          resolve();
        }, 200);
      } catch (error) {
        reject(error);
      }
    });
  }

  private simulateWebSocketData(connection: StreamingConnection): void {
    const interval = setInterval(() => {
      if (connection.status !== 'connected') {
        clearInterval(interval);
        return;
      }

      // Simulate real-time data based on endpoint
      const data = this.generateSimulatedData(connection.endpoint);
      this.broadcastToStreams(data, connection.endpoint);
      
      connection.lastHeartbeat = Date.now();
    }, 1000);
  }

  private simulateSSEData(connection: StreamingConnection): void {
    const interval = setInterval(() => {
      if (connection.status !== 'connected') {
        clearInterval(interval);
        return;
      }

      const data = this.generateSimulatedData(connection.endpoint);
      this.broadcastToStreams(data, connection.endpoint);
      
      connection.lastHeartbeat = Date.now();
    }, 2000);
  }

  private simulatePollingData(connection: StreamingConnection): void {
    const interval = setInterval(() => {
      if (connection.status !== 'connected') {
        clearInterval(interval);
        return;
      }

      const data = this.generateSimulatedData(connection.endpoint);
      this.broadcastToStreams(data, connection.endpoint);
      
      connection.lastHeartbeat = Date.now();
    }, 5000);
  }

  private generateSimulatedData(endpoint: string): unknown {
    const timestamp = Date.now();
    
    if (endpoint.includes('analytics')) {
      return {
        type: 'analytics_update',
        timestamp,
        data: {
          activeUsers: Math.floor(Math.random() * 100) + 1200,
          pageViews: Math.floor(Math.random() * 500) + 2000,
          conversionRate: (Math.random() * 10 + 90).toFixed(2),
          avgSessionDuration: Math.floor(Math.random() * 300) + 180,
          bounceRate: (Math.random() * 20 + 25).toFixed(1)
        }
      };
    }

    if (endpoint.includes('metrics')) {
      return {
        type: 'performance_metrics',
        timestamp,
        data: {
          cpuUsage: (Math.random() * 40 + 30).toFixed(1),
          memoryUsage: (Math.random() * 30 + 50).toFixed(1),
          responseTime: (Math.random() * 100 + 50).toFixed(0),
          throughput: Math.floor(Math.random() * 1000) + 2000,
          errorRate: (Math.random() * 2).toFixed(2)
        }
      };
    }

    if (endpoint.includes('market')) {
      return {
        type: 'market_update',
        timestamp,
        data: {
          propertyValues: {
            avgPrice: Math.floor(Math.random() * 50000) + 450000,
            pricePerSqft: Math.floor(Math.random() * 50) + 200,
            marketTrend: Math.random() > 0.5 ? 'up' : 'down',
            changePercent: (Math.random() * 10 - 5).toFixed(2)
          },
          regionalData: [
            { region: 'Downtown', change: (Math.random() * 6 - 3).toFixed(1) },
            { region: 'Suburbs', change: (Math.random() * 4 - 2).toFixed(1) },
            { region: 'Industrial', change: (Math.random() * 8 - 4).toFixed(1) }
          ]
        }
      };
    }

    // Default data
    return {
      type: 'generic_update',
      timestamp,
      data: {
        value: Math.random() * 100,
        status: 'active'
      }
    };
  }

  private broadcastToStreams(data: unknown, source: string): void {
    this.streams.forEach((stream, streamId) => {
      if (this.shouldBroadcastToStream(stream, data, source)) {
        const message: StreamMessage = {
          id: this.generateId('msg'),
          streamId,
          timestamp: Date.now(),
          type: data.type,
          data: data.data,
          metadata: { source }
        };

        this.addToStreamBuffer(stream, message);
        this.notifySubscribers(stream, message);
      }
    });
  }

  private shouldBroadcastToStream(stream: DataStream, data: unknown): boolean {
    if (!stream.isActive) return false;

    // Route data to appropriate streams based on type
    if (stream.type === 'analytics' && data.type.includes('analytics')) return true;
    if (stream.type === 'metrics' && data.type.includes('metrics')) return true;
    if (stream.type === 'market_data' && data.type.includes('market')) return true;
    if (stream.type === 'user_activity' && data.type.includes('user')) return true;
    if (stream.type === 'system_health' && data.type.includes('system')) return true;

    return false;
  }

  private addToStreamBuffer(stream: DataStream, message: StreamMessage): void {
    stream.dataBuffer.push(message);
    stream.lastUpdate = Date.now();

    // Maintain buffer size
    if (stream.dataBuffer.length > stream.bufferSize) {
      stream.dataBuffer.shift();
    }
  }

  private notifySubscribers(stream: DataStream, message: StreamMessage): void {
    this.subscriptions.forEach(subscription => {
      if (subscription.streamId === stream.id && subscription.isActive) {
        // Apply filter if present
        if (subscription.filter && !subscription.filter(message)) {
          return;
        }

        try {
          subscription.callback(message);
        } catch (error) {
          console.error(`Error in subscription callback:`, error);
        }
      }
    });
  }

  public subscribe(streamId: string, callback: (message: StreamMessage) => void, filter?: (message: StreamMessage) => boolean): string {
    const subscriptionId = this.generateId('sub');
    
    const subscription: StreamSubscription = {
      id: subscriptionId,
      streamId,
      callback,
      filter,
      isActive: true,
      createdAt: Date.now()
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Add subscriber to stream
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.subscribers.add(subscriptionId);
    }

    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    // Remove from stream subscribers
    const stream = this.streams.get(subscription.streamId);
    if (stream) {
      stream.subscribers.delete(subscriptionId);
    }

    // Deactivate subscription
    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);

    return true;
  }

  public createStream(streamConfig: Omit<DataStream, 'subscribers' | 'dataBuffer'>): string {
    const stream: DataStream = {
      ...streamConfig,
      subscribers: new Set(),
      dataBuffer: []
    };

    this.streams.set(stream.id, stream);
    return stream.id;
  }

  public pauseStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;

    stream.isActive = false;
    return true;
  }

  public resumeStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;

    stream.isActive = true;
    return true;
  }

  public getStreamData(streamId: string, limit?: number): StreamMessage[] {
    const stream = this.streams.get(streamId);
    if (!stream) return [];

    const data = stream.dataBuffer;
    return limit ? data.slice(-limit) : data;
  }

  public getStreamStatus(streamId: string): Record<string, unknown> | null {
    const stream = this.streams.get(streamId);
    if (!stream) return null;

    return {
      id: stream.id,
      name: stream.name,
      type: stream.type,
      isActive: stream.isActive,
      subscriberCount: stream.subscribers.size,
      bufferSize: stream.dataBuffer.length,
      lastUpdate: stream.lastUpdate,
      frequency: stream.frequency
    };
  }

  public getAllStreams(): Array<Record<string, unknown>> {
    return Array.from(this.streams.values()).map(stream => this.getStreamStatus(stream.id));
  }

  public getConnectionStatus(): Record<string, unknown> {
    const connections = Array.from(this.connections.values());
    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.status === 'connected').length,
      errorConnections: connections.filter(c => c.status === 'error').length,
      connections: connections.map(conn => ({
        id: conn.id,
        endpoint: conn.endpoint,
        protocol: conn.protocol,
        status: conn.status,
        lastHeartbeat: conn.lastHeartbeat,
        retryCount: conn.retryCount
      }))
    };
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      this.connections.forEach(connection => {
        // Check if connection is stale (no heartbeat for 30 seconds)
        if (now - connection.lastHeartbeat > 30000 && connection.status === 'connected') {
          console.warn(`Connection ${connection.id} appears stale, attempting reconnect`);
          this.reconnectConnection(connection);
        }
      });
    }, 10000); // Check every 10 seconds
  }

  private async reconnectConnection(connection: StreamingConnection): Promise<void> {
    if (connection.retryCount >= connection.maxRetries) {
      connection.status = 'error';
      console.error(`Max retries exceeded for connection ${connection.id}`);
      return;
    }

    connection.status = 'connecting';
    connection.retryCount++;

    try {
      await new Promise(resolve => setTimeout(resolve, connection.retryDelay));
      await this.establishConnection(connection);
      connection.status = 'connected';
      connection.retryCount = 0;
      console.log(`Successfully reconnected ${connection.id}`);
    } catch (error) {
      console.error(`Reconnection failed for ${connection.id}:`, error);
      // Exponential backoff
      connection.retryDelay = Math.min(connection.retryDelay * 2, 30000);
    }
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Clean up old subscriptions (inactive for more than 1 hour)
      this.subscriptions.forEach((subscription, id) => {
        if (!subscription.isActive && (now - subscription.createdAt) > 3600000) {
          this.subscriptions.delete(id);
        }
      });

      // Clean up old stream data (older than 24 hours)
      this.streams.forEach(stream => {
        stream.dataBuffer = stream.dataBuffer.filter(message => 
          (now - message.timestamp) < 86400000
        );
      });
    }, 3600000); // Run every hour
  }

  public disconnect(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    connection.status = 'disconnected';
    this.connections.delete(connectionId);
    return true;
  }

  public disconnectAll(): void {
    this.connections.forEach(connection => {
      connection.status = 'disconnected';
    });
    this.connections.clear();
  }

  public destroy(): void {
    this.disconnectAll();
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.streams.clear();
    this.subscriptions.clear();
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods for common streaming scenarios
  public streamAnalyticsData(callback: (data: unknown) => void): string {
    return this.subscribe('analytics-stream', (message) => {
      callback(message.data);
    });
  }

  public streamPerformanceMetrics(callback: (data: unknown) => void): string {
    return this.subscribe('metrics-stream', (message) => {
      callback(message.data);
    });
  }

  public streamUserActivity(callback: (data: unknown) => void): string {
    return this.subscribe('user-activity-stream', (message) => {
      callback(message.data);
    });
  }

  public streamMarketData(callback: (data: unknown) => void): string {
    return this.subscribe('market-data-stream', (message) => {
      callback(message.data);
    });
  }

  public streamSystemHealth(callback: (data: unknown) => void): string {
    return this.subscribe('system-health-stream', (message) => {
      callback(message.data);
    });
  }
}

// Singleton instance
export const realTimeDataStreaming = new RealTimeDataStreaming();
export default RealTimeDataStreaming;