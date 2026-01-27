import React from "react";
import { useAdmin } from "../components/tools/CheckUser";

export default function AdminPanel() {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <div>Loading...</div>;

  return (
    <div>GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
      {isAdmin ? (
        <div>Welcome, Admin! You can manage products here.</div>
      ) : (
        <div>You do not have admin access.</div>
      )}
    </div>
  );
}
