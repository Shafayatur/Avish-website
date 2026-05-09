import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ open, title = "Delete?", message = "This action cannot be undone.", onConfirm, onCancel }: Props) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card rounded-2xl p-8 max-w-sm w-full text-center bg-background"
        >
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-destructive" />
          </div>
          <h3 className="font-display text-xl mb-2">{title}</h3>
          <p className="font-body text-sm text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={onConfirm}>Delete</Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmModal;
