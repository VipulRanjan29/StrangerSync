# StrangerSync 🌐

A modern, premium random video chat platform built with **Node.js**, **Socket.io**, and **WebRTC**. Experience seamless, high-quality video and text communication with strangers worldwide in a stunning glassmorphism interface.

![StrangerSync Banner](https://raw.githubusercontent.com/VipulRanjan29/StrangerSync/main/Assets/img/banner_placeholder.png)

## ✨ Features

- **🚀 Instant Matching**: Optimized signaling logic for fast, reliable stranger pairing.
- **📹 Premium Video Chat**: High-definition video streams with manual connect controls.
- **💬 Real-Time Messaging**: Secure data channels for instant text chat with typing indicators and auto-scroll.
- **🎭 Glassmorphism UI**: A state-of-the-art dark theme with smooth animations and responsive layouts.
- **🔐 Secure Authentication**: Full Signup/Login system with password hashing and session persistence.
- **🛡️ Safety First**: Integrated reporting system and rate limiting to ensure a clean community.
- **📱 Fully Responsive**: Optimized for Mobile, Tablet, and Desktop.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Real-time**: Socket.io, WebRTC
- **Database**: MongoDB (with robust in-memory mock fallback)
- **Frontend**: EJS, JavaScript (ES6+), Modern CSS
- **Security**: Bcrypt.js, Express Session, Express Rate Limit

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/VipulRanjan29/StrangerSync.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `config.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_uri
   SESSION_SECRET=your_secret_key
   ```
4. Start the server:
   ```bash
   npm start
   ```

## 📸 Screenshots

| Landing Page | Video Chat |
|--------------|------------|
| ![Home](https://raw.githubusercontent.com/VipulRanjan29/StrangerSync/main/screenshots/home.png) | ![Video](https://raw.githubusercontent.com/VipulRanjan29/StrangerSync/main/screenshots/video.png) |

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License.
