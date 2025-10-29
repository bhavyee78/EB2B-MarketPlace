import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
import { Socket } from 'socket.io';
import { SalesAgentService } from './sales-agent.service';

interface VoiceSession {
  userId: string;
  socket: Socket;
  realtimeWs?: WebSocket;
  sessionId?: string;
  isActive: boolean;
}

@Injectable()
export class RealtimeVoiceService {
  private readonly logger = new Logger(RealtimeVoiceService.name);
  private activeSessions = new Map<string, VoiceSession>();

  constructor(
    private configService: ConfigService,
    private salesAgentService: SalesAgentService,
  ) {}

  async startVoiceSession(userId: string, socket: Socket): Promise<void> {
    try {
      this.logger.log(`Starting voice session for user: ${userId}`);

      // End any existing session for this user
      await this.endVoiceSession(userId);

      // Check if API key is available
      const apiKey = this.configService.get('OPENAI_API_KEY');
      if (!apiKey) {
        this.logger.error('OPENAI_API_KEY is not configured');
        socket.emit('voice-error', {
          error: 'OpenAI API key is not configured',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      this.logger.log(`Using OpenAI API key: ${apiKey.substring(0, 20)}...`);

      // Create WebSocket connection to OpenAI Realtime API
      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
      const realtimeWs = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      // Store session immediately
      const session: VoiceSession = {
        userId,
        socket,
        realtimeWs,
        isActive: true,
      };
      this.activeSessions.set(userId, session);

      realtimeWs.on('open', () => {
        this.logger.log(`WebSocket successfully opened for user: ${userId}`);
        
        // Wait a moment for the connection to stabilize, then configure the session
        setTimeout(() => {
          try {
            const sessionConfig = {
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: `Hello! My name is Ivanna and I'm speaking from Premier Decorations. I am here to place orders for you. Can you tell me what you want to order?

CONVERSATION FLOW - FOLLOW EXACTLY:

1. INTRODUCTION (First interaction only):
   "Hi! My name is Ivanna and I'm speaking from Premier Decorations. I am here to place orders for you. Can you tell me what you want to order?"

2. PRODUCT INQUIRY:
   When customer mentions any product/category:
   - Ask for confirmation: "So you're interested in [product/category]. Is this what you want to order?"
   - If unclear, ask clarifying questions to get specific product

3. ORDER CONFIRMATION:
   If customer says YES to ordering:
   - IMMEDIATELY check for offers: "Let me check if there are any special offers available for you on this"
   - If offers exist: Explain the offer and eligibility requirements clearly
   - If no offers: "I don't see any current offers, but let's proceed with your order"

4. HANDLING OBJECTIONS:
   If customer shows doubt/hesitation ("what if it doesn't work", "not sure", "might not drive sales"):
   - ENGAGE: "I understand your concern, but we can discuss returns and guarantees later. As of now, let's focus on getting you this great product and make it work for your business"
   - REDIRECT: "Many customers had similar concerns initially, but they're thriving now. Let's get this started"
   - REASSURE: "We have excellent support to help you succeed. Let's place the order and I'll make sure you get all the help you need"

PERSONALITY & SPEECH:
- Professional but friendly
- SPEAK FAST - quick, energetic pace like a busy sales professional
- Focused on ORDER-TAKING (not just browsing)
- Solution-oriented when handling objections
- Always redirect back to placing the order
- Confident and reassuring

KEEP RESPONSES VERY SHORT: Max 10-15 words per response unless explaining offers or handling objections. Speak quickly and efficiently.

Available: Christmas, Easter, Autumn, Valentine's, Halloween collections
Categories: Wreaths, Garlands, Decorations, Table Accessories, Lighting, Baskets`,
                voice: 'nova',
                output_audio_format: 'pcm16',
                input_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1',
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.8, // Higher threshold to reduce background noise sensitivity
                  prefix_padding_ms: 300, // More padding to capture full speech
                  silence_duration_ms: 1200, // Longer silence before stopping (1.2 seconds)
                },
                temperature: 0.6, // Slightly more focused responses
                max_response_output_tokens: 150, // Shorter responses for faster pace
              },
            };

            this.logger.log(`Sending session configuration for user: ${userId}`);
            realtimeWs.send(JSON.stringify(sessionConfig));
          } catch (error) {
            this.logger.error(`Failed to send session config for user ${userId}:`, error);
          }
        }, 1000);
      });

      realtimeWs.on('message', async (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());
          await this.handleRealtimeEvent(event, session);
        } catch (error) {
          this.logger.error('Failed to parse WebSocket message:', error);
        }
      });

      realtimeWs.on('close', () => {
        this.logger.log(`WebSocket closed for user: ${userId}`);
        session.isActive = false;
      });

      realtimeWs.on('error', (error) => {
        this.logger.error(`WebSocket error for user ${userId}:`, error);
        this.logger.error(`Error details:`, {
          message: error.message,
          code: (error as any).code || 'unknown',
          readyState: realtimeWs.readyState,
          url: url
        });
        socket.emit('voice-error', {
          error: 'Connection to voice service failed',
          timestamp: new Date().toISOString(),
        });
      });

    } catch (error) {
      this.logger.error(`Failed to start voice session for ${userId}:`, error);
      socket.emit('voice-error', {
        error: 'Failed to start voice session',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleRealtimeEvent(event: any, session: VoiceSession): Promise<void> {
    switch (event.type) {
      case 'session.created':
        this.logger.log(`Realtime session created: ${event.session.id}`);
        session.sessionId = event.session.id;
        session.socket.emit('voice-session-ready', {
          success: true,
          sessionId: event.session.id,
        });
        break;

      case 'response.created':
        this.logger.log('AI response started');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.logger.log(`User said: ${event.transcript}`);
        session.socket.emit('voice-transcript-user', {
          transcript: event.transcript,
          timestamp: new Date().toISOString(),
        });
        
        // Check if user is requesting product info or wants to place an order
        await this.handleUserIntent(event.transcript, session);
        break;

      case 'response.audio.delta':
        session.socket.emit('voice-audio-delta', {
          audio: event.delta,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'response.audio_transcript.delta':
        session.socket.emit('voice-transcript-ai', {
          transcript: event.delta,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'response.done':
        this.logger.log('AI response completed');
        session.socket.emit('voice-response-complete', {
          timestamp: new Date().toISOString(),
        });
        break;

      case 'error':
        this.logger.error('Realtime API error:', event);
        session.socket.emit('voice-error', {
          error: event.error?.message || 'Unknown error occurred',
          timestamp: new Date().toISOString(),
        });
        break;
    }
  }

  async handleAudioInput(userId: string, audioData: Buffer): Promise<void> {
    const session = this.activeSessions.get(userId);
    
    if (!session || !session.realtimeWs || !session.isActive) {
      // Session has ended - stop processing audio immediately
      return;
    }

    // Check if WebSocket is open before sending audio
    if (session.realtimeWs.readyState !== WebSocket.OPEN) {
      this.logger.warn(`WebSocket not ready for user ${userId}, readyState: ${session.realtimeWs.readyState}`);
      return;
    }

    try {
      // Send audio to OpenAI Realtime API
      const audioMessage = {
        type: 'input_audio_buffer.append',
        audio: audioData.toString('base64'),
      };

      session.realtimeWs.send(JSON.stringify(audioMessage));

    } catch (error) {
      this.logger.error(`Failed to process audio for user ${userId}:`, error);
      session.socket.emit('voice-error', {
        error: 'Failed to process audio input',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async commitAudioInput(userId: string): Promise<void> {
    const session = this.activeSessions.get(userId);
    
    if (!session || !session.realtimeWs || !session.isActive) {
      // Session has ended - don't commit audio
      return;
    }

    // Check if WebSocket is open before committing audio
    if (session.realtimeWs.readyState !== WebSocket.OPEN) {
      this.logger.warn(`WebSocket not ready for audio commit, user ${userId}, readyState: ${session.realtimeWs.readyState}`);
      return;
    }

    try {
      // Commit the audio buffer and request response
      session.realtimeWs.send(JSON.stringify({
        type: 'input_audio_buffer.commit',
      }));

      session.realtimeWs.send(JSON.stringify({
        type: 'response.create',
      }));

    } catch (error) {
      this.logger.error(`Failed to commit audio for user ${userId}:`, error);
    }
  }

  async endVoiceSession(userId: string): Promise<void> {
    const session = this.activeSessions.get(userId);
    
    if (!session) {
      this.logger.log(`No active session found for user ${userId} - already ended`);
      return;
    }

    try {
      this.logger.log(`Ending voice session for user: ${userId}`);

      // Mark session as inactive immediately
      session.isActive = false;

      if (session.realtimeWs) {
        // Send session termination messages to OpenAI first
        if (session.realtimeWs.readyState === 1) { // WebSocket.OPEN
          try {
            // Cancel any pending responses
            session.realtimeWs.send(JSON.stringify({
              type: 'response.cancel',
            }));
            
            // Clear audio buffer
            session.realtimeWs.send(JSON.stringify({
              type: 'input_audio_buffer.clear',
            }));
            
            this.logger.log(`Sent termination commands to OpenAI for user: ${userId}`);
          } catch (error) {
            this.logger.error(`Error sending termination commands: ${error}`);
          }
        }
        
        // Force close the WebSocket connection
        session.realtimeWs.terminate ? session.realtimeWs.terminate() : session.realtimeWs.close();
        this.logger.log(`WebSocket connection terminated for user: ${userId}`);
      }

      // Remove session from active sessions immediately
      this.activeSessions.delete(userId);

      // Notify client that session has ended
      session.socket.emit('voice-session-ended', {
        success: true,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Voice session completely ended for user: ${userId}`);

    } catch (error) {
      this.logger.error(`Error ending voice session for ${userId}:`, error);
      // Force cleanup even on error
      this.activeSessions.delete(userId);
    }
  }

  async handleUserInterruption(userId: string): Promise<void> {
    const session = this.activeSessions.get(userId);
    
    if (!session || !session.realtimeWs || !session.isActive) {
      return;
    }

    try {
      // Cancel current AI response to handle interruption
      session.realtimeWs.send(JSON.stringify({
        type: 'response.cancel',
      }));

      // Clear audio buffer
      session.realtimeWs.send(JSON.stringify({
        type: 'input_audio_buffer.clear',
      }));

    } catch (error) {
      this.logger.error(`Failed to handle interruption for user ${userId}:`, error);
    }
  }

  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  isSessionActive(userId: string): boolean {
    const session = this.activeSessions.get(userId);
    return session?.isActive || false;
  }

  private async handleUserIntent(transcript: string, session: VoiceSession): Promise<void> {
    try {
      if (!transcript || transcript.trim().length === 0) {
        return; // Skip empty transcripts
      }

      this.logger.log(`Processing user intent for: "${transcript}"`);
      const lowercaseTranscript = transcript.toLowerCase();
      
      // Enhanced keyword detection for product searches and orders
      const productKeywords = [
        'show me', 'find', 'looking for', 'search', 'products', 'wreath', 'garland', 
        'christmas', 'easter', 'autumn', 'decoration', 'what do you have', 'browse',
        'collection', 'category', 'valentine', 'halloween', 'basket', 'lighting'
      ];
      
      const orderKeywords = [
        'order', 'buy', 'purchase', 'place order', 'i want', 'add to cart', 
        'get', 'need', 'take', 'proceed', 'confirm', 'yes', 'place the order'
      ];
      
      const isProductSearch = productKeywords.some(keyword => lowercaseTranscript.includes(keyword));
      const isOrderIntent = orderKeywords.some(keyword => lowercaseTranscript.includes(keyword));
      
      this.logger.log(`Intent analysis - Product search: ${isProductSearch}, Order intent: ${isOrderIntent}`);
      
      if (isProductSearch || isOrderIntent) {
        this.logger.log(`Processing chat request for user ${session.userId}: "${transcript}"`);
        
        // Use the sales agent service to handle the request
        const chatResponse = await this.salesAgentService.processChat({
          userId: session.userId,
          message: transcript
        });
        
        // Extract text from response (handle both string and object responses)
        const responseText = typeof chatResponse === 'string' ? chatResponse : chatResponse.text || chatResponse;
        
        this.logger.log(`Got chat response: ${typeof responseText === 'string' ? responseText.substring(0, 100) : JSON.stringify(responseText).substring(0, 100)}...`);
        
        // Send the response back through the realtime API
        if (session.realtimeWs && session.realtimeWs.readyState === 1) {
          const responseMessage = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'assistant',
              content: [
                {
                  type: 'input_text',
                  text: responseText
                }
              ]
            }
          };
          
          session.realtimeWs.send(JSON.stringify(responseMessage));
          
          // Request a response to convert the text to speech
          session.realtimeWs.send(JSON.stringify({
            type: 'response.create'
          }));
          
          this.logger.log(`Sent enhanced response to voice session for user ${session.userId}`);
        }
      } else {
        this.logger.log(`No matching intent found for: "${transcript}"`);
      }
    } catch (error) {
      this.logger.error(`Error handling user intent for ${session.userId}:`, error);
    }
  }
}