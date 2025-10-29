import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

export interface ChatMessage {
  userId: string;
  message: string;
  conversationId?: string;
}

interface ConversationHistory {
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  lastActivity: Date;
}

export interface ProductFilter {
  filterType: 'collection' | 'category' | 'name';
  filterValue: string;
}

export interface OrderRequest {
  productId: string;
  quantity: number;
  customerId: string;
}

@Injectable()
export class SalesAgentService {
  private readonly logger = new Logger(SalesAgentService.name);
  private openai: OpenAI;
  private conversationHistories = new Map<string, ConversationHistory>();

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Clean up old conversations every hour
    setInterval(() => {
      this.cleanupOldConversations();
    }, 60 * 60 * 1000);
  }

  private getTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'getProducts',
          description: 'Fetch products from catalogue by collection, category, or name',
          parameters: {
            type: 'object',
            properties: {
              filterType: { 
                type: 'string', 
                enum: ['collection', 'category', 'name'],
                description: 'Type of filter to apply'
              },
              filterValue: { 
                type: 'string',
                description: 'Value to filter by'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of products to return (default 5)',
                default: 5
              }
            },
            required: ['filterType', 'filterValue']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'createOrder',
          description: 'Place an order for a product from the catalogue',
          parameters: {
            type: 'object',
            properties: {
              productId: { 
                type: 'string',
                description: 'ID of the product to order'
              },
              quantity: { 
                type: 'number',
                description: 'Quantity to order (must meet MOQ requirements)'
              },
              customerId: { 
                type: 'string',
                description: 'ID of the customer placing the order'
              }
            },
            required: ['productId', 'quantity', 'customerId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getActiveOffers',
          description: 'Get active offers for products by category or collection',
          parameters: {
            type: 'object',
            properties: {
              productId: { 
                type: 'string',
                description: 'Product ID to check for offers'
              },
              category: { 
                type: 'string',
                description: 'Category to check for offers'
              },
              collection: { 
                type: 'string',
                description: 'Collection to check for offers'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'getTopProducts',
          description: 'Get top-selling or featured products to recommend before order confirmation',
          parameters: {
            type: 'object',
            properties: {
              excludeProductIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Product IDs to exclude from recommendations'
              },
              category: { 
                type: 'string',
                description: 'Filter by category'
              },
              collection: { 
                type: 'string',
                description: 'Filter by collection'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of recommendations (default 3)',
                default: 3
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'createOrderByName',
          description: 'Place an order using product name. Use this directly when customer wants to order a product.',
          parameters: {
            type: 'object',
            properties: {
              productName: { 
                type: 'string',
                description: 'Name of the product to order'
              },
              quantity: { 
                type: 'number',
                description: 'Quantity to order'
              },
              customerId: { 
                type: 'string',
                description: 'ID of the customer placing the order',
                default: 'current-user'
              }
            },
            required: ['productName', 'quantity']
          }
        }
      }
    ];
  }

  async processChat(chatMessage: ChatMessage): Promise<any> {
    this.logger.log(`=== Starting processChat for user: ${chatMessage.userId} ===`);
    try {
      // Get or create conversation history
      const conversation = this.getOrCreateConversation(chatMessage.userId);
      
      // Add user message to history
      conversation.messages.push({
        role: 'user',
        content: chatMessage.message,
        timestamp: new Date()
      });
      conversation.lastActivity = new Date();

      const systemPrompt = `You are Ivanna from Premier Decorations - an engaging sales agent focused on taking orders quickly.

GREETING (first message): "Hi! I'm Ivanna from Premier Decorations. I'm here to help you place orders. What would you like to order today?"

CORE RULES:
1. Keep responses SHORT (1-3 sentences max)
2. Always be ENGAGING and enthusiastic 
3. Focus on ORDER COMPLETION, not just browsing
4. Use tools to fetch products, check offers, and create orders
5. Handle objections by reassuring then redirecting to orders

TOOL USAGE:
- When asked about OFFERS/DEALS/DISCOUNTS or specific products → Use getProducts tool (it automatically includes applicable offers!)
- When customer mentions products → Use getProducts tool → Ask "Ready to order [product]?"
- When customer confirms → Use createOrderByName 
- When customer hesitates → "I understand! Many customers had similar concerns but are seeing great results. Let's get this order started - we'll support you every step!"

CRITICAL: The getProducts tool automatically fetches applicable offers, so you ONLY need ONE tool call:
- For offer inquiries: use getProducts with filterType="name" and filterValue="[product name]"
- The response will include BOTH product details AND any applicable offers
- NO need for separate getActiveOffers calls!

EXAMPLE: User asks "offers on festive table runner" → use getProducts for "festive table runner" → respond with price AND offers from the single response

PERSONALITY: Warm, confident, order-focused. Use urgency ("Popular choice!") and reassurance ("We'll support you!").

INVENTORY: Christmas/Easter/Autumn/Valentine's/Halloween collections. Wreaths, Garlands, Decorations, Table Accessories, Lighting, Baskets.`;

      // Build conversation messages for OpenAI
      const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversation.messages.slice(-5).map(msg => ({ // Keep last 5 messages for context (saves tokens)
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      this.logger.log('Making OpenAI API call...');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cheapest model
        messages: conversationMessages,
        tools: this.getTools(),
        tool_choice: 'auto',
        temperature: 0.8, // More engaging responses
        max_tokens: 250 // Increased for multi-step tool usage
      });

      const assistantMessage = response.choices[0].message;
      
      if (assistantMessage.tool_calls) {
        // Process tool calls
        let toolResults = [];
        
        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          let toolResult;
          try {
            switch (toolName) {
              case 'getProducts':
                toolResult = await this.getProducts(toolArgs);
                break;
              case 'createOrder':
                toolResult = await this.createOrder({
                  ...toolArgs,
                  customerId: chatMessage.userId
                });
                break;
              case 'getActiveOffers':
                toolResult = await this.getActiveOffers(toolArgs);
                break;
              case 'getTopProducts':
                toolResult = await this.getTopProducts(toolArgs);
                break;
              case 'createOrderByName':
                toolResult = await this.createOrderByName({
                  ...toolArgs,
                  customerId: chatMessage.userId
                });
                break;
              default:
                toolResult = { error: 'Unknown tool' };
            }
          } catch (error) {
            toolResult = { error: error.message };
          }
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: JSON.stringify(toolResult)
          });
        }

        // Get final response with tool results
        const finalResponse = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini', // Cheapest model
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversation.messages.slice(-5).map(msg => ({ // Reduced context to save tokens
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            })),
            assistantMessage,
            ...toolResults
          ],
          temperature: 0.8, // More engaging responses
          max_tokens: 250 // Increased for multi-step tool usage
        });

        const finalContent = finalResponse.choices[0].message.content || 'I apologize, I encountered an error processing your request.';
        
        // Add assistant response to conversation history
        conversation.messages.push({
          role: 'assistant',
          content: finalContent,
          timestamp: new Date()
        });
        
        return finalContent;
      }

      const responseContent = assistantMessage.content || 'I\'m here to help you find products and place orders. What can I assist you with?';
      
      // Add assistant response to conversation history
      conversation.messages.push({
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      });

      // Check if any products were fetched in tool calls and return structured data
      let productData = null;
      this.logger.log(`Checking for tool calls in assistant message: ${!!assistantMessage.tool_calls}`);
      if (assistantMessage.tool_calls) {
        this.logger.log(`Found ${assistantMessage.tool_calls.length} tool calls`);
        for (const toolCall of assistantMessage.tool_calls) {
          this.logger.log(`Tool call function name: ${(toolCall as any).function?.name}`);
          if ((toolCall as any).function?.name === 'getProducts') {
            try {
              const toolArgs = JSON.parse((toolCall as any).function.arguments);
              this.logger.log(`Getting products with args: ${JSON.stringify(toolArgs)}`);
              const products = await this.getProducts(toolArgs);
              this.logger.log(`Products result: success=${products.success}, count=${products.products?.length || 0}`);
              if (products.success && products.products.length > 0) {
                productData = products.products; // Return all products for carousel
                this.logger.log(`Set productData with ${productData.length} products`);
              }
            } catch (error) {
              this.logger.error('Error getting products for structured response:', error);
            }
          }
        }
      } else {
        // No tool calls made - let's check if the response mentions products and fetch some
        this.logger.log('No tool calls made, checking if response mentions products...');
        const responseContent = assistantMessage.content;
        
        // Simplified fallback: fetch Christmas products as they're most popular
        const productKeywords = ['christmas', 'wreath', 'garland', 'decoration', 'easter', 'autumn', 'valentine', 'halloween'];
        const hasProductMention = productKeywords.some(keyword => responseContent.toLowerCase().includes(keyword));
        
        if (hasProductMention) {
          this.logger.log('Response mentions products, fetching Christmas collection as fallback');
          try {
            const products = await this.getProducts({
              filterType: 'collection',
              filterValue: 'Christmas',
              limit: 4
            });
            if (products.success && products.products.length > 0) {
              productData = products.products;
              this.logger.log(`Fetched ${productData.length} Christmas products as fallback`);
            }
          } catch (error) {
            this.logger.error('Error fetching fallback Christmas products:', error);
          }
        }
      }

      const result = {
        text: responseContent,
        products: productData,
        timestamp: new Date().toISOString()
      };
      
      this.logger.log(`Returning structured response: ${JSON.stringify({
        hasText: !!result.text,
        hasProducts: !!result.products,
        productCount: result.products?.length || 0
      })}`);
      
      return result;

    } catch (error) {
      this.logger.error('=== ERROR in processChat ===');
      this.logger.error('Error message:', error.message);
      this.logger.error('Error stack:', error.stack);
      this.logger.error('Error details:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact our support team.';
    }
  }

  private async getProducts(filter: ProductFilter & { limit?: number }) {
    try {
      const { filterType, filterValue, limit = 5 } = filter;
      this.logger.log(`Fetching products: ${filterType} = ${filterValue}, limit = ${limit}`);
      
      let whereClause: any = { status: 'ACTIVE' };
      
      switch (filterType) {
        case 'collection':
          whereClause.collection = {
            contains: filterValue
          };
          break;
        case 'category':
          whereClause.category = {
            contains: filterValue
          };
          break;
        case 'name':
          whereClause.name = {
            contains: filterValue
          };
          break;
      }

      this.logger.log(`Product where clause: ${JSON.stringify(whereClause)}`);

      const products = await this.prisma.product.findMany({
        where: whereClause,
        take: limit,
        orderBy: [
          { aiSuggestion: 'desc' }, // Prioritize suggested products
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          category: true,
          collection: true,
          price: true,
          pcPrice: true,
          csPrice: true,
          pcQuantity: true,
          csQuantity: true,
          moq: true,
          packSize: true,
          images: true,
          tags: true,
          aiSuggestion: true
        }
      });

      this.logger.log(`Found ${products.length} products`);

      // Automatically fetch offers for found products
      let applicableOffers = [];
      if (products.length > 0) {
        try {
          // Get all unique categories and collections from the products
          const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
          const collections = [...new Set(products.map(p => p.collection).filter(Boolean))];
          const productIds = products.map(p => p.id);

          // Fetch applicable offers
          const now = new Date();
          const offers = await this.prisma.offer.findMany({
            where: {
              isActive: true,
              OR: [
                { startsAt: null },
                { startsAt: { lte: now } },
              ],
              AND: [
                {
                  OR: [
                    { endsAt: null },
                    { endsAt: { gte: now } },
                  ],
                },
                {
                  OR: [
                    { scopesProducts: { some: { productId: { in: productIds } } } },
                    { scopesCategories: { some: { category: { in: categories } } } },
                    { scopesCollections: { some: { collection: { in: collections } } } },
                  ],
                },
              ],
            },
            include: {
              scopesProducts: { include: { product: true } },
              scopesCategories: true,
              scopesCollections: true,
              freeItemProduct: true,
            },
            orderBy: { priority: 'desc' },
          });

          applicableOffers = offers.map(offer => ({
            id: offer.id,
            name: offer.name,
            description: offer.description,
            type: offer.type,
            percentOff: offer.percentOff,
            amountOff: offer.amountOff,
            minQuantity: offer.minQuantity,
            minOrderAmount: offer.minOrderAmount,
            freeItemProduct: offer.freeItemProduct,
            isStackable: offer.isStackable,
            priority: offer.priority
          }));

          this.logger.log(`Found ${applicableOffers.length} applicable offers for products`);
        } catch (error) {
          this.logger.error('Error fetching offers for products:', error);
          // Continue without offers if there's an error
        }
      }

      return {
        success: true,
        products: products.map(product => ({
          ...product,
          price: parseFloat(product.price.toString()),
          pcPrice: product.pcPrice ? parseFloat(product.pcPrice.toString()) : null,
          csPrice: product.csPrice ? parseFloat(product.csPrice.toString()) : null,
          formattedPrice: product.pcPrice 
            ? `£${parseFloat(product.pcPrice.toString()).toFixed(2)} GBP per piece | £${parseFloat(product.csPrice.toString()).toFixed(2)} GBP per case`
            : `£${parseFloat(product.price.toString()).toFixed(2)} GBP per ${product.packSize}`,
          moqInfo: `Minimum order: ${product.moq} units`
        })),
        total: products.length,
        offers: applicableOffers,
        offersMessage: applicableOffers.length > 0 
          ? `Great news! I found ${applicableOffers.length} active offer${applicableOffers.length > 1 ? 's' : ''} that apply to ${applicableOffers.length === 1 ? 'this product' : 'these products'}!`
          : 'No current offers apply to these products, but the prices shown are still great value!'
      };

    } catch (error) {
      this.logger.error('Error fetching products:', error);
      return { success: false, error: 'Failed to fetch products' };
    }
  }

  private async createOrder(orderRequest: OrderRequest) {
    try {
      const { productId, quantity, customerId } = orderRequest;

      // Verify product exists and get details
      const product = await this.prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return { success: false, error: 'Product not found in catalogue' };
      }

      // Check MOQ requirements
      if (quantity < product.moq) {
        return { 
          success: false, 
          error: `Minimum order quantity is ${product.moq} units. You requested ${quantity} units.` 
        };
      }

      // Verify customer exists
      const customer = await this.prisma.user.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      // Calculate totals
      const unitPrice = parseFloat(product.price.toString());
      const totalAmount = unitPrice * quantity;

      // Create the order
      const order = await this.prisma.order.create({
        data: {
          userId: customerId,
          orderNumber: `ORD-${Date.now()}`,
          totalAmount,
          status: 'PENDING',
          placedAt: new Date(),
          items: {
            create: {
              productId,
              quantity,
              unitPrice,
              moqAtOrder: product.moq,
              initialPcQuantity: quantity,
              initialCsQuantity: 0,
              netQuantity: quantity,
              initialAmount: totalAmount,
              billAmount: totalAmount,
              netAmount: totalAmount,
            }
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      });

      return {
        success: true,
        order: {
          orderId: order.id,
          productName: product.name,
          quantity,
          unitPrice,
          totalAmount,
          status: order.status,
          message: `✅ Your order for ${product.name} (${quantity} units) has been placed successfully! Total: £${totalAmount.toFixed(2)} GBP`
        }
      };

    } catch (error) {
      this.logger.error('Error creating order:', error);
      return { success: false, error: 'Failed to create order' };
    }
  }

  private async getActiveOffers(params: { productId?: string; category?: string; collection?: string }) {
    try {
      const { productId, category, collection } = params;
      
      // Get current active offers from database
      const now = new Date();
      let whereClause: any = {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } }
            ]
          }
        ]
      };

      // If specific criteria provided, filter by scope
      if (productId || category || collection) {
        const orConditions = [];
        
        if (productId) {
          orConditions.push({ scopesProducts: { some: { productId } } });
          
          // Also fetch product details to check for collection and category offers
          try {
            const product = await this.prisma.product.findUnique({
              where: { id: productId },
              select: { category: true, collection: true }
            });
            
            if (product?.collection) {
              orConditions.push({ scopesCollections: { some: { collection: product.collection } } });
            }
            if (product?.category) {
              orConditions.push({ scopesCategories: { some: { category: product.category } } });
            }
          } catch (err) {
            this.logger.error('Error fetching product details for offers:', err);
          }
        }
        
        if (collection) {
          orConditions.push({ scopesCollections: { some: { collection } } });
        }
        
        if (category) {
          orConditions.push({ scopesCategories: { some: { category } } });
        }
        
        if (orConditions.length > 0) {
          whereClause.AND = [
            ...(whereClause.AND || []),
            { OR: orConditions }
          ];
        }
      }

      const dbOffers = await this.prisma.offer.findMany({
        where: whereClause,
        include: {
          scopesProducts: { include: { product: { select: { name: true } } } },
          scopesCategories: true,
          scopesCollections: true,
          freeItemProduct: { select: { name: true } }
        },
        orderBy: { priority: 'desc' }
      });
      
      this.logger.log(`Found ${dbOffers.length} database offers`);

      // Transform database offers to expected format
      const transformedOffers = dbOffers.map(offer => {
        let description = offer.description || '';
        let eligibility = '';
        
        // Build description based on offer type
        if (offer.type === 'PERCENT_OFF') {
          description = `${offer.percentOff}% off ${description}`;
        } else if (offer.type === 'AMOUNT_OFF') {
          description = `£${offer.amountOff} off ${description}`;
        } else if (offer.type === 'FREE_ITEM') {
          const freeItemName = offer.freeItemProduct?.name || 'free item';
          description = `Get a free ${freeItemName} ${description}`;
        }

        // Build eligibility requirements
        const requirements = [];
        if (offer.minOrderAmount) {
          requirements.push(`Minimum order £${offer.minOrderAmount}`);
        }
        if (offer.minQuantity > 0) {
          requirements.push(`Minimum ${offer.minQuantity} items`);
        }
        eligibility = requirements.join(', ');

        return {
          id: offer.id,
          name: offer.name,
          description: description.trim(),
          type: offer.type,
          percentOff: offer.percentOff ? Number(offer.percentOff) : undefined,
          amountOff: offer.amountOff ? Number(offer.amountOff) : undefined,
          freeItemName: offer.freeItemProduct?.name,
          minOrderAmount: offer.minOrderAmount ? Number(offer.minOrderAmount) : undefined,
          minQuantity: offer.minQuantity,
          eligibility: eligibility,
          isStackable: offer.isStackable,
          priority: offer.priority
        };
      });

      return {
        success: true,
        offers: transformedOffers,
        total: transformedOffers.length,
        message: transformedOffers.length > 0 
          ? `I found ${transformedOffers.length} active offer${transformedOffers.length > 1 ? 's' : ''} for you!` 
          : 'No current offers are available, but let\'s proceed with your order.'
      };

    } catch (error) {
      this.logger.error('Error fetching offers:', error);
      return { 
        success: false, 
        error: 'Failed to fetch offers',
        offers: [],
        total: 0
      };
    }
  }

  private async getTopProducts(params: { excludeProductIds?: string[]; category?: string; collection?: string; limit?: number }) {
    try {
      const { excludeProductIds = [], category, collection, limit = 3 } = params;
      
      let whereClause: any = { 
        status: 'ACTIVE',
        id: { notIn: excludeProductIds }
      };
      
      if (category) {
        whereClause.category = { contains: category };
      }
      
      if (collection) {
        whereClause.collection = { contains: collection };
      }

      const products = await this.prisma.product.findMany({
        where: whereClause,
        take: limit,
        orderBy: [
          { aiSuggestion: 'desc' }, // Prioritize AI suggested products
          { createdAt: 'desc' }      // Then newest products
        ],
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          category: true,
          collection: true,
          price: true,
          pcPrice: true,
          csPrice: true,
          pcQuantity: true,
          csQuantity: true,
          moq: true,
          packSize: true,
          images: true,
          tags: true,
          aiSuggestion: true
        }
      });

      return {
        success: true,
        products: products.map(product => ({
          ...product,
          price: parseFloat(product.price.toString()),
          pcPrice: product.pcPrice ? parseFloat(product.pcPrice.toString()) : null,
          csPrice: product.csPrice ? parseFloat(product.csPrice.toString()) : null,
          formattedPrice: product.pcPrice 
            ? `£${parseFloat(product.pcPrice.toString()).toFixed(2)} GBP per piece | £${parseFloat(product.csPrice.toString()).toFixed(2)} GBP per case`
            : `£${parseFloat(product.price.toString()).toFixed(2)} GBP per ${product.packSize}`,
          moqInfo: `Minimum order: ${product.moq} units`,
          benefit: this.generateProductBenefit(product)
        })),
        total: products.length
      };

    } catch (error) {
      this.logger.error('Error fetching top products:', error);
      return { success: false, error: 'Failed to fetch top products' };
    }
  }


  private async createOrderByName(params: { productName: string; quantity: number; customerId?: string }) {
    try {
      const { productName, quantity, customerId } = params;

      // Find product by name
      const product = await this.prisma.product.findFirst({
        where: { 
          name: { contains: productName },
          status: 'ACTIVE' 
        }
      });

      if (!product) {
        return { 
          success: false, 
          error: `Product "${productName}" not found. Please check the product name.` 
        };
      }

      // Use existing createOrder method with the found product ID
      return await this.createOrder({
        productId: product.id,
        quantity,
        customerId
      });

    } catch (error) {
      this.logger.error('Error creating order by name:', error);
      return { success: false, error: 'Failed to create order' };
    }
  }

  private generateProductBenefit(product: any): string {
    const benefits = [
      `Perfect complement to ${product.category.toLowerCase()} collections`,
      `High-quality ${product.collection} themed product`,
      `Bulk savings with MOQ of ${product.moq} units`,
      `Popular choice in ${product.category} category`,
      `Essential for complete ${product.collection} displays`
    ];
    
    return benefits[Math.floor(Math.random() * benefits.length)];
  }

  private getOrCreateConversation(userId: string): ConversationHistory {
    let conversation = this.conversationHistories.get(userId);
    
    if (!conversation) {
      conversation = {
        userId,
        messages: [],
        lastActivity: new Date()
      };
      this.conversationHistories.set(userId, conversation);
    }
    
    return conversation;
  }

  private cleanupOldConversations(): void {
    const cutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    
    for (const [userId, conversation] of this.conversationHistories.entries()) {
      if (conversation.lastActivity < cutoffTime) {
        this.conversationHistories.delete(userId);
        this.logger.log(`Cleaned up conversation for user: ${userId}`);
      }
    }
  }

  clearConversation(userId: string): void {
    this.conversationHistories.delete(userId);
    this.logger.log(`Cleared conversation for user: ${userId}`);
  }
}