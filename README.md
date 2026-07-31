root/
├── client/                  # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CheckIn.jsx        # Verification desk (camera scan)
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── People.jsx
│   │   │   └── Logs.jsx
│   │   ├── components/
│   │   │   ├── IDCard.jsx         # The digital ID card UI
│   │   │   ├── QRScanner.jsx      # Camera scanner component
│   │   │   └── Navbar.jsx
│   │   └── App.jsx
│
├── server/                  # Express
│   ├── models/
│   │   ├── Person.js        # Staff + Visitor schema
│   │   └── Log.js           # Access log schema
│   ├── routes/
│   │   ├── people.js
│   │   └── logs.js
│   ├── uploads/             # Multer photo storage
│   └── index.js