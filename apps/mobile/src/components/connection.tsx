import { SyncResult } from "libinksync";
import { Connection, ConnectionStatus } from "../lib/connection";
import { CgPushUp, CgPushDown, CgCheck, CgFileRemove } from "react-icons/cg";
import { TbDeviceIpadCancel } from "react-icons/tb";
import { LuServerOff } from "react-icons/lu";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileInput, TextInput } from "./form";
import { FaXmark } from "react-icons/fa6";

export function AddConnectionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (dialog === null) {
      return;
    }

    if (isOpen) {
      dialog.show();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const [vaultName, setVaultName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [directory, setDirectory] = useState<string>("Chosen directory");


  return (
    <dialog ref={ref} open={isOpen} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className="modal-box">
        <div className="flex flex-row">
          <h2 className="text-2xl font-bold w-full">Add New Connection</h2>
          <button onClick={onClose} className="btn btn-error btn-outline btn-circle">
            <FaXmark size={32} />
          </button>
        </div>
        <form className="py-4">
          <TextInput label="Address" state={address} onChange={setAddress} />
          <TextInput label="Vault Name" state={vaultName} onChange={setVaultName} />
          <FileInput state={directory} setState={setDirectory} type="directory" />
          <div className="flex flex-col w-full">
            <button className="btn btn-primary mt-16 mx-auto">Submit</button>
          </div>
        </form>
      </div>
    </dialog>
  )

}

export function ConnectionButton({ connection }: { connection: Connection }) {
  // TODO - change color for status
  return (
    <div className="bg-base-100 rounded-lg shadow-sm mb-3 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">{connection.vaultName}</h2>
          <div className="text-sm text-gray-400">
            <p>Directory: {connection.syncDirectory}</p>
            <p>Address: {connection.address}</p>
            <p>Last sync: {formatDate(connection.lastSync.time)}</p>
            <p>Status: {connection.status}</p>
          </div>
        </div>
        <div className="flex flex-row gap-3">
          <Link
            to="/$connection"
            params={{
              connection: connection.id.toString(),
            }}
            className="btn btn-primary btn-outline"
          >
            Details
          </Link>
          <button
            className="btn btn-primary"
          >
            Sync
          </button>
        </div>
      </div>
    </div>
  )
}
export function StatusBadge({ status }: { status: ConnectionStatus }) {
  const classes: Record<ConnectionStatus, string> = {
    connected: "badge-success",
    disconnected: "badge-error",
    syncing: "badge-warning",
  }

  return (
    <span className={`badge ${classes[status]}`}>
      {status}
    </span>
  );
}


export function SyncResultItem({ result, filepath }: { result: SyncResult, filepath: string }) {
  const syncResultMap: Record<string, React.ReactNode> = {
    "pushed": <CgPushUp />,
    "pulled": <CgPushDown />,
    "in-sync": <CgCheck />,
    "client-error": <TbDeviceIpadCancel />,
    "server-error": <LuServerOff />,
    "conflict": <CgFileRemove />
  }

  return (
    <p>
      <span>
        {syncResultMap[result.type]}
      </span>
      <span>
        {result.type}
      </span>
      <span>
        {filepath}
      </span>

    </p>
  )
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
