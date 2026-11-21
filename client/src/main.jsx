import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import './index.css';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><Routes><Route element={<Layout/>}><Route index element={<Home/>}/><Route path="admin" element={<AdminLogin/>}/><Route path="admin/dashboard" element={<AdminDashboard/>}/><Route path="*" element={<main className="p-24 text-center"><h1 className="text-4xl font-black">Page not found</h1></main>}/></Route></Routes></BrowserRouter></React.StrictMode>);
