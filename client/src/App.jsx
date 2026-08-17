import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Post from './pages/Post.jsx';
import CreateRequest from './pages/CreateRequest.jsx';
import BrowseRequests from './pages/BrowseRequests.jsx';
import RequestDetail from './pages/RequestDetail.jsx';
import MyOffers from './pages/MyOffers.jsx';
import Premium from './pages/Premium.jsx';
import Profile from './pages/Profile.jsx';
import BrowseOpenings from './pages/BrowseOpenings.jsx';
import OfferReferral from './pages/OfferReferral.jsx';
import OpeningDetail from './pages/OpeningDetail.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={
          <ProtectedRoute requireComplete={false}><ProfileSetup /></ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        {/* Browse (unified marketplace) */}
        <Route path="/browse" element={
          <ProtectedRoute><BrowseRequests /></ProtectedRoute>
        } />
        <Route path="/openings" element={
          <ProtectedRoute><BrowseOpenings /></ProtectedRoute>
        } />

        {/* Post (single hub -> branches) */}
        <Route path="/post" element={
          <ProtectedRoute><Post /></ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute><CreateRequest /></ProtectedRoute>
        } />
        <Route path="/offer" element={
          <ProtectedRoute><OfferReferral /></ProtectedRoute>
        } />

        {/* details */}
        <Route path="/request/:id" element={
          <ProtectedRoute><RequestDetail /></ProtectedRoute>
        } />
        <Route path="/opening/:id" element={
          <ProtectedRoute><OpeningDetail /></ProtectedRoute>
        } />

        <Route path="/my-offers" element={
          <ProtectedRoute><MyOffers /></ProtectedRoute>
        } />
        <Route path="/premium" element={
          <ProtectedRoute><Premium /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}
