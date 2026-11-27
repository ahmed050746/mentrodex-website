import { PortalLogoutButton } from "./PortalLogoutButton";
import styles from "./portal.module.css";

export function PortalEmptyLessons() {
  return (
    <div className={styles.portalPage}>
      <div className={styles.emptyState}>
        <p className={styles.brand}>Mentrodex</p>
        <h1>No lessons published yet</h1>
        <p>Check back soon — your mentor is preparing the course library.</p>
        <PortalLogoutButton />
      </div>
    </div>
  );
}