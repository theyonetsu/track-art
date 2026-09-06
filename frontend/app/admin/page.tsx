import { redirect } from "next/navigation";

/** /admin seul : on envoie vers l'espace, qui redirige lui-même vers la connexion si besoin. */
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
