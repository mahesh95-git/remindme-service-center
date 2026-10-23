import { RecordsPage } from '../features/records/RecordsPage'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function VehiclesPage() {
  return <RecordsPage kind="vehicles" action={<Link to="/vehicles/new" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"><Plus size={15} />Add vehicle</Link>} />
}
