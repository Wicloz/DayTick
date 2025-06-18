import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './main.scss'
import Login from './pages/Login'
import Register from './pages/Register'
import UserLayout from './UserLayout'
import Calendar from './pages/Calendar'
import Task from './pages/Task'
import Search from './pages/Search'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        <Route element={<UserLayout />}>
          <Route index element={<Calendar />} />
          <Route path='/tasks/:id' element={<Task />} />
          <Route path='/tasks' element={<Search />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
