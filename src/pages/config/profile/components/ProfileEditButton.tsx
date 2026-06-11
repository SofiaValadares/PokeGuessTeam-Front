import { Pencil } from 'lucide-react';
import styles from '../profile.module.css';

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function ProfileEditButton({ label, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      className={styles.editIconBtn}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Pencil size={14} aria-hidden />
    </button>
  );
}
