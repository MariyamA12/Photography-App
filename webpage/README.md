# Webpage – Parent and Admin React Frontend

This repository contains a unified React application that serves both Admin and Parent user roles for the project.

## Technology Stack

- React (Create React App)
- React Router DOM for routing
- Tailwind CSS for styling
- Context API for state management
- Axios for HTTP requests

## Folder Structure

```

webpage/
├── public/
├── src/
│   ├── App.jsx
│   ├── index.js
│   ├── assets/                   # Static images and icons
│   ├── components/               # Shared reusable UI components
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Admin/                # Admin-specific pages
│   │   └── Parent/               # Parent-specific pages
│   ├── layouts/                  # Layouts for Admin and Parent portals
│   ├── features/                 # Context and logic (auth, notifications, etc.)
│   ├── services/                 # Axios and Firebase service handlers
│   ├── hooks/                    # Custom React hooks
│   ├── constants/                # Route paths, role definitions
│   └── styles/
│       └── globals.css           # Tailwind base + custom styles
├── .env                          # Environment variables
├── .gitignore
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md

````

## Project will run on

http://localhost:3000

## Tailwind CSS Configuration

### tailwind.config.js

```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
````

### postcss.config.js

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### src/styles/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### src/index.js

Ensure global styles are imported:

```js
import "./styles/globals.css";
```

## Notes

* The app uses `/admin/*` and `/parent/*` routes to isolate functionality for different user roles.
* All reusable components are centralized in `src/components`.
* Context-based logic such as authentication and notifications are grouped under `src/features`.

