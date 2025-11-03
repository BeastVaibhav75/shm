# Shuchi Dental Hospital Management System

A complete hospital management system built with Next.js (App Router) for the frontend and Node.js + Express + MongoDB for the backend.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Doctor, Receptionist)
- Secure password hashing with bcrypt

### 👥 User Management
- **Admin**: Create and manage all users
- **Doctor**: Manage patients and treatments
- **Receptionist**: Manage patients and appointments

### 🏥 Patient Management
- Complete patient profiles with medical history
- Treatment history tracking
- Doctor assignment
- Search and filter functionality

### 📅 Appointment Management
- Schedule appointments with doctors
- Status tracking (Confirmed, Completed, Cancelled, Rescheduled)
- Conflict detection
- Calendar integration

### 🩺 Treatment Management
- Add treatment records for patients
- Treatment history tracking
- Cost management
- Doctor-specific treatment access

### 📱 WhatsApp Notifications
- Patient registration notifications
- Appointment confirmations and reminders
- Treatment completion notifications
- Placeholder functions ready for WhatsApp API integration

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Role-based dashboards
- Intuitive navigation

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hook Form** for form handling
- **Axios** for API calls
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **CORS** for cross-origin requests

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sdhmanagement_system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/Shuchi_dental_hospital
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Database Setup
Make sure MongoDB is running on your system. The application will automatically create the database and collections.

### 5. Seed Data (Optional)
To populate the database with sample data:
```bash
cd backend
npm run seed
```

## Running the Application

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```
The backend server will start on `http://localhost:5000`

### 2. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:3000`

## Demo Credentials

After running the seed data, you can use these credentials to test the system:

### Admin
- **Email**: admin@Shuchidental.com
- **Password**: admin123

### Doctor
- **Email**: dr.rajesh@Shuchidental.com
- **Password**: password123

### Receptionist
- **Email**: sneha@Shuchidental.com
- **Password**: password123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/doctors` - Get all doctors
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `POST /api/patients/:id/treatments` - Add treatment record

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

## Project Structure

```
sdhmanagement_system/
├── backend/
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Authentication & authorization
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── server.js            # Main server file
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js app directory
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── patients/        # Patient management
│   │   ├── appointments/    # Appointment management
│   │   ├── treatments/      # Treatment management
│   │   ├── users/           # User management
│   │   └── login/           # Authentication
│   ├── components/          # Reusable components
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utility functions
│   └── package.json
└── README.md
```

## Role-Based Access Control

### Admin
- Full system access
- User management
- View all data and statistics
- System configuration

### Doctor
- Manage assigned patients
- Add treatment records
- View and manage own appointments
- Patient history access

### Receptionist
- Patient registration and management
- Appointment scheduling
- View treatment history (read-only)
- Daily operations management

## WhatsApp Integration

The system includes placeholder functions for WhatsApp notifications:

- Patient registration notifications
- Appointment confirmations
- Appointment reminders
- Treatment completion notifications
- Appointment cancellations

To integrate with actual WhatsApp API:
1. Update the functions in `backend/utils/whatsapp.js`
2. Add your WhatsApp Business API credentials
3. Configure webhook endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

---

**Shuchi Dental Hospital Management System** - Streamlining healthcare operations with modern technology.
