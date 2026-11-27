import { PortalLogoutButton } from "./PortalLogoutButton";
import styles from "./portal.module.css";

type Props = {
  displayName: string | null;
  lessonTitle: string;
};

export function PortalLessonPlaceholder({ displayName, lessonTitle }: Props) {
  const name = displayName?.trim() || "Student";
  return (
    <div className={styles.portalPage}>
      <div className={styles.placeholderPanel}>
        <p className={styles.brand}>Mentrodex</p>
        <h1>Welcome, {name}</h1>
        <p className={styles.lessonTitle}>{lessonTitle}</p>
        <p className={styles.muted}>
          Video player and lesson navigation arrive in the next step.
        </p>
        <PortalLogoutButton />
      </div>
    </div>
  );
}