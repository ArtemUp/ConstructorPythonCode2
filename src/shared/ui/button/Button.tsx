import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'secondary' | 'destructive'
}

export const Button = ({ children, onClick, variant = 'default' }: ButtonProps) => {
  const variants = {
    default: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    destructive: 'bg-red-500 hover:bg-red-600 text-white',
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  )
}