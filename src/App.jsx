import { useState } from 'react'
import './styles.css'
import {  Routes, Route } from 'react-router-dom';
import Page from "./pages/page.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Settings_Page from './components/Settings.jsx';
import Store from './pages/Store.jsx';
import Layout from './components/Layout.jsx';
import Setup from './components/Setup.jsx';

export default function App() {
  return (
    <>
        <Layout/>
        <Routes className="page-content">
          <Route path="/" element={<Home/>} />
          <Route path="/page" element={<Page/>}/>
          <Route path="/home" element={<Home/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/settings" element={<Settings_Page/>}/>
          <Route path="/store" element={<Store/>}/>
          <Route path="/setup" element={<Setup/>}/>
        </Routes>
    </>
  )
}

