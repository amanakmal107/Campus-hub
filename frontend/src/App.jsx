import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Feed } from './pages/Feed';
import { Books } from './pages/Books';
import { Notes } from './pages/Notes';
import { Communities } from './pages/Communities';
import { CommunityDetail } from './pages/CommunityDetail';
import { Chat } from './pages/Chat';
import { News } from './pages/News';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">{children}</main>
      <BottomNav />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Navbar />
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Main App Routes within Layout */}
                <Route
                  path="/"
                  element={
                    <Layout>
                      <Feed />
                    </Layout>
                  }
                />
                <Route
                  path="/books"
                  element={
                    <Layout>
                      <Books />
                    </Layout>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <Layout>
                      <Notes />
                    </Layout>
                  }
                />
                <Route
                  path="/communities"
                  element={
                    <Layout>
                      <Communities />
                    </Layout>
                  }
                />
                <Route
                  path="/communities/:id"
                  element={
                    <Layout>
                      <CommunityDetail />
                    </Layout>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Chat />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/news"
                  element={
                    <Layout>
                      <News />
                    </Layout>
                  }
                />
                <Route
                  path="/profile/:id"
                  element={
                    <Layout>
                      <Profile />
                    </Layout>
                  }
                />

                {/* Catch all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
