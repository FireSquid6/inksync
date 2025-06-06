import { useState, useEffect } from "react";
import { Modal } from "./modal";
import { FolderPlus } from "lucide-react";

interface CreateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { directory: string; vaultName: string }) => void;
  loading?: boolean;
}

export function CreateVaultModal({ isOpen, loading, onClose, onSubmit }: CreateVaultModalProps) {
  const [directory, setDirectory] = useState("");
  const [vaultName, setVaultName] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDirectory("");
      setVaultName("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (directory.trim() && vaultName.trim()) {
      onSubmit({
        directory: directory.trim(),
        vaultName: vaultName.trim()
      });
    }
  };

  const isFormValid = directory.trim() && vaultName.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Vault"
      size="md"
      actions={
        <div className="flex gap-2">
          <button 
            type="button" 
            className="btn" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="create-vault-form"
            className="btn btn-primary"
            disabled={!isFormValid || loading}
          >
            <FolderPlus className="w-4 h-4" />
            Create Vault
          </button>
        </div>
      }
    >
      <form id="create-vault-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Directory Path</span>
          </label>
          <input
            type="text"
            placeholder="/path/to/directory"
            className="input input-bordered w-full"
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            required
          />
          <label className="label">
            <span className="label-text-alt">Path relative to your store directory to sync to</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Vault Name</span>
          </label>
          <input
            type="text"
            placeholder="my-vault"
            className="input input-bordered w-full"
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            required
          />
          <label className="label">
            <span className="label-text-alt">Unique name for this vault</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}
