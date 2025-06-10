import {Trash2 } from 'lucide-react';
import { DataTable, EmptyState } from '@/components/table';


export function UserAccess() {
  return (

    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">User Permissions</h2>
        </div>

        <DataTable headers={["User", "Email", "Read", "Write", "Actions"]}>
          {access.length === 0 ? (
            <EmptyState message="No users with access" colSpan={5} />
          ) : (
            access.map((user) => (
              <tr key={user.id} className="hover">
                <td>
                  <div className="font-medium">{user.id}</div>
                </td>
                <td>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={user.read}
                    onChange={() => togglePermission(user.id, 'read')}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={user.write}
                    onChange={() => togglePermission(user.id, 'write')}
                  />
                </td>
                <td>
                  <button
                    onClick={() => removeUser(user.id)}
                    className="btn btn-ghost btn-sm text-error gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>
    </div>
  )

}
