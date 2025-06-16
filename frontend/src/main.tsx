import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './main.scss'
import Login from './pages/Login'
import Register from './pages/Register'
import UserLayout from './UserLayout'
import Calendar from './pages/Calendar'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        <Route element={<UserLayout />}>
          <Route index element={<Calendar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
