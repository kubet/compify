import styles from "./button.module.css";

type ButtonProps = { label: string; disabled?: boolean };

export function Button({ label, disabled = false }: ButtonProps) {
  return <button className={styles.button} disabled={disabled}>{label}</button>;
}
