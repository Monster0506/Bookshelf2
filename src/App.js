import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ArticleDetail from "./pages/ArticleDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import TrashView from "./pages/TrashView";
import Navbar from "./components/Navbar";
import AddArticle from "./pages/AddArticle";
import ArticleList from "./pages/ArticleList"; 
import ArticleGraph from "./pages/ArticleGraph";
import FolderList from "./components/FolderList";
import FolderView from "./pages/FolderView";
import AdminPage from "./pages/AdminPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ActiveReadingProvider } from "./components/ArticleDetails/ActiveReading/ActiveReadingProvider";
import "./styles/highlights.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ActiveReadingProvider>
          <div className="App">
            <Navbar />
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ArticleList />
                  </ProtectedRoute>
                }
              />
              <Route path="/signup" element={<Signup />} />
              <Route path="/folders/:id" element={<FolderView />} />
              <Route path="/folders" element={<FolderList />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-article"
                element={
                  <ProtectedRoute>
                    <AddArticle />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/articles"
                element={
                  <ProtectedRoute>
                    <ArticleList />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/trash"
                element={
                  <ProtectedRoute>
                    <TrashView />
                  </ProtectedRoute>
                }
              />{" "}
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route
                path="/graph"
                element={
                  <ProtectedRoute>
                    <ArticleGraph />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </ActiveReadingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
