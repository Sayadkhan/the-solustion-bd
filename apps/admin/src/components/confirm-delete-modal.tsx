"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemName?: string;
  itemType?: string;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Permanent Deletion",
  itemName,
  itemType = "item",
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                Delete {itemType} record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete{" "}
            {itemName ? (
              <strong className="text-foreground font-bold">"{itemName}"</strong>
            ) : (
              "this item"
            )}
            ? This action cannot be reversed and will update all related database relations.
          </p>

          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <Trash2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Warning: All linked inventory items, serial numbers, and category associations will be unlinked or removed from PostgreSQL.
            </span>
          </div>
        </div>

        {/* Action Buttons (Yes or No) */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors disabled:opacity-50"
          >
            No, Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
