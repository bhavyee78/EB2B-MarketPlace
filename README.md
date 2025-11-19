# EB2B MarketPlace

A modern B2B marketplace platform with AI-powered sales agents for any business which is B2B Trading. This platform enables businesses to browse products, place orders, and interact with intelligent sales agents through chat and voice interfaces.

🚀 Why This Project is Innovative

Unifies three traditionally separate systems — B2B marketplace, Sales Force Automation (SFA), and Distributor Management System(DMS) — into one platform, giving businesses a single, intelligent system for ordering, field-sales operations and data management.

Designed with multi-tier access (Admin / Retailer / Salesman) to support field-heavy industries like FMCG, home décor and seasonal gifting, where retailers and sales staff operate in fast, high-volume environments.

Built as a white-label platform, enabling any B2B company to launch its own retailer app with custom branding, product lines, offers, nudges and AI-driven sales workflows without new development.

## 💼 Business Use Case & Impact

This MVP was built for a UK-based seasonal décor wholesaler (Premier Decorations–style B2B model):

- Enables retailers to place orders 24/7 without relying on a sales rep visit or phone call.
- Helps the brand push personalised offers, nudges and ready-made baskets to increase average order value.
- Gives the sales team a live view of retailer activity and performance, improving route planning and follow-ups.
- Designed to replace spreadsheet/WhatsApp-based ordering with a structured, data-driven platform.

🚀 What is Planned
Planned integration of AI-driven analytics, including inventory intelligence, demand forecasting, and SKU-level restock recommendations based on internal sales data combined with external market signals.

Future capabilities include AI supply chain intelligence, using publicly available datasets — Amazon marketplace category trends, Google Trends data, social media sentiment, hashtag trends, and online buying behaviour — to help businesses identify which products are gaining traction and should be stocked or promoted.

The ultimate aim is to build a next-generation B2B operating system where marketplace ordering, field-sales tracking, distributor management, and AI-powered decision support work seamlessly together — giving businesses real-time insight and automation across the full commercial value chain.

👨‍💻 My Role

- Designed the overall system architecture (NestJS + Prisma + MySQL + Next.js + Socket.IO).
- Implemented core backend modules: authentication, products, orders, AI sales agent, offers and RFQs.
- Built the multi-role access model (Admin / Retailer / Salesman) and JWT-based auth.
- Integrated OpenAI GPT-4 + Realtime API for chat and voice interactions.
- Set up database schema and migrations using Prisma, and optimised queries for B2B catalogue scale.
- Developed the admin dashboard and key marketplace flows on the frontend (Next.js + Tailwind).


🔐 Multi-Level User Access

The platform supports a multi-tier login system for different roles within a B2B ecosystem:

🛠️ Admin (Business Owner)
Access full control dashboard
Upload and manage products
Configure retailer dashboards
Create and manage offers, nudges & notifications
Track KPIs and business performance
Monitor and evaluate field staff/salesman activity

🛒 Retailer (Customers of the Business)
Browse product catalog and custom collections
Place orders and reorders easily
Interact with AI sales agent "Ivanna" via chat/voice
Access ready-made product baskets and offer

🚀 Salesman (Field Staff)
View assigned retailers and assist in order placements
View assigned KPI'S
Track personal performance metrics
Support relationship-building between brand and retailers

🛍️ Marketplace
Product catalog with advanced filtering and search
AI-powered automatic categorization of products
Customisable collections section and ready-made baskets
Dynamic offers and promotions
Seamless cart and order management

### 🤖 AI Sales Agent
- **Chat Interface**: Text-based conversation with AI sales agent "Ivanna"
- **Voice Interface**: Real-time voice conversations using OpenAI's Realtime API
- Product recommendations and upselling
- Automated order placement
- Offer checking and application
- Natural language processing for customer queries

### 👨‍💼 Admin Dashboard
- Product management (CRUD operations)
- Order tracking and management
- Offer creation and management
- Banner and collection image management
- Feature management
- User management

### 📊 Sales Dashboard
- Lead management
- CRM functionality
- Sales analytics

## Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **AI Integration**: OpenAI GPT-4 and Realtime API
- **File Upload**: AWS S3 / Local storage
- **Real-time Communication**: Socket.IO

### Frontend
- **Framework**: Next.js 13+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Internationalization**: Custom i18n implementation
- **Real-time**: Socket.IO Client

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn
- OpenAI API key

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/bhavyee78/EB2B-MarketPlace.git
cd EB2B-MarketPlace
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
DATABASE_URL="mysql://username:password@localhost:3306/premier_marketplace"
JWT_SECRET="your-jwt-secret-key"
PORT=3001

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# AWS S3 (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

```bash
# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start the backend server
npm run start:dev
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
EB2B-MarketPlace/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # Database migrations
│   │   └── seed.ts               # Database seeding
│   ├── src/
│   │   ├── admin/                # Admin module
│   │   ├── auth/                 # Authentication module
│   │   ├── orders/               # Order management
│   │   ├── products/             # Product catalog
│   │   ├── sales-agent/          # AI sales agent
│   │   ├── offers/               # Offers and promotions
│   │   ├── rfqs/                 # Request for quotes
│   │   └── sales/                # Sales and CRM
│   └── scripts/                  # Utility scripts
│
└── frontend/
    ├── app/
    │   ├── (admin)/              # Admin pages
    │   ├── (marketplace)/        # Marketplace pages
    │   ├── (sales)/              # Sales pages
    │   └── (auth)/               # Authentication pages
    ├── components/               # Reusable components
    ├── contexts/                 # React contexts
    ├── services/                 # API services
    └── lib/                      # Utility libraries
```

## Usage

### Default Users

After seeding the database, you can log in with:

- **Admin**: Check your database or create via admin scripts
- **Customer**: Register through the signup page
- **Salesperson**: Create via admin panel

### AI Sales Agent

The AI sales agent "Ivanna" can:
- Answer product queries
- Check for available offers
- Place orders on behalf of customers
- Provide product recommendations
- Handle objections and close sales

**Chat Mode**: Click the floating agent button to start a text conversation
**Voice Mode**: Enable microphone access for real-time voice conversations

## API Documentation

The backend API runs on `http://localhost:3001` with the following main endpoints:

- `/auth/*` - Authentication endpoints
- `/products/*` - Product catalog
- `/orders/*` - Order management
- `/offers/*` - Offers and promotions
- `/sales-agent/*` - AI agent interactions
- `/admin/*` - Admin operations

## Database Schema

Key models:
- **User** - Users, customers, admins, salespeople
- **Product** - Product catalog
- **Order** - Orders and order items
- **Offer** - Promotional offers
- **RFQ** - Request for quotes
- **Banner** - Homepage banners
- **Feature** - Featured content

## Environment Variables

### Required
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Secret for JWT token generation
- `OPENAI_API_KEY` - OpenAI API key for AI features

### Optional
- `AWS_*` - AWS S3 configuration for file uploads
- `SMTP_*` - Email service configuration

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- Never commit `.env` files
- Keep your OpenAI API key secure
- Use environment variables for all sensitive data
- Regularly update dependencies

## License

This project is proprietary and confidential.

## Acknowledgments

- OpenAI for GPT-4 and Realtime API
- NestJS and Next.js communities
- Prisma for database tooling

## Screenshots
Login page
<img width="376" height="812" alt="image" src="https://github.com/user-attachments/assets/1e19c52c-51c5-4c06-91f5-eae103633a21" />

Retailer's Home Screen
<img width="376" height="813" alt="image" src="https://github.com/user-attachments/assets/81f7ba70-34ef-415b-b924-ad3d0d6f1a7d" />

Admins Dashboard
<img width="1439" height="898" alt="image" src="https://github.com/user-attachments/assets/edb7b134-7afd-440a-8744-39a86f7acb18" />





