// src/main.jsx  — TUZATILGAN VERSIYA
// ─────────────────────────────────────────────────────────────
//  ✅ QueryClientProvider → BrowserRouter → Routes (to'g'ri tartib)
//  ✅ Catch-all 404 route eng oxirida
//  ✅ React.StrictMode ishlatiladi
// ─────────────────────────────────────────────────────────────
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

const FIVE_MINUTES = 5 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: FIVE_MINUTES * 6,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.response?.status === 429) return false;
        return failureCount < 1;
      },
      retryDelay: (attempt) => Math.min(400 * 2 ** attempt, 2_000),
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error?.response?.status === 429) return false;
        return failureCount < 1;
      },
      retryDelay: (attempt) => Math.min(400 * 2 ** attempt, 2_000),
    },
  },
});

import Navbar      from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer      from './components/Footer';

import BoshSahifa           from './pages/BoshSahifa';
import OyinlarSahifasi      from './pages/OyinlarSahifasi';
import OyinTafsiloti        from './pages/OyinTafsiloti';
import JadvalSahifasi       from './pages/JadvalSahifasi';
import FutbolchilarSahifasi from './pages/FutbolchilarSahifasi';
import YangiliklarSahifasi  from './pages/YangiliklarSahifasi';
import YangilikTafsiloti    from './pages/YangilikTafsiloti';
import MavsumlarSahifasi    from './pages/MavsumlarSahifasi';
import JamoalarSahifasi     from './pages/JamoalarSahifasi';
import NotFound             from './pages/NotFound';
import AdminLayout          from './admin/AdminLayout';
import Dashboard            from './admin/Dashboard';
import AdminOyinlar         from './admin/AdminOyinlar';
import AdminJamoalar        from './admin/AdminJamoalar';
import AdminFutbolchilar    from './admin/AdminFutbolchilar';
import AdminMavsumlar       from './admin/AdminMavsumlar';
import AdminYangiliklar     from './admin/AdminYangiliklar';
import AdminMatchCenter     from './admin/AdminMatchCenter';
import AdminSlaydlar        from './admin/AdminSlaydlar';
import MatchCenter          from './pages/MatchCenter';
import DasturchiSahifasi    from './pages/DasturchiSahifasi';

/**
 * OmmaviySarlavha — Barcha public sahifallar uchun wrapper
 * Navbar, Footer, ScrollToTop qo'shadi
 */
function OmmaviySarlavha({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <ScrollToTop />
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// APP RENDERING
// ────────────────────────────────────────────────────────────────
// ✅ TARTIB TO'G'RI:
//    1. QueryClientProvider (ichida hooks ishlatiladi)
//    2. BrowserRouter (routing uchun)
//    3. Routes (har bir route)
//    4. OmmaviySarlavha (wrapper) va Components

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>

          {/* ── PUBLIC ROUTES ────────────────────────────────────── */}
          <Route path="/"                    element={<OmmaviySarlavha><BoshSahifa /></OmmaviySarlavha>} />
          <Route path="/oyinlar"             element={<OmmaviySarlavha><OyinlarSahifasi /></OmmaviySarlavha>} />
          <Route path="/oyinlar/:id"         element={<OmmaviySarlavha><OyinTafsiloti /></OmmaviySarlavha>} />
          <Route path="/oyinlar/:id/center"  element={<OmmaviySarlavha><MatchCenter /></OmmaviySarlavha>} />
          <Route path="/jadval"              element={<OmmaviySarlavha><JadvalSahifasi /></OmmaviySarlavha>} />
          <Route path="/futbolchilar"        element={<OmmaviySarlavha><FutbolchilarSahifasi /></OmmaviySarlavha>} />
          <Route path="/jamoalar"            element={<OmmaviySarlavha><JamoalarSahifasi /></OmmaviySarlavha>} />
          <Route path="/mavsumlar"           element={<OmmaviySarlavha><MavsumlarSahifasi /></OmmaviySarlavha>} />
          <Route path="/yangiliklar"         element={<OmmaviySarlavha><YangiliklarSahifasi /></OmmaviySarlavha>} />
          <Route path="/yangiliklar/:id"     element={<OmmaviySarlavha><YangilikTafsiloti /></OmmaviySarlavha>} />
          <Route path="/dasturchi"           element={<OmmaviySarlavha><DasturchiSahifasi /></OmmaviySarlavha>} />

          {/* ── LEGACY REDIRECTS (ORQAGA MOSLIK) ──────────────────── */}
          <Route path="/matches"     element={<OmmaviySarlavha><OyinlarSahifasi /></OmmaviySarlavha>} />
          <Route path="/matches/:id" element={<OmmaviySarlavha><OyinTafsiloti /></OmmaviySarlavha>} />
          <Route path="/table"       element={<OmmaviySarlavha><JadvalSahifasi /></OmmaviySarlavha>} />
          <Route path="/players"     element={<OmmaviySarlavha><FutbolchilarSahifasi /></OmmaviySarlavha>} />
          <Route path="/seasons"     element={<OmmaviySarlavha><MavsumlarSahifasi /></OmmaviySarlavha>} />
          <Route path="/news"        element={<OmmaviySarlavha><YangiliklarSahifasi /></OmmaviySarlavha>} />
          <Route path="/news/:id"    element={<OmmaviySarlavha><YangilikTafsiloti /></OmmaviySarlavha>} />

          {/* ── LEGACY ADMIN REDIRECT ─────────────────────────────── */}
          <Route
            path="/admin_/internal/9f3a7c2e8b1d4f6a9c0e7d2b1a4c8f3e-admin-core-7xk29p4/*"
            element={<Navigate to="/admin" replace />}
          />

          {/* ── ADMIN PANEL ───────────────────────────────────────── */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index               element={<Dashboard />} />
            <Route path="slaydlar"     element={<AdminSlaydlar />} />
            <Route path="oyinlar"      element={<AdminOyinlar />} />
            <Route path="jamoalar"     element={<AdminJamoalar />} />
            <Route path="futbolchilar" element={<AdminFutbolchilar />} />
            <Route path="mavsumlar"    element={<AdminMavsumlar />} />
            <Route path="yangiliklar"  element={<AdminYangiliklar />} />
            <Route path="match-center" element={<AdminMatchCenter />} />
          </Route>

          {/* ── CATCH-ALL: 404 (ENG OXIRIDA!) ──────────────────────── */}
          {/* ⚠️ Bu route OXIRIDA bo'lishi KERAK — React Router yuqoridan
              pastga qarab matching qiladi. */}
          <Route
            path="*"
            element={<OmmaviySarlavha><NotFound /></OmmaviySarlavha>}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);