import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  actions?: ReactNode;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "md", 
  actions 
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "modal-box w-11/12 max-w-md",
    md: "modal-box w-11/12 max-w-2xl",
    lg: "modal-box w-11/12 max-w-4xl",
    xl: "modal-box w-11/12 max-w-6xl"
  };

  return (
    <div className="modal modal-open">
      <div className={sizeClasses[size]}>
        {/* Modal header */}
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <h3 className="text-lg font-bold">{title}</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal content */}
        <div className="py-4">
          {children}
        </div>

        {/* Modal actions */}
        {actions && (
          <div className="modal-action">
            {actions}
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "secondary" | "accent" | "error" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary"
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      actions={
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`btn btn-${confirmVariant}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-base-content/80">{message}</p>
    </Modal>
  );
}
