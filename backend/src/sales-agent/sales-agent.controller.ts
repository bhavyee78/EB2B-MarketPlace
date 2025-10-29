import { 
  Controller, 
  Post, 
  Body, 
  Logger,
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SalesAgentService, ChatMessage } from './sales-agent.service';
import { RealtimeVoiceService } from './realtime-voice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('api/agent')
export class SalesAgentController {
  private readonly logger = new Logger(SalesAgentController.name);

  constructor(
    private readonly salesAgentService: SalesAgentService,
    private readonly realtimeVoiceService: RealtimeVoiceService,
  ) {}

  @Post('chat')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async chat(@Body() chatMessage: ChatMessage, @Request() req?: any) {
    try {
      this.logger.log(`Processing chat message from user: ${chatMessage.userId}`);
      
      // If user is authenticated, use their ID, otherwise use the provided userId
      const userId = req?.user?.sub || chatMessage.userId;
      
      const response = await this.salesAgentService.processChat({
        ...chatMessage,
        userId
      });

      return {
        success: true,
        response,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Error in chat endpoint:', error);
      return {
        success: false,
        error: 'Failed to process chat message',
        timestamp: new Date().toISOString()
      };
    }
  }
}

@WebSocketGateway({
  namespace: '/agent',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class SalesAgentGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(SalesAgentGateway.name);
  private clientUserMap = new Map<string, string>(); // Maps socket.id to userId

  constructor(
    private readonly salesAgentService: SalesAgentService,
    private readonly realtimeVoiceService: RealtimeVoiceService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`WebSocket connection attempt from: ${client.id}`);
      this.logger.log(`Handshake auth object:`, client.handshake.auth);
      
      // Get token from auth object sent by client
      const token = client.handshake.auth?.token;
      
      if (!token) {
        this.logger.error('No authentication token provided');
        client.disconnect();
        return;
      }

      this.logger.log(`Token received: ${token.substring(0, 20)}...`);

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      // Store the mapping
      this.clientUserMap.set(client.id, userId);
      
      this.logger.log(`Client connected and authenticated: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error('Authentication failed for WebSocket connection:', error);
      client.disconnect();
    }
  }

  @SubscribeMessage('chat-message')
  async handleChatMessage(
    @MessageBody() data: ChatMessage,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Get authenticated user ID from the connection
      const authenticatedUserId = this.clientUserMap.get(client.id);
      
      if (!authenticatedUserId) {
        client.emit('chat-response', {
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      this.logger.log(`WebSocket chat message from authenticated user ${authenticatedUserId}: ${data.message}`);
      
      // Use authenticated user ID instead of data.userId
      const response = await this.salesAgentService.processChat({
        ...data,
        userId: authenticatedUserId
      });
      
      client.emit('chat-response', {
        success: true,
        response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('WebSocket chat error:', error);
      client.emit('chat-response', {
        success: false,
        error: 'Failed to process message',
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('voice-start')
  async handleVoiceStart(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Get authenticated user ID from the connection
    const authenticatedUserId = this.clientUserMap.get(client.id);
    
    if (!authenticatedUserId) {
      client.emit('voice-error', {
        error: 'Authentication required for voice session',
        timestamp: new Date().toISOString()
      });
      return;
    }

    this.logger.log(`Starting voice session for authenticated user: ${authenticatedUserId}`);
    await this.realtimeVoiceService.startVoiceSession(authenticatedUserId, client);
  }

  @SubscribeMessage('voice-audio')
  async handleVoiceAudio(
    @MessageBody() data: { userId: string; audioData: Buffer },
    @ConnectedSocket() client: Socket,
  ) {
    await this.realtimeVoiceService.handleAudioInput(data.userId, data.audioData);
  }

  @SubscribeMessage('voice-audio-commit')
  async handleVoiceAudioCommit(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.realtimeVoiceService.commitAudioInput(data.userId);
  }

  @SubscribeMessage('voice-interrupt')
  async handleVoiceInterrupt(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.realtimeVoiceService.handleUserInterruption(data.userId);
  }

  @SubscribeMessage('voice-end')
  async handleVoiceEnd(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.realtimeVoiceService.endVoiceSession(data.userId);
  }

  handleDisconnect(client: Socket) {
    // Clean up user mapping
    const userId = this.clientUserMap.get(client.id);
    this.clientUserMap.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
  }
}