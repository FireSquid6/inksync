import { useState } from 'react'
import { useConnections } from '../lib/state'
import type { PartialConnection } from '../lib/connection'
import { Link } from '@tanstack/react-router'

interface ConnectionFormProps {
  onSuccess?: () => void
}

export function ConnectionForm({ onSuccess }: ConnectionFormProps) {
  const { addConnection } = useConnections()
  const [formData, setFormData] = useState<PartialConnection>({
    name: '',
    address: '',
    key: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      addConnection(formData)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add connection:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof PartialConnection) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Vault Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={handleChange('name')}
          required
          spellCheck={false}
          autoCapitalize="off"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="my-vault"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Server Address
        </label>
        <input
          type="url"
          id="address"
          spellCheck={false}
          autoCapitalize="off"
          value={formData.address}
          onChange={handleChange('address')}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com:3000"
        />
      </div>

      <div>
        <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
          Auth Key
        </label>
        <input
          type="password"
          id="key"
          spellCheck={false}
          autoCapitalize="off"
          value={formData.key}
          onChange={handleChange('key')}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your authentication key"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Adding...' : 'Add Connection'}
      </button>
      <Link 
        className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        to="/"
      >

        Cancel
      </Link>
    </form>
  )
}
