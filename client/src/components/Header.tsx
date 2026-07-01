import { Link } from '@tanstack/react-router'
import { LogIn, LogOut } from 'lucide-react'
import { authClient } from '../lib/auth-client'
import {useState} from 'react'

export default function Header() {
  return (
    <header className='flex gap-2 bg-base-300  justify-between'>
      <nav className='navbar'>
        <div className='navbar-start'>
           <div className='px-2 '>
          <Link to='/' activeProps={{ className: 'font-bold text-primary' }}>
            Home
          </Link>
        </div>

       <div className='px-2'>
           <Link to='/todos'  activeProps={{ className: 'font-bold text-primary' }}>
             Todos 
           </Link>
        </div>
       </div>

       <div className='navbar-end'>
        <LogIn className='size-5' />
       </div>
      </nav>
    </header>
  )
}