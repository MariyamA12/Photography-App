webpage/
├── public/
│   └── index.html
│
├── src/
│   ├── App.jsx                     # Main App component with routes
│   ├── index.js                   # Entry point
│
│   ├── assets/                    # Images, icons, etc.
│
│   ├── components/                # Reusable UI components
│   │   ├── layout
│   │   ├── routing
│   │   └── UI
│
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Admin/                 # Admin-specific pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CreateEvent.jsx
│   │   │   └── UploadPhotos.jsx
│   │   └── Parent/                # Parent-specific pages
│   │       ├── ParentDashboard.jsx
│   │       ├── LifeGallery.jsx
│   │       └── PurchaseHistory.jsx
│
│   ├── features/                  # Logic layer (context, hooks)
│   │   ├── auth/
│   │   │   ├── authContext.js
│   │   │   └── useAuth.js
│   │   ├── notifications/
│   │   │   └── useNotification.js
│   │   └── photos/
│   │       └── usePhotos.js
│
│   ├── services/                  # API services, Firebase config
│   │   ├── api.js
│   │   ├── firebase.js
│   │   └── authService.js
│
│   ├── hooks/
│   │   └── useRoleRedirect.js
│
│   ├── constants/
│   │   ├── routes.js
│   │   └── roles.js
│
│   ├── styles/
│   │   └── globals.css
│
├── .env
├── .gitignore
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
